/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Info, X, ShieldCheck, FileText, Hash, Calendar, HardDrive } from 'lucide-react';
import { DocumentItem, COMPATIBILITY_MATRIX } from '../../types/document';
import { formatFileSize } from '../DocumentCard';

interface DocumentDetailsDialogProps {
  document: DocumentItem | null;
  onClose: () => void;
}

export const DocumentDetailsDialog: React.FC<DocumentDetailsDialogProps> = ({ document: doc, onClose }) => {
  if (!doc) return null;

  const compat = COMPATIBILITY_MATRIX[doc.format] || COMPATIBILITY_MATRIX.unsupported;

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'fully_rendered':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'partially_rendered':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'text_extraction_only':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default:
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-stone-900 dark:text-stone-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Info className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold tracking-tight truncate">{doc.name}</h3>
            <p className="text-xs text-stone-400">Technical Document Inspection</p>
          </div>
        </div>

        {/* Compatibility Status Banner */}
        <div className={`p-3 rounded-2xl border mb-5 flex items-start gap-2.5 ${getLevelBadge(compat.compatibilityLevel)}`}>
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">
              Engine: {compat.compatibilityLevel.replace('_', ' ')}
            </span>
            <p className="mt-0.5 opacity-90">{compat.engineDescription}</p>
          </div>
        </div>

        {/* Technical Properties Grid */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
            <span className="text-stone-400">Format</span>
            <span className="font-mono font-semibold uppercase">{doc.format} ({doc.extension})</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
            <span className="text-stone-400">Exact File Size</span>
            <span className="font-mono font-semibold">{formatFileSize(doc.sizeBytes)} ({doc.sizeBytes.toLocaleString()} bytes)</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
            <span className="text-stone-400">MIME Type</span>
            <span className="font-mono text-stone-600 dark:text-stone-300">{doc.mimeType}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
            <span className="text-stone-400">Imported Date</span>
            <span>{new Date(doc.importedAt).toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
            <span className="text-stone-400">Last Opened</span>
            <span>{new Date(doc.lastOpenedAt).toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
            <span className="text-stone-400">Pages / Slides</span>
            <span className="font-semibold">{doc.pageCount || 1}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-800">
            <span className="text-stone-400">Saved Bookmarks</span>
            <span className="font-semibold">{doc.bookmarks?.length || 0}</span>
          </div>

          {/* SHA-256 Hash */}
          <div className="pt-2">
            <span className="text-stone-400 block mb-1">SHA-256 Document Hash</span>
            <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800/80 font-mono text-[11px] text-stone-600 dark:text-stone-300 break-all select-all">
              {doc.contentHash || 'Not calculated'}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 text-xs font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
