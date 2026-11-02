/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  DocumentItem,
  DocumentFormat,
  AppPreferences,
  ReaderTheme
} from './types/document';
import {
  getAllDocuments,
  saveDocument,
  updateDocument,
  deleteDocument,
  toggleFavorite,
  recordReadingProgress,
  addBookmark,
  removeBookmark,
  clearReadingHistory,
  clearThumbnailCache,
  getPreferences,
  savePreferences,
  getStorageStats
} from './services/storage';
import { seedSampleDocumentsIfEmpty } from './services/sampleDocuments';
import { BottomNav, NavTab } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { ToolsScreen } from './components/ToolsScreen';
import { LockerScreen } from './components/LockerScreen';
import { SupportScreen } from './components/SupportScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { ReaderToolbar } from './components/Reader/ReaderToolbar';
import { PdfReader } from './components/Reader/PdfReader';
import { DocxReader } from './components/Reader/DocxReader';
import { SpreadsheetReader } from './components/Reader/SpreadsheetReader';
import { PresentationReader } from './components/Reader/PresentationReader';
import { TextViewer } from './components/Reader/TextViewer';
import { ImageViewer } from './components/Reader/ImageViewer';
import { ImportModal } from './components/Dialogs/ImportModal';
import { DocumentDetailsDialog } from './components/Dialogs/DocumentDetailsDialog';
import { RenameDialog, DeleteConfirmDialog } from './components/Dialogs/RenameDialog';
import { CompatibilityMatrixModal } from './components/Dialogs/CompatibilityMatrixModal';
import { PermissionsModal } from './components/Dialogs/PermissionsModal';

