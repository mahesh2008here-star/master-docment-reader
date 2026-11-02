/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  FileText,
  UploadCloud,
  Clock,
  Bookmark,
  HardDrive,
  ShieldCheck,
  ChevronRight,
  FolderLock,
  Layers,
  Heart,
  FileSpreadsheet,
  Presentation,
  FileCode,
  Sparkles
} from 'lucide-react';
import { DocumentItem, DocumentFormat } from '../types/document';
import { DocumentCard, formatFileSize } from './DocumentCard';

interface HomeScreenProps {
  documents: DocumentItem[];
  recentDocuments: DocumentItem[];
  favoriteDocuments: DocumentItem[];
  accentColor?: string;
  storagePermissionGranted?: boolean;
  onRequestPermissions?: () => void;
  onOpenDocument: (doc: DocumentItem) => void;
  onSelectCategory: (format: DocumentFormat) => void;
  onOpenImport: () => void;
  onToggleFavorite: (doc: DocumentItem) => void;
  onShowDetails: (doc: DocumentItem) => void;
  onRename: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
  onShare: (doc: DocumentItem) => void;
  onNavigateToFiles: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  documents,
  recentDocuments,
  favoriteDocuments,
  accentColor = '#f59e0b',
  storagePermissionGranted = true,
  onRequestPermissions,
  onOpenDocument,
  onSelectCategory,
  onOpenImport,
  onToggleFavorite,
  onShowDetails,
  onRename,
  onDelete,
  onShare,
  onNavigateToFiles,
}) => {
  const totalSizeBytes = documents.reduce((sum, d) => sum + d.sizeBytes, 0);

  const categories: Array<{ id: DocumentFormat; label: string; count: number; icon: any; color: string }> = [
    {
      id: 'pdf',
      label: 'PDFs',
      count: documents.filter((d) => d.format === 'pdf').length,
      icon: FileText,
      color: '#e11d48',
    },
    {
      id: 'docx',
      label: 'Word',
      count: documents.filter((d) => ['docx', 'doc'].includes(d.format)).length,
      icon: FileText,
      color: '#2563eb',
    },
    {
      id: 'xlsx',
      label: 'Sheets',
      count: documents.filter((d) => ['xlsx', 'xls', 'csv'].includes(d.format)).length,
      icon: FileSpreadsheet,
      color: '#059669',
    },
    {
      id: 'pptx',
      label: 'Slides',
      count: documents.filter((d) => ['pptx', 'ppt'].includes(d.format)).length,
      icon: Presentation,
      color: '#d97706',
    },
    {
      id: 'txt',
      label: 'Notes & MD',
      count: documents.filter((d) => ['txt', 'md'].includes(d.format)).length,
      icon: FileCode,
      color: '#475569',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 max-w-2xl mx-auto w-full space-y-6 pb-28 text-stone-900 dark:text-stone-100">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Master Documents Custom Retro-Modern Vector Icon */}
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, #4f46e5)`,
            }}
          >
            <Layers className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight">Master Documents</h1>
              <span
                className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md text-white shadow-xs"
                style={{ backgroundColor: accentColor }}
              >
                Offline
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              Retro-Modern Document Workstation
            </p>
          </div>
        </div>

        {/* Quick Import Action */}
        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-white text-xs font-bold shadow-md active:scale-95 transition-transform"
          style={{ backgroundColor: accentColor }}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Import</span>
        </button>
      </div>

      {/* Storage Permission Alert Banner (if not granted) */}
      {!storagePermissionGranted && onRequestPermissions && (
        <div
          onClick={onRequestPermissions}
          className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 cursor-pointer group active:scale-98 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200 group-hover:underline">
                Storage Permission Required
              </div>
              <div className="text-[11px] text-amber-700/80 dark:text-amber-400">
                Tap to grant offline storage access to scan device documents
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}

      {/* Hero Welcome & Privacy Card */}
      <div className="droplert-card rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-stone-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Zero-Cloud Local Engine
          </span>
          <span className="font-mono text-[11px] text-stone-400 tabular-nums">
            {documents.length} files • {formatFileSize(totalSizeBytes)}
          </span>
        </div>

        <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
          Fast, beautiful reading with zero distractions
        </h2>

        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
          Read PDFs, Word files, Excel spreadsheets, presentations, and markdown completely offline.
          No accounts, no advertisements, and no tracking.
        </p>
      </div>

      {/* Category Pills Strip */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-bold text-stone-700 dark:text-stone-300">File Formats</span>
          <button
            onClick={onNavigateToFiles}
            className="font-semibold hover:underline flex items-center gap-0.5"
            style={{ color: accentColor }}
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="droplert-card p-3 rounded-2xl text-left transition-all group active:scale-95"
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-white mb-2 shadow-xs"
                  style={{ backgroundColor: cat.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-500 transition-colors">
                  {cat.label}
                </div>
                <div className="text-[10px] text-stone-400 mt-0.5 tabular-nums">
                  {cat.count} files
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recently Opened Documents */}
      {recentDocuments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-1.5 font-bold text-stone-700 dark:text-stone-300">
              <Clock className="w-3.5 h-3.5" style={{ color: accentColor }} />
              <span>Continue Reading</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {recentDocuments.slice(0, 3).map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                viewLayout="list"
                onOpen={onOpenDocument}
                onToggleFavorite={onToggleFavorite}
                onShowDetails={onShowDetails}
                onRename={onRename}
                onDelete={onDelete}
                onShare={onShare}
              />
            ))}
          </div>
        </div>
      )}

      {/* Favorite Documents */}
      {favoriteDocuments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-1.5 font-bold text-stone-700 dark:text-stone-300">
              <Bookmark className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Starred Collection</span>
            </div>
            <button
              onClick={onNavigateToFiles}
              className="font-semibold hover:underline"
              style={{ color: accentColor }}
            >
              See all
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {favoriteDocuments.slice(0, 4).map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                viewLayout="grid"
                onOpen={onOpenDocument}
                onToggleFavorite={onToggleFavorite}
                onShowDetails={onShowDetails}
                onRename={onRename}
                onDelete={onDelete}
                onShare={onShare}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
