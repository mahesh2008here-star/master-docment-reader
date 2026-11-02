/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Edit2, X, AlertTriangle, Trash2 } from 'lucide-react';
import { DocumentItem } from '../../types/document';

interface RenameDialogProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
}

export const RenameDialog: React.FC<RenameDialogProps> = ({
  document: doc,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    if (doc) setNameInput(doc.name);
  }, [doc]);

  if (!isOpen || !doc) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onConfirm(nameInput.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-stone-900 dark:text-stone-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Edit2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">Rename Document</h3>
            <p className="text-xs text-stone-400">Update library title</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            autoFocus
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!nameInput.trim() || nameInput.trim() === doc.name}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-xs"
            >
              Save Name
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteConfirmDialogProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  document: doc,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !doc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-stone-900 dark:text-stone-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-rose-600 dark:text-rose-400">
              Remove Document?
            </h3>
            <p className="text-xs text-stone-400">Explicit confirmation required</p>
          </div>
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed mb-4">
          Are you sure you want to remove <strong className="text-stone-900 dark:text-white font-semibold">{doc.name}</strong> from your Master Documents library?
          This will purge cached render buffers and reading history for this file.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            Confirm Removal
          </button>
        </div>
      </div>
    </div>
  );
};
