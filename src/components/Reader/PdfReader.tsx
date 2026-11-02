/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Search,
  X,
  Bookmark,
  BookmarkCheck,
  RotateCw,
  Loader2,
  Lock,
  AlertCircle
} from 'lucide-react';
import { DocumentItem, ReaderTheme } from '../../types/document';
import {
  loadPdfDocument,
  renderPdfPageToCanvas,
  extractPdfTextContent
} from '../../services/documentParser';

interface PdfReaderProps {
  document: DocumentItem;
  theme: ReaderTheme;
  rotation: number;
  zoom: number;
  searchOpen: boolean;
  onPageChange: (page: number, total: number) => void;
  onToggleDistractionFree: () => void;
  onAddBookmark: (page: number) => void;
  onRemoveBookmark: (bookmarkId: string) => void;
}

export const PdfReader: React.FC<PdfReaderProps> = ({
  document: doc,
  theme,
  rotation,
  zoom,
  searchOpen,
  onPageChange,
  onToggleDistractionFree,
  onAddBookmark,
  onRemoveBookmark,
}) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(doc.pageCount || 1);
  const [currentPage, setCurrentPage] = useState<number>(doc.lastPageRead || 1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [jumpPageInput, setJumpPageInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [turnAnimation, setTurnAnimation] = useState<'forward' | 'backward' | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  const triggerTurnAnimation = (dir: 'forward' | 'backward') => {
    setTurnAnimation(dir);
    setTimeout(() => {
      setTurnAnimation(null);
    }, 450);
  };

  // Keyboard navigation for smooth page turning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (searchOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        if (currentPage < numPages) {
          triggerTurnAnimation('forward');
          setCurrentPage((p) => p + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (currentPage > 1) {
          triggerTurnAnimation('backward');
          setCurrentPage((p) => p - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, numPages, searchOpen]);

  // Background styling
  const getContainerBg = () => {
    switch (theme) {
      case 'sepia':
        return 'bg-[#fbf0d9] text-[#5b4636]';
      case 'dark':
        return 'bg-stone-900 text-stone-100';
      case 'amoled':
        return 'bg-black text-stone-200';
      case 'light':
      default:
        return 'bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100';
    }
  };

  // Load PDF Document
  const loadPdf = useCallback(
    async (password?: string) => {
      if (!doc.fileBlob) {
        setRenderError('Document binary is not available');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setRenderError(null);

      try {
        const loaded = await loadPdfDocument(doc.fileBlob, password);
        setPdfDoc(loaded);
        setNumPages(loaded.numPages);
        setPasswordRequired(false);
        setIsLoading(false);
        onPageChange(currentPage, loaded.numPages);
      } catch (err: any) {
        setIsLoading(false);
        if (err.name === 'PasswordException') {
          setPasswordRequired(true);
        } else {
          setRenderError(err.message || 'Failed to render PDF document');
        }
      }
    },
    [doc.fileBlob, currentPage, onPageChange]
  );

  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  // Render active page to canvas with LRU/memory recycling
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      await renderPdfPageToCanvas(pdfDoc, currentPage, canvas, zoom, rotation);
      onPageChange(currentPage, numPages);
    } catch (err: any) {
      console.error('Page render error:', err);
    }
  }, [pdfDoc, currentPage, zoom, rotation, numPages, onPageChange]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // Page Navigation
  const goToNextPage = () => {
    if (currentPage < numPages) {
      triggerTurnAnimation('forward');
      setCurrentPage((p) => p + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      triggerTurnAnimation('backward');
      setCurrentPage((p) => p - 1);
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpPageInput, 10);
    if (!isNaN(target) && target >= 1 && target <= numPages) {
      if (target > currentPage) triggerTurnAnimation('forward');
      else if (target < currentPage) triggerTurnAnimation('backward');
      setCurrentPage(target);
      setJumpPageInput('');
    }
  };

  // Search in PDF
  const handleSearch = async () => {
    if (!pdfDoc || !searchQuery.trim()) return;
    setIsSearching(true);
    const matches: number[] = [];
    const query = searchQuery.toLowerCase();

    for (let i = 1; i <= numPages; i++) {
      const text = await extractPdfTextContent(pdfDoc, i);
      if (text.toLowerCase().includes(query)) {
        matches.push(i);
      }
    }

    setSearchMatches(matches);
    setIsSearching(false);
    if (matches.length > 0 && !matches.includes(currentPage)) {
      setCurrentPage(matches[0]);
    }
  };

  const currentBookmark = doc.bookmarks?.find((b) => b.pageNumber === currentPage);

  // Password Prompt View
  if (passwordRequired) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-stone-900 text-stone-100">
        <div className="w-full max-w-sm p-6 rounded-3xl bg-stone-800/90 border border-stone-700 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Password Protected</h3>
          <p className="text-xs text-stone-400 mt-1 mb-5">
            This PDF is encrypted. Enter the document password to decrypt it offline.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadPdf(passwordInput);
            }}
            className="space-y-3"
          >
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-700 text-sm text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-semibold text-sm text-white shadow-md transition-all active:scale-95"
            >
              Unlock Document
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Error View
  if (renderError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold">Unable to Render PDF</h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mt-1 mb-4">
          {renderError}
        </p>
        <button
          onClick={() => loadPdf()}
          className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow-xs"
        >
          Try Reloading
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 flex flex-col w-full h-full overflow-hidden select-none transition-colors duration-200 ${getContainerBg()}`}
    >
      {/* Floating In-Document Search Bar */}
      {searchOpen && (
        <div className="absolute top-14 left-4 right-4 z-30 max-w-md mx-auto p-2 rounded-2xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-xl border border-stone-200 dark:border-stone-800 shadow-xl flex items-center gap-2">
          <Search className="w-4 h-4 text-stone-400 shrink-0 ml-1.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search words in document..."
            className="flex-1 bg-transparent text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden"
            autoFocus
          />
          {searchMatches.length > 0 && (
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 shrink-0 px-2">
              {searchMatches.length} found
            </span>
          )}
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-2.5 py-1 rounded-xl bg-amber-600 text-white text-xs font-medium shrink-0"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Find'}
          </button>
        </div>
      )}

      {/* Main Canvas Viewport */}
      <div
        onClick={onToggleDistractionFree}
        className="flex-1 overflow-auto flex items-center justify-center p-4 relative cursor-pointer"
      >
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-stone-950/20 backdrop-blur-xs">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900/80 text-white text-xs font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              <span>Rendering page {currentPage}...</span>
            </div>
          </div>
        )}

        <div
          className={`flex items-center justify-center transition-all ${
            turnAnimation === 'forward'
              ? 'page-turn-forward'
              : turnAnimation === 'backward'
              ? 'page-turn-backward'
              : ''
          }`}
          style={{ perspective: '1400px' }}
        >
          <canvas
            ref={canvasRef}
            className="shadow-2xl rounded-lg transition-transform duration-150 max-w-none origin-center"
          />
        </div>
      </div>

      {/* Floating Bottom Reader Navigation Bar */}
      <div className="w-full px-4 py-2.5 bg-white/70 dark:bg-stone-900/75 backdrop-blur-xl border-t border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between gap-3 z-30">
        {/* Prev Page */}
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-xl bg-stone-200/50 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-300 dark:hover:bg-stone-700 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Page Jump & Slider */}
        <div className="flex items-center gap-2 flex-1 max-w-xs justify-center">
          <form onSubmit={handleJumpSubmit} className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Page</span>
            <input
              type="number"
              min="1"
              max={numPages}
              value={jumpPageInput !== '' ? jumpPageInput : currentPage}
              onChange={(e) => setJumpPageInput(e.target.value)}
              onBlur={() => setJumpPageInput('')}
              className="w-12 text-center text-xs font-bold py-1 px-1.5 rounded-lg bg-stone-200/70 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">of {numPages}</span>
          </form>

          {/* Bookmark Quick Action */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (currentBookmark) {
                onRemoveBookmark(currentBookmark.id);
              } else {
                onAddBookmark(currentPage);
              }
            }}
            className={`p-1.5 rounded-xl ml-2 transition-colors ${
              currentBookmark
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-stone-400 hover:text-amber-500'
            }`}
            title={currentBookmark ? 'Page bookmarked' : 'Bookmark this page'}
          >
            {currentBookmark ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>

        {/* Next Page */}
        <button
          onClick={goToNextPage}
          disabled={currentPage >= numPages}
          className="p-1.5 rounded-xl bg-stone-200/50 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-300 dark:hover:bg-stone-700 active:scale-95 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
