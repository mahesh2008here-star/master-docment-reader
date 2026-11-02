/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { UploadCloud, FolderOpen, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { detectDocumentType, calculateSha256 } from '../../services/documentParser';
import { DocumentItem } from '../../types/document';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (docs: DocumentItem[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newDocs: DocumentItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setStatusMessage(`Inspecting file headers: ${file.name} (${i + 1}/${files.length})...`);

      try {
        // Run deep content inspection (magic bytes & container analysis)
        const detected = await detectDocumentType(file, file.name);
        const hash = await calculateSha256(file);

        const newDoc: DocumentItem = {
          id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          name: file.name,
          format: detected.format,
          extension: detected.extension,
          sizeBytes: file.size,
          importedAt: Date.now(),
          lastOpenedAt: Date.now(),
          isFavorite: false,
          pageCount: 1,
          lastPageRead: 1,
          mimeType: detected.mimeType,
          contentHash: hash,
          fileBlob: file,
          bookmarks: [],
        };

        newDocs.push(newDoc);
      } catch (err) {
        console.error('Failed to import file:', file.name, err);
      }
    }

    setIsProcessing(false);
    onImportComplete(newDocs);
    onClose();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-stone-900 dark:text-stone-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">Import Documents</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Storage Access Framework • Offline & Private
            </p>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-amber-500 bg-amber-500/10 scale-[1.02]'
              : 'border-stone-300 dark:border-stone-700 hover:border-amber-400 bg-stone-50/50 dark:bg-stone-800/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold mb-1">
            {isDragging ? 'Drop documents to import' : 'Choose files from device'}
          </p>
          <p className="text-xs text-stone-400 max-w-xs">
            Supports PDF, Word (.docx, .doc), Excel (.xlsx, .xls), PowerPoint (.pptx), TXT, Markdown, CSV, and Images.
          </p>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-300">
            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-amber-500" />
            <span className="truncate">{statusMessage}</span>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between text-[11px] text-stone-400 border-t border-stone-200 dark:border-stone-800 pt-3">
          <span>Zero cloud uploads. Stored isolated in app sandbox.</span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
          >
            Browse
          </button>
        </div>
      </div>
    </div>
  );
};
