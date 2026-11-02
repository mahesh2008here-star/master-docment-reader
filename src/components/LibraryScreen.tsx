/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List,
  UploadCloud,
  FileQuestion,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { DocumentItem, DocumentFormat } from '../types/document';
import { DocumentCard } from './DocumentCard';

interface LibraryScreenProps {
  documents: DocumentItem[];
  selectedCategory: DocumentFormat | null;
  onClearCategory: () => void;
  onOpenDocument: (doc: DocumentItem) => void;
  onOpenImport: () => void;
  onToggleFavorite: (doc: DocumentItem) => void;
  onShowDetails: (doc: DocumentItem) => void;
  onRename: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
  onShare: (doc: DocumentItem) => void;
  onResetSamples: () => void;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  documents,
  selectedCategory,
  onClearCategory,
  onOpenDocument,
  onOpenImport,
  onToggleFavorite,
  onShowDetails,
  onRename,
  onDelete,
  onShare,
  onResetSamples,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFormatFilter, setActiveFormatFilter] = useState<string>(selectedCategory || 'all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'type'>('date');
  const [sortAscending, setSortAscending] = useState<boolean>(false);
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  const filterChips = [
    { id: 'all', label: 'All Files' },
    { id: 'pdf', label: 'PDF' },
    { id: 'docx', label: 'Word' },
    { id: 'xlsx', label: 'Excel' },
    { id: 'pptx', label: 'Slides' },
    { id: 'txt', label: 'Text & MD' },
    { id: 'image', label: 'Images' },
  ];

  // Filtering
  let filtered = documents.filter((doc) => {
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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Search & Filter Bar */}
      <div className="p-4 border-b border-stone-200/60 dark:border-stone-800/60 space-y-3 bg-white/50 dark:bg-stone-900/50 backdrop-blur-md">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by name or type..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/60 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400 hover:text-stone-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Format Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
          {filterChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => {
                setActiveFormatFilter(chip.id);
                if (selectedCategory) onClearCategory();
              }}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all ${
                activeFormatFilter === chip.id
                  ? 'bg-amber-600 text-white shadow-xs font-semibold'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Controls: Sort and Layout Toggle */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {filtered.length}
            </span>
            <span>documents</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-stone-700 dark:text-stone-300 focus:outline-hidden cursor-pointer"
              >
                <option value="date" className="dark:bg-stone-900">Recent</option>
                <option value="name" className="dark:bg-stone-900">Name</option>
                <option value="size" className="dark:bg-stone-900">Size</option>
                <option value="type" className="dark:bg-stone-900">Format</option>
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
            <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl">
              <button
                onClick={() => setViewLayout('grid')}
                className={`p-1 rounded-lg transition-colors ${
                  viewLayout === 'grid'
                    ? 'bg-white dark:bg-stone-700 text-amber-600 shadow-xs'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewLayout('list')}
                className={`p-1 rounded-lg transition-colors ${
                  viewLayout === 'list'
                    ? 'bg-white dark:bg-stone-700 text-amber-600 shadow-xs'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Document Grid / List Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
              <FileQuestion className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
              No Documents Found
            </h3>
            <p className="text-xs text-stone-400 max-w-xs mt-1 mb-5">
              {searchQuery
                ? `No files matching "${searchQuery}". Try adjusting your filters.`
                : 'Import documents from your device storage or restore sample files.'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenImport}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-600 text-white text-xs font-semibold shadow-md shadow-amber-600/20 hover:bg-amber-500 transition-all active:scale-95"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Import File</span>
              </button>
              <button
                onClick={onResetSamples}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-300 dark:hover:bg-stone-700 transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restore Samples</span>
              </button>
            </div>
          </div>
        ) : viewLayout === 'grid' ? (
          <div className="grid grid-cols-2 gap-3.5 pb-28 max-w-2xl mx-auto">
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
          <div className="space-y-2.5 pb-28 max-w-2xl mx-auto">
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
    </div>
  );
};
