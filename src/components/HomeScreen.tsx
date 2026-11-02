/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  FileSpreadsheet,
  Presentation,
  FileCode,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  FileQuestion,
  RefreshCw,
  Sparkles,
  Lock
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
  onOpenImport: () => void;
  onToggleFavorite: (doc: DocumentItem) => void;
  onShowDetails: (doc: DocumentItem) => void;
  onRename: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
  onShare: (doc: DocumentItem) => void;
  onResetSamples: () => void;
  onMoveToLocker?: (doc: DocumentItem) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  documents,
  recentDocuments,
  favoriteDocuments,
  accentColor = '#f59e0b',
  storagePermissionGranted = true,
  onRequestPermissions,
  onOpenDocument,
  onOpenImport,
  onToggleFavorite,
  onShowDetails,
  onRename,
  onDelete,
  onShare,
  onResetSamples,
  onMoveToLocker,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFormatFilter, setActiveFormatFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'type'>('date');
  const [sortAscending, setSortAscending] = useState<boolean>(false);
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  // Filter out vaulted documents from public home screen
  const unvaultedDocs = documents.filter((d) => !d.isVaulted);

  const categories: Array<{ id: string; label: string; count: number; icon: any; color: string }> = [
    {
      id: 'all',
      label: 'All Files',
      count: unvaultedDocs.length,
      icon: Layers,
      color: accentColor,
    },
    {
      id: 'pdf',
      label: 'PDFs',
      count: unvaultedDocs.filter((d) => d.format === 'pdf').length,
      icon: FileText,
      color: '#e11d48',
    },
    {
      id: 'docx',
      label: 'Word',
      count: unvaultedDocs.filter((d) => ['docx', 'doc'].includes(d.format)).length,
      icon: FileText,
      color: '#2563eb',
    },
    {
      id: 'xlsx',
      label: 'Sheets',
      count: unvaultedDocs.filter((d) => ['xlsx', 'xls', 'csv'].includes(d.format)).length,
      icon: FileSpreadsheet,
      color: '#059669',
    },
    {
      id: 'pptx',
      label: 'Slides',
      count: unvaultedDocs.filter((d) => ['pptx', 'ppt'].includes(d.format)).length,
      icon: Presentation,
      color: '#d97706',
    },
    {
      id: 'txt',
      label: 'Notes & MD',
      count: unvaultedDocs.filter((d) => ['txt', 'md'].includes(d.format)).length,
      icon: FileCode,
      color: '#475569',
    },
  ];

  // Filtering
  let filtered = unvaultedDocs.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.format.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFormatFilter === 'all') return true;
    if (activeFormatFilter === 'docx') return ['docx', 'doc'].includes(doc.format);
    if (activeFormatFilter === 'xlsx') return ['xlsx', 'xls', 'csv'].includes(doc.format);
    if (activeFormatFilter === 'pptx') return ['pptx', 'ppt'].includes(doc.format);
    if (activeFormatFilter === 'txt') return ['txt', 'md'].includes(doc.format);
    return doc.format === activeFormatFilter;
  });

  // Sorting
  filtered.sort((a, b) => {
    let comp = 0;
    if (sortBy === 'name') comp = a.name.localeCompare(b.name);
    else if (sortBy === 'date') comp = b.lastOpenedAt - a.lastOpenedAt;
    else if (sortBy === 'size') comp = b.sizeBytes - a.sizeBytes;
    else if (sortBy === 'type') comp = a.format.localeCompare(b.format);

    return sortAscending ? -comp : comp;
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 max-w-2xl mx-auto w-full space-y-6 pb-28 text-stone-900 dark:text-stone-100">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, #4f46e5)`,
            }}
          >
            <Layers className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight">Master Documents</h1>
              <span
                className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md text-white shadow-xs"
                style={{ backgroundColor: accentColor }}
              >
                Offline
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              Personal Document Workstation
            </p>
          </div>
        </div>

        {/* Quick Import Action */}
        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-white text-xs font-bold shadow-md active:scale-95 transition-transform"
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, format, or keyword..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 shadow-xs transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Pills Strip */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveFormatFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-all active:scale-95 ${
                activeFormatFilter === cat.id
                  ? 'text-white shadow-md font-bold'
                  : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200/60 dark:border-stone-800/80 hover:bg-stone-50 dark:hover:bg-stone-800'
              }`}
              style={{
                backgroundColor: activeFormatFilter === cat.id ? accentColor : undefined,
              }}
            >
              <span>{cat.label}</span>
              <span className="ml-1.5 text-[10px] opacity-75 tabular-nums">({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sort & Layout Controls */}
      <div className="flex items-center justify-between text-xs text-stone-500 px-1 pt-1">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="font-bold text-stone-800 dark:text-stone-200 tabular-nums">
            {filtered.length}
          </span>
          <span>documents found</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-2.5 py-1 rounded-xl shadow-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-stone-700 dark:text-stone-300 focus:outline-hidden cursor-pointer"
            >
              <option value="date" className="dark:bg-black">Recent</option>
              <option value="name" className="dark:bg-black">Name</option>
              <option value="size" className="dark:bg-black">Size</option>
              <option value="type" className="dark:bg-black">Format</option>
            </select>
            <button
              onClick={() => setSortAscending(!sortAscending)}
              className="text-[10px] font-bold px-1 hover:text-amber-500"
              title={sortAscending ? 'Ascending' : 'Descending'}
            >
              {sortAscending ? '▲' : '▼'}
            </button>
          </div>

          {/* Layout Toggle */}
          <div className="flex items-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-0.5 rounded-xl shadow-xs">
            <button
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewLayout === 'grid'
                  ? 'text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
              style={{
                backgroundColor: viewLayout === 'grid' ? accentColor : undefined,
              }}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewLayout('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewLayout === 'list'
                  ? 'text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
              style={{
                backgroundColor: viewLayout === 'list' ? accentColor : undefined,
              }}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Document Grid / List Content */}
      <div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <FileQuestion className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200">
              No Documents in this View
            </h3>
            <p className="text-xs text-stone-400 max-w-xs mx-auto">
              {searchQuery
                ? `No documents matching "${searchQuery}".`
                : 'Import documents from your device or restore sample files.'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={onOpenImport}
                className="px-3.5 py-1.5 rounded-xl text-white text-xs font-semibold shadow-xs"
                style={{ backgroundColor: accentColor }}
              >
                Import File
              </button>
              <button
                onClick={onResetSamples}
                className="px-3.5 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold"
              >
                Restore Samples
              </button>
            </div>
          </div>
        ) : viewLayout === 'grid' ? (
          <div className="grid grid-cols-2 gap-3.5">
            {filtered.map((doc) => (
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
        ) : (
          <div className="space-y-2.5">
            {filtered.map((doc) => (
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
        )}
      </div>

      {/* Recently Read Strip (if available) */}
      {recentDocuments.length > 0 && searchQuery === '' && (
        <div className="space-y-3 pt-3 border-t border-stone-200/60 dark:border-stone-800/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 px-1">
            <Clock className="w-3.5 h-3.5" style={{ color: accentColor }} />
            <span>Recently Read</span>
          </div>

          <div className="space-y-2.5">
            {recentDocuments.slice(0, 2).map((doc) => (
              <DocumentCard
                key={'rec_' + doc.id}
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
    </div>
  );
};
