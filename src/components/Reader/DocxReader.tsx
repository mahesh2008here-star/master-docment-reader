/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Loader2, Search, Type, Copy, Check, AlertCircle } from 'lucide-react';
import { DocumentItem, ReaderTheme } from '../../types/document';
import { parseDocxFile, ParsedDocxResult } from '../../services/documentParser';

interface DocxReaderProps {
  document: DocumentItem;
  theme: ReaderTheme;
  searchOpen: boolean;
  onToggleDistractionFree: () => void;
}

export const DocxReader: React.FC<DocxReaderProps> = ({
  document: doc,
  theme,
  searchOpen,
  onToggleDistractionFree,
}) => {
  const [data, setData] = useState<ParsedDocxResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSizeScale, setFontSizeScale] = useState<number>(1.0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      if (!doc.fileBlob) {
        setError('Document binary is missing');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const parsed = await parseDocxFile(doc.fileBlob);
        setData(parsed);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to parse DOCX OpenXML');
        setIsLoading(false);
      }
    }
    load();
  }, [doc.fileBlob]);

  const handleCopyText = () => {
    if (data?.rawText) {
      navigator.clipboard.writeText(data.rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
        return 'bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100';
    }
  };

  const getPaperBg = () => {
    switch (theme) {
      case 'sepia':
        return 'bg-[#f7ebd4] border-[#e2d0b6] text-[#423225]';
      case 'dark':
        return 'bg-stone-800/80 border-stone-700 text-stone-100';
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
          <span>Parsing OpenXML document...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold">Unable to Parse DOCX</h3>
        <p className="text-xs text-stone-400 max-w-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative flex-1 flex flex-col w-full h-full overflow-hidden ${getContainerBg()}`}>
      {/* Top Floating Controls */}
      <div className="px-4 py-2 border-b border-stone-200/50 dark:border-stone-800/50 flex items-center justify-between gap-3 text-xs z-20 bg-white/50 dark:bg-stone-900/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-stone-400">
            {data?.wordCount || 0} words
          </span>
          <span>•</span>
          <span className="text-[11px] text-stone-400">
            {data?.headings.length || 0} sections
          </span>
        </div>

        {/* Font Scale & Copy */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-stone-200/50 dark:bg-stone-800/50 rounded-xl px-2 py-0.5">
            <Type className="w-3.5 h-3.5 text-stone-400" />
            <button
              onClick={() => setFontSizeScale((s) => Math.max(0.8, s - 0.1))}
              className="text-xs font-bold px-1 hover:text-amber-500"
              title="Decrease font size"
            >
              A-
            </button>
            <span className="text-[10px] text-stone-500 font-medium">
              {Math.round(fontSizeScale * 100)}%
            </span>
            <button
              onClick={() => setFontSizeScale((s) => Math.min(1.6, s + 0.1))}
              className="text-xs font-bold px-1 hover:text-amber-500"
              title="Increase font size"
            >
              A+
            </button>
          </div>

          <button
            onClick={handleCopyText}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-200/50 dark:bg-stone-800/50 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Document Content View */}
      <div
        onClick={onToggleDistractionFree}
        className="flex-1 overflow-y-auto px-4 py-8 flex justify-center"
      >
        <div
          className={`w-full max-w-2xl rounded-3xl p-6 sm:p-10 shadow-lg border ${getPaperBg()}`}
          style={{ fontSize: `${fontSizeScale * 15}px`, lineHeight: '1.75' }}
        >
          {/* Compatibility Notice */}
          <div className="mb-6 pb-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-blue-600 dark:text-blue-400">
              OpenXML Word Document Preview
            </span>
            <span>Natively Parsed Offline</span>
          </div>

          {/* Formatted HTML Article */}
          <div
            className="prose dark:prose-invert max-w-none space-y-4 font-normal"
            dangerouslySetInnerHTML={{ __html: data?.html || '' }}
          />
        </div>
      </div>
    </div>
  );
};
