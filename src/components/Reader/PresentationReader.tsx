/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Presentation,
  FileText,
  AlertCircle,
  LayoutGrid,
  Maximize2
} from 'lucide-react';
import { DocumentItem, ReaderTheme } from '../../types/document';
import { parsePptxFile, ParsedPptxResult } from '../../services/documentParser';

interface PresentationReaderProps {
  document: DocumentItem;
  theme: ReaderTheme;
  searchOpen: boolean;
  onToggleDistractionFree: () => void;
}

export const PresentationReader: React.FC<PresentationReaderProps> = ({
  document: doc,
  theme,
  searchOpen,
  onToggleDistractionFree,
}) => {
  const [data, setData] = useState<ParsedPptxResult | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState<boolean>(true);
  const [thumbnailGridOpen, setThumbnailGridOpen] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      if (!doc.fileBlob) {
        setError('Document binary is not available');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const parsed = await parsePptxFile(doc.fileBlob);
        setData(parsed);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to parse presentation deck');
        setIsLoading(false);
      }
    }
    load();
  }, [doc.fileBlob]);

  const slides = data?.slides || [];
  const activeSlide = slides[currentSlideIndex];

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

  const getSlideCanvasBg = () => {
    switch (theme) {
      case 'sepia':
        return 'bg-[#fffaf0] border-[#ecd8bf] text-[#48372a]';
      case 'dark':
        return 'bg-stone-800 border-stone-700 text-stone-100';
      case 'amoled':
        return 'bg-stone-950 border-stone-800 text-stone-200';
      case 'light':
      default:
        return 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <span>Extracting presentation slides...</span>
        </div>
      </div>
    );
  }

  if (error || slides.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
          <Presentation className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold">Presentation Reader</h3>
        <p className="text-xs text-stone-400 max-w-sm mt-1">
          {error || 'No slides found in this presentation.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative flex-1 flex flex-col w-full h-full overflow-hidden ${getContainerBg()}`}>
      {/* Top Slide Quick Actions */}
      <div className="px-3 py-2 border-b border-stone-200/50 dark:border-stone-800/50 flex items-center justify-between text-xs bg-white/60 dark:bg-stone-900/60 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            Slide {currentSlideIndex + 1} of {slides.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setThumbnailGridOpen(!thumbnailGridOpen)}
            className={`p-1.5 rounded-xl transition-colors ${
              thumbnailGridOpen
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                : 'hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300'
            }`}
            title="Overview grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-colors ${
              showNotes
                ? 'bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200'
                : 'text-stone-400 hover:bg-stone-200/50'
            }`}
          >
            Speaker Notes
          </button>
        </div>
      </div>

      {/* Slide Thumbnails Modal / Drawer */}
      {thumbnailGridOpen && (
        <div className="p-4 bg-stone-200/80 dark:bg-stone-900/90 backdrop-blur-xl border-b border-stone-300 dark:border-stone-800 grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto z-30">
          {slides.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentSlideIndex(idx);
                setThumbnailGridOpen(false);
              }}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                currentSlideIndex === idx
                  ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50 dark:bg-amber-950/40'
                  : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-stone-400'
              }`}
            >
              <div className="text-[10px] font-bold text-amber-600 mb-1">Slide {idx + 1}</div>
              <div className="text-[11px] font-semibold truncate text-stone-800 dark:text-stone-200">
                {s.title}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Main Slide Viewer Canvas */}
      <div
        onClick={onToggleDistractionFree}
        className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-center cursor-pointer"
      >
        <div
          className={`w-full max-w-2xl aspect-16/10 rounded-3xl p-6 sm:p-10 shadow-2xl border flex flex-col justify-between transition-all duration-200 ${getSlideCanvasBg()}`}
        >
          {/* Slide Header */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
              Slide {activeSlide.slideNumber}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-6">
              {activeSlide.title}
            </h2>

            {/* Bullet hierarchy */}
            <div className="space-y-3">
              {activeSlide.bulletPoints.map((bullet, bIdx) => (
                <div key={bIdx} className="flex items-start gap-2.5 text-sm sm:text-base leading-relaxed">
                  <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span>
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Slide Footer Branding */}
          <div className="pt-4 border-t border-stone-200/50 dark:border-stone-800/50 flex items-center justify-between text-[10px] text-stone-400">
            <span>Master Documents Presentation Engine</span>
            <span>Slide {activeSlide.slideNumber} of {slides.length}</span>
          </div>
        </div>

        {/* Presenter Speaker Notes Drawer */}
        {showNotes && activeSlide.notes && (
          <div className="w-full max-w-2xl mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span>Speaker Notes:</span>
            </div>
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              {activeSlide.notes}
            </p>
          </div>
        )}
      </div>

      {/* Slide Navigation Bar */}
      <div className="px-4 py-2.5 bg-white/70 dark:bg-stone-900/75 backdrop-blur-xl border-t border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between z-20">
        <button
          onClick={() => setCurrentSlideIndex((idx) => Math.max(0, idx - 1))}
          disabled={currentSlideIndex <= 0}
          className="p-1.5 rounded-xl bg-stone-200/50 dark:bg-stone-800/60 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-300 dark:hover:bg-stone-700 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
          {currentSlideIndex + 1} / {slides.length}
        </span>

        <button
          onClick={() => setCurrentSlideIndex((idx) => Math.min(slides.length - 1, idx + 1))}
          disabled={currentSlideIndex >= slides.length - 1}
          className="p-1.5 rounded-xl bg-stone-200/50 dark:bg-stone-800/60 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-300 dark:hover:bg-stone-700 active:scale-95 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