export default function App() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [preferences, setPreferences] = useState<AppPreferences | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab | 'support'>('home');
  const [activeDocument, setActiveDocument] = useState<DocumentItem | null>(null);

  // Reader UI State
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>('light');
  const [readerZoom, setReaderZoom] = useState<number>(1.0);
  const [readerRotation, setReaderRotation] = useState<number>(0);
  const [readerSearchOpen, setReaderSearchOpen] = useState<boolean>(false);
  const [distractionFree, setDistractionFree] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Dialogs State
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState<boolean>(false);
  const [detailsDoc, setDetailsDoc] = useState<DocumentItem | null>(null);
  const [renameDoc, setRenameDoc] = useState<DocumentItem | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<DocumentItem | null>(null);
  const [compatibilityModalOpen, setCompatibilityModalOpen] = useState<boolean>(false);

  // Load preferences and documents on startup
  const refreshDocuments = useCallback(async () => {
    const docs = await getAllDocuments();
    setDocuments(docs);
  }, []);

  useEffect(() => {
    async function init() {
      const prefs = await getPreferences();
      setPreferences(prefs);
      setReaderTheme(prefs.readerSettings.theme);

      let docs = await getAllDocuments();
      if (docs.length === 0) {
        docs = await seedSampleDocumentsIfEmpty(docs, saveDocument);
      }
      setDocuments(docs);

      // Prompt for storage permission once if not yet granted
      if (!prefs.storagePermissionGranted) {
        setTimeout(() => setPermissionsModalOpen(true), 800);
      }
    }
    init();
  }, []);

  // Theme Sync (Light / Dark / System)
  useEffect(() => {
    if (!preferences) return;
    const isDark =
      preferences.themeMode === 'dark' ||
      (preferences.themeMode === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences?.themeMode]);

  // Dynamic Custom Accent Color Sync to CSS Variables
  useEffect(() => {
    if (!preferences?.accentColor) return;
    const hex = preferences.accentColor;
    document.documentElement.style.setProperty('--accent-color', hex);

    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      document.documentElement.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
      document.documentElement.style.setProperty('--accent-light', `rgba(${r}, ${g}, ${b}, 0.14)`);
      document.documentElement.style.setProperty('--accent-border', `rgba(${r}, ${g}, ${b}, 0.35)`);
    }
  }, [preferences?.accentColor]);

  const handleUpdatePreferences = async (updates: Partial<AppPreferences>) => {
    if (!preferences) return;
    const updated = { ...preferences, ...updates };
    setPreferences(updated);
    await savePreferences(updated);
  };

  const handleGrantPermissions = async () => {
    await handleUpdatePreferences({ storagePermissionGranted: true });
    setPermissionsModalOpen(false);
  };

  // Document Operations
  const handleOpenDocument = (doc: DocumentItem) => {
    setActiveDocument(doc);
    setDistractionFree(false);
    setReaderSearchOpen(false);
    setReaderRotation(0);
    setReaderZoom(1.0);
  };

  const handleToggleFavorite = async (doc: DocumentItem) => {
    const newFav = await toggleFavorite(doc.id);
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, isFavorite: newFav } : d))
    );
    if (activeDocument && activeDocument.id === doc.id) {
      setActiveDocument((prev) => (prev ? { ...prev, isFavorite: newFav } : null));
    }
  };

  const handleToggleVaultState = async (docId: string, isVaulted: boolean) => {
    await updateDocument(docId, { isVaulted });
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, isVaulted } : d))
    );
    if (activeDocument && activeDocument.id === docId) {
      setActiveDocument((prev) => (prev ? { ...prev, isVaulted } : null));
    }
  };

  const handleUpdateVaultPin = async (newPin: string) => {
    await handleUpdatePreferences({ vaultPin: newPin });
  };

  const handlePageChange = async (page: number, total: number) => {
    if (!activeDocument) return;
    await recordReadingProgress(activeDocument.id, page, total);
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === activeDocument.id
          ? { ...d, lastPageRead: page, pageCount: total, lastOpenedAt: Date.now() }
          : d
      )
    );
  };

  const handleAddBookmark = async (pageNumber: number) => {
    if (!activeDocument) return;
    const bm = await addBookmark(activeDocument.id, pageNumber, `Page ${pageNumber}`);
    const updatedBookmarks = [...(activeDocument.bookmarks || []), bm];
    setActiveDocument({ ...activeDocument, bookmarks: updatedBookmarks });
    setDocuments((prev) =>
      prev.map((d) => (d.id === activeDocument.id ? { ...d, bookmarks: updatedBookmarks } : d))
    );
  };

  const handleRemoveBookmark = async (bookmarkId: string) => {
    if (!activeDocument) return;
    await removeBookmark(activeDocument.id, bookmarkId);
    const updatedBookmarks = (activeDocument.bookmarks || []).filter((b) => b.id !== bookmarkId);
    setActiveDocument({ ...activeDocument, bookmarks: updatedBookmarks });
    setDocuments((prev) =>
      prev.map((d) => (d.id === activeDocument.id ? { ...d, bookmarks: updatedBookmarks } : d))
    );
  };

  const handleRenameConfirm = async (newName: string) => {
    if (!renameDoc) return;
    await updateDocument(renameDoc.id, { name: newName });
    await refreshDocuments();
    if (activeDocument && activeDocument.id === renameDoc.id) {
      setActiveDocument((prev) => (prev ? { ...prev, name: newName } : null));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDoc) return;
    await deleteDocument(deleteDoc.id);
    await refreshDocuments();
    if (activeDocument && activeDocument.id === deleteDoc.id) {
      setActiveDocument(null);
    }
  };

  const handleShare = (doc: DocumentItem) => {
    if (navigator.share) {
      navigator
        .share({
          title: doc.name,
          text: `Reading ${doc.name} offline on Master Documents`,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(doc.name);
    }
  };

  const handleImportComplete = async (newDocs: DocumentItem[]) => {
    for (const doc of newDocs) {
      await saveDocument(doc);
    }
    await refreshDocuments();
    if (newDocs.length === 1) {
      handleOpenDocument(newDocs[0]);
    }
  };

  const handleResetSamples = async () => {
    for (const doc of documents) {
      await deleteDocument(doc.id);
    }
    const fresh = await seedSampleDocumentsIfEmpty([], saveDocument);
    setDocuments(fresh);
  };

  if (!preferences) {
    return null;
  }

  const recentDocs = [...documents].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
  const favoriteDocs = documents.filter((d) => d.isFavorite);
  const vaultedDocs = documents.filter((d) => d.isVaulted);
  const accent = preferences.accentColor || '#f59e0b';

  // Active Document Reader Screen
  if (activeDocument) {
    const hasBookmarkOnCurrentPage = Boolean(
      activeDocument.bookmarks?.some((b) => b.pageNumber === activeDocument.lastPageRead)
    );

    return (
      <div className="relative w-full h-screen flex flex-col overflow-hidden bg-stone-900 text-stone-100 animate-document-open">
        {/* Reader Top Toolbar */}
        <ReaderToolbar
          document={activeDocument}
          theme={readerTheme}
          isFullscreen={isFullscreen}
          searchOpen={readerSearchOpen}
          hasBookmark={hasBookmarkOnCurrentPage}
          zoom={readerZoom}
          rotation={readerRotation}
          visible={!distractionFree}
          onBack={() => setActiveDocument(null)}
          onToggleSearch={() => setReaderSearchOpen(!readerSearchOpen)}
          onToggleBookmark={() => {
            if (hasBookmarkOnCurrentPage) {
              const bm = activeDocument.bookmarks?.find(
                (b) => b.pageNumber === activeDocument.lastPageRead
              );
              if (bm) handleRemoveBookmark(bm.id);
            } else {
              handleAddBookmark(activeDocument.lastPageRead || 1);
            }
          }}
          onZoomIn={() => setReaderZoom((z) => Math.min(3.0, z + 0.25))}
          onZoomOut={() => setReaderZoom((z) => Math.max(0.5, z - 0.25))}
          onRotate={() => setReaderRotation((r) => (r + 90) % 360)}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onChangeTheme={(t) => setReaderTheme(t)}
          onShowDetails={() => setDetailsDoc(activeDocument)}
        />

        {/* Reader Engine Switcher */}
        <div className="flex-1 w-full h-full pt-12 overflow-hidden flex flex-col">
          {activeDocument.format === 'pdf' && (
            <PdfReader
              document={activeDocument}
              theme={readerTheme}
              rotation={readerRotation}
              zoom={readerZoom}
              searchOpen={readerSearchOpen}
              onPageChange={handlePageChange}
              onToggleDistractionFree={() => setDistractionFree(!distractionFree)}
              onAddBookmark={handleAddBookmark}
              onRemoveBookmark={handleRemoveBookmark}
            />
          )}

          {['docx', 'doc'].includes(activeDocument.format) && (
            <DocxReader
              document={activeDocument}
              theme={readerTheme}
              searchOpen={readerSearchOpen}
              onToggleDistractionFree={() => setDistractionFree(!distractionFree)}
            />
          )}

          {['xlsx', 'xls', 'csv'].includes(activeDocument.format) && (
            <SpreadsheetReader
              document={activeDocument}
              theme={readerTheme}
              searchOpen={readerSearchOpen}
              onToggleDistractionFree={() => setDistractionFree(!distractionFree)}
            />
          )}

          {['pptx', 'ppt'].includes(activeDocument.format) && (
            <PresentationReader
              document={activeDocument}
              theme={readerTheme}
              searchOpen={readerSearchOpen}
              onToggleDistractionFree={() => setDistractionFree(!distractionFree)}
            />
          )}

          {['txt', 'md'].includes(activeDocument.format) && (
            <TextViewer
              document={activeDocument}
              theme={readerTheme}
              searchOpen={readerSearchOpen}
              onToggleDistractionFree={() => setDistractionFree(!distractionFree)}
            />
          )}

          {activeDocument.format === 'image' && (
            <ImageViewer
              document={activeDocument}
              theme={readerTheme}
              zoom={readerZoom}
              rotation={readerRotation}
              onToggleDistractionFree={() => setDistractionFree(!distractionFree)}
            />
          )}
        </div>

        {/* Document Details Dialog */}
        <DocumentDetailsDialog
          document={detailsDoc}
          onClose={() => setDetailsDoc(null)}
        />
      </div>
    );
  }

  // Primary Application View (Home / Tools / Locker / Settings / Support)
  return (
    <div className="min-h-screen w-full flex flex-col bg-stone-100/90 dark:bg-black text-stone-900 dark:text-stone-100 transition-colors">
      {/* Active Screen Viewport */}
      <main className="flex-1 flex flex-col w-full h-full overflow-hidden">
        {currentTab === 'home' && (
          <HomeScreen
            documents={documents}
            recentDocuments={recentDocs}
            favoriteDocuments={favoriteDocs}
            accentColor={accent}
            storagePermissionGranted={preferences.storagePermissionGranted}
            onRequestPermissions={() => setPermissionsModalOpen(true)}
            onOpenDocument={handleOpenDocument}
            onOpenImport={() => setImportModalOpen(true)}
            onToggleFavorite={handleToggleFavorite}
            onShowDetails={(doc) => setDetailsDoc(doc)}
            onRename={(doc) => setRenameDoc(doc)}
            onDelete={(doc) => setDeleteDoc(doc)}
            onShare={handleShare}
            onResetSamples={handleResetSamples}
            onMoveToLocker={(doc) => handleToggleVaultState(doc.id, true)}
          />
        )}

        {currentTab === 'tools' && (
          <ToolsScreen
            documents={documents}
            accentColor={accent}
            onOpenDocument={handleOpenDocument}
          />
        )}

        {currentTab === 'locker' && (
          <LockerScreen
            documents={documents}
            vaultPin={preferences.vaultPin || '1234'}
            accentColor={accent}
            onOpenDocument={handleOpenDocument}
            onToggleVaultState={handleToggleVaultState}
            onOpenImport={() => setImportModalOpen(true)}
            onUpdatePin={handleUpdateVaultPin}
            onDeleteDocument={(doc) => setDeleteDoc(doc)}
          />
        )}

        {currentTab === 'support' && (
          <SupportScreen
            accentColor={accent}
            onBack={() => setCurrentTab('settings')}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsScreen
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            onRequestPermissions={() => setPermissionsModalOpen(true)}
            onNavigateToSupport={() => setCurrentTab('support')}
          />
        )}
      </main>

      {/* Apple-Inspired Liquid Glass Floating Dock */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        vaultedCount={vaultedDocs.length}
        accentColor={accent}
      />

      {/* Global Dialogs */}
      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />

      <PermissionsModal
        isOpen={permissionsModalOpen}
        onClose={() => setPermissionsModalOpen(false)}
        onGrantPermission={handleGrantPermissions}
        accentColor={accent}
      />

      <DocumentDetailsDialog
        document={detailsDoc}
        onClose={() => setDetailsDoc(null)}
      />

      <RenameDialog
        document={renameDoc}
        isOpen={renameDoc !== null}
        onClose={() => setRenameDoc(null)}
        onConfirm={handleRenameConfirm}
      />

      <DeleteConfirmDialog
        document={deleteDoc}
        isOpen={deleteDoc !== null}
        onClose={() => setDeleteDoc(null)}
        onConfirm={handleDeleteConfirm}
      />

      <CompatibilityMatrixModal
        isOpen={compatibilityModalOpen}
        onClose={() => setCompatibilityModalOpen(false)}
      />
    </div>
  );
}
