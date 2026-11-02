/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  FileCode,
  File,
  Star,
  MoreVertical,
  Info,
  Edit2,
  Trash2,
  Share2
} from 'lucide-react';
import { DocumentItem, DocumentFormat } from '../types/document';

interface DocumentCardProps {
  document: DocumentItem;
  viewLayout: 'grid' | 'list';
  onOpen: (doc: DocumentItem) => void;
  onToggleFavorite: (doc: DocumentItem) => void;
  onShowDetails: (doc: DocumentItem) => void;
  onRename: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
  onShare: (doc: DocumentItem) => void;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function getFormatTheme(format: DocumentFormat) {
  switch (format) {
    case 'pdf':
      return {
        label: 'PDF',
        icon: FileText,
        bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40',
        badge: 'bg-rose-600 text-white',
      };
    case 'docx':
    case 'doc':
      return {
        label: format.toUpperCase(),
        icon: FileText,
        bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40',
        badge: 'bg-blue-600 text-white',
      };
    case 'xlsx':
    case 'xls':
      return {
        label: format.toUpperCase(),
        icon: FileSpreadsheet,
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40',
        badge: 'bg-emerald-600 text-white',
      };
    case 'pptx':
    case 'ppt':
      return {
        label: format.toUpperCase(),
        icon: Presentation,
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/40',
        badge: 'bg-amber-600 text-white',
      };
    case 'md':
      return {
        label: 'MD',
        icon: FileCode,
        bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40',
        badge: 'bg-indigo-600 text-white',
      };
    case 'csv':
      return {
        label: 'CSV',
        icon: FileSpreadsheet,
        bg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/40',
        badge: 'bg-teal-600 text-white',
      };
    case 'image':
      return {
        label: 'IMG',
        icon: ImageIcon,
        bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/40',
        badge: 'bg-purple-600 text-white',
      };
    case 'txt':
    default:
      return {
        label: 'TXT',
        icon: File,
        bg: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800',
        badge: 'bg-stone-600 text-white',
      };
  }
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document: doc,
  viewLayout,
  onOpen,
  onToggleFavorite,
  onShowDetails,
  onRename,
  onDelete,
  onShare,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const theme = getFormatTheme(doc.format);
  const Icon = theme.icon;

  const progress = doc.pageCount && doc.pageCount > 1
    ? Math.min(100, Math.round((doc.lastPageRead / doc.pageCount) * 100))
    : 0;

  if (viewLayout === 'list') {
    return (
      <div className="droplert-card group relative flex items-center justify-between p-3.5 rounded-2xl shadow-xs transition-all duration-200">
        <div
          onClick={() => onOpen(doc)}
          className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${theme.bg}`}>
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate tracking-tight">
              {doc.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold tracking-wider ${theme.badge}`}>
                {theme.label}
              </span>
              <span>•</span>
              <span className="font-mono text-[11px] tabular-nums">{formatFileSize(doc.sizeBytes)}</span>
              <span>•</span>
              <span>{formatRelativeTime(doc.lastOpenedAt)}</span>
            </div>
            {progress > 0 && (
              <div className="mt-1.5 flex items-center gap-2 w-full max-w-[200px]">
                <div className="h-1.5 flex-1 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, backgroundColor: 'var(--accent-color, #f59e0b)' }}
                  />
                </div>
                <span className="text-[10px] font-mono text-stone-400 shrink-0 tabular-nums">{progress}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            onClick={() => onToggleFavorite(doc)}
            className={`p-1.5 rounded-lg transition-colors ${
              doc.isFavorite
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
            }`}
            title={doc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`w-4 h-4 ${doc.isFavorite ? 'fill-current' : ''}`} />
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-50 w-44 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl py-1 text-xs">
                  <button
                    onClick={() => { setMenuOpen(false); onShowDetails(doc); }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Document Info</span>
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onRename(doc); }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Rename</span>
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onShare(doc); }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share File</span>
                  </button>
                  <div className="h-px bg-stone-200 dark:bg-stone-800 my-1" />
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(doc); }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove File</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid Layout
  return (
    <div className="droplert-card group relative flex flex-col justify-between p-3.5 rounded-3xl shadow-xs transition-all duration-200 text-left">
      {/* Top Header of Card */}
      <div className="flex items-center justify-between gap-2">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider ${theme.badge}`}>
          {theme.label}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(doc);
          }}
          className={`p-1 rounded-full transition-colors ${
            doc.isFavorite
              ? 'text-amber-500 hover:text-amber-600'
              : 'text-stone-300 dark:text-stone-600 hover:text-amber-500'
          }`}
          title={doc.isFavorite ? 'Favorited' : 'Favorite'}
        >
          <Star className={`w-4 h-4 ${doc.isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Thumbnail or Format Art */}
      <div
        onClick={() => onOpen(doc)}
        className="my-3 h-24 w-full rounded-xl bg-stone-100 dark:bg-stone-800/50 flex items-center justify-center cursor-pointer overflow-hidden border border-stone-200/40 dark:border-stone-700/30 group-hover:bg-stone-200/50 dark:group-hover:bg-stone-800 transition-colors relative"
      >
        {doc.thumbnailDataUrl ? (
          <img
            src={doc.thumbnailDataUrl}
            alt={doc.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`p-4 rounded-2xl ${theme.bg}`}>
            <Icon className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* Info & Title */}
      <div onClick={() => onOpen(doc)} className="cursor-pointer">
        <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {doc.name}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mt-2">
          <span>{formatFileSize(doc.sizeBytes)}</span>
          <span>{formatRelativeTime(doc.lastOpenedAt)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      {progress > 0 && (
        <div className="mt-2.5 pt-2 border-t border-stone-200/60 dark:border-stone-800/60">
          <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
            <span>Page {doc.lastPageRead} of {doc.pageCount}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Bottom Menu Trigger */}
      <div className="mt-2 pt-1 flex justify-end">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 bottom-6 z-50 w-44 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl py-1 text-xs">
                <button
                  onClick={() => { setMenuOpen(false); onShowDetails(doc); }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Document Info</span>
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onRename(doc); }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Rename</span>
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onShare(doc); }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share File</span>
                </button>
                <div className="h-px bg-stone-200 dark:bg-stone-800 my-1" />
                <button
                  onClick={() => { setMenuOpen(false); onDelete(doc); }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove File</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
