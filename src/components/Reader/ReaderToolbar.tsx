/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ArrowLeft,
  Search,
  Bookmark,
  BookmarkCheck,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Palette,
  Sun,
  Moon,
  Info
} from 'lucide-react';
import { DocumentItem, ReaderTheme } from '../../types/document';
import { getFormatTheme } from '../DocumentCard';

interface ReaderToolbarProps {
  document: DocumentItem;
  theme: ReaderTheme;
  isFullscreen: boolean;
  searchOpen: boolean;
  hasBookmark: boolean;
  zoom: number;
  rotation: number;
  visible: boolean;
  onBack: () => void;
  onToggleSearch: () => void;
  onToggleBookmark: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onToggleFullscreen: () => void;
  onChangeTheme: (theme: ReaderTheme) => void;
  onShowDetails: () => void;
}

export const ReaderToolbar: React.FC<ReaderToolbarProps> = ({
  document: doc,
  theme,
  isFullscreen,
  searchOpen,
  hasBookmark,
  zoom,
  rotation,
  visible,
  onBack,
  onToggleSearch,
  onToggleBookmark,
  onZoomIn,
  onZoomOut,
  onRotate,
  onToggleFullscreen,
  onChangeTheme,
  onShowDetails,
}) => {
  const [themeDropdownOpen, setThemeDropdownOpen] = React.useState(false);
  const formatTheme = getFormatTheme(doc.format);

  const themeOptions: Array<{ id: ReaderTheme; label: string; icon: any; bg: string }> = [
    { id: 'light', label: 'Paper White', icon: Sun, bg: 'bg-white text-stone-900 border-stone-300' },
    { id: 'sepia', label: 'Warm Sepia', icon: Palette, bg: 'bg-[#fbf0d9] text-[#5b4636] border-[#e6d3ba]' },
    { id: 'dark', label: 'Charcoal', icon: Moon, bg: 'bg-stone-800 text-stone-100 border-stone-700' },
    { id: 'amoled', label: 'AMOLED Black', icon: Moon, bg: 'bg-black text-stone-200 border-stone-800' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="w-full bg-white/80 dark:bg-stone-900/85 backdrop-blur-xl border-b border-stone-200/60 dark:border-stone-800/60 shadow-xs px-3 py-2 flex items-center justify-between gap-2">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 active:scale-95 transition-all"
            title="Back to library"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${formatTheme.badge}`}>
              {formatTheme.label}
            </span>
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate tracking-tight">
              {doc.name}
            </h2>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleSearch}
            className={`p-1.5 rounded-xl transition-colors ${
              searchOpen
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
            title="Search text"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleBookmark}
            className={`p-1.5 rounded-xl transition-colors ${
              hasBookmark
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
            title={hasBookmark ? 'Bookmarked' : 'Add bookmark'}
          >
            {hasBookmark ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>

          {/* Zoom controls for PDF & images */}
          {['pdf', 'image'].includes(doc.format) && (
            <div className="hidden sm:flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800/80 rounded-xl p-0.5">
              <button
                onClick={onZoomOut}
                className="p-1 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-medium text-stone-600 dark:text-stone-300 px-1.5">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={onZoomIn}
                className="p-1 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Rotate control */}
          {['pdf', 'image'].includes(doc.format) && (
            <button
              onClick={onRotate}
              className="p-1.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title={`Rotate (${rotation}°)`}
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}

          {/* Theme Palette */}
          <div className="relative">
            <button
              onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
              className="p-1.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Reading background"
            >
              <Palette className="w-4 h-4" />
            </button>

            {themeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setThemeDropdownOpen(false)} />
                <div className="absolute right-0 top-9 z-50 w-44 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl p-2 text-xs">
                  <div className="text-[10px] uppercase font-bold text-stone-400 px-2 py-1">
                    Reading Mode
                  </div>
                  {themeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        onChangeTheme(opt.id);
                        setThemeDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between gap-2 mt-1 transition-colors ${
                        theme === opt.id
                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 font-semibold'
                          : 'hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <div className={`w-3.5 h-3.5 rounded-full border ${opt.bg}`} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Details */}
          <button
            onClick={onShowDetails}
            className="p-1.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Document Details"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
