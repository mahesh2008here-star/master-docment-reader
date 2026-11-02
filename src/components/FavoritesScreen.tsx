/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Star, UploadCloud } from 'lucide-react';
import { DocumentItem } from '../types/document';
import { DocumentCard } from './DocumentCard';

interface FavoritesScreenProps {
  favoriteDocuments: DocumentItem[];
  onOpenDocument: (doc: DocumentItem) => void;
  onToggleFavorite: (doc: DocumentItem) => void;
  onShowDetails: (doc: DocumentItem) => void;
  onRename: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
  onShare: (doc: DocumentItem) => void;
  onNavigateToFiles: () => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  favoriteDocuments,
  onOpenDocument,
  onToggleFavorite,
  onShowDetails,
  onRename,
  onDelete,
  onShare,
  onNavigateToFiles,
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between bg-white/50 dark:bg-stone-900/50 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Star className="w-4 h-4 fill-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Favorites</h2>
            <p className="text-[11px] text-stone-400">Quick access to starred documents</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
          {favoriteDocuments.length} files
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {favoriteDocuments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
              <Star className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
              No Favorites Yet
            </h3>
            <p className="text-xs text-stone-400 max-w-xs mt-1 mb-5">
              Tap the star icon on any document in your library to pin it here for instant access.
            </p>
            <button
              onClick={onNavigateToFiles}
              className="px-4 py-2 rounded-2xl bg-amber-600 text-white text-xs font-semibold shadow-md shadow-amber-600/20 hover:bg-amber-500 transition-all active:scale-95"
            >
              Browse Library
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 pb-28 max-w-2xl mx-auto">
            {favoriteDocuments.map((doc) => (
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
        )}
      </div>
    </div>
  );
};
