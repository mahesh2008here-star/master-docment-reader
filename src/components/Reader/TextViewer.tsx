/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Loader2, Copy, Check, Type, Hash } from 'lucide-react';
import { DocumentItem, ReaderTheme } from '../../types/document';
import { readPlainTextFile } from '../../services/documentParser';

interface TextViewerProps {
  document: DocumentItem;
  theme: ReaderTheme;
  searchOpen: boolean;
  onToggleDistractionFree: () => void;
}

export const TextViewer: React.FC<TextViewerProps> = ({
  document: doc,
  theme,
  searchOpen,
  onToggleDistractionFree,
}) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
  const [useMonospace, setUseMonospace] = useState<boolean>(doc.format === 'csv');
  const [fontSize, setFontSize] = useState<number>(14);

  useEffect(() => {
    async function load() {
      if (!doc.fileBlob) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const text = await readPlainTextFile(doc.fileBlob);
        setContent(text);
      } catch (err) {
        console.error('Failed to read text file:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [doc.fileBlob]);

  const lines = content.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <span>Reading text stream...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex-1 flex flex-col w-full h-full overflow-hidden ${getContainerBg()}`}>
      {/* Top Toolbar */}
      <div className="px-3 py-2 border-b border-stone-200/50 dark:border-stone-800/50 flex items-center justify-between text-xs bg-white/60 dark:bg-stone-900/60 backdrop-blur-md z-20">
        <div className="flex items-center gap-2 text-stone-500 text-[11px]">
          <span>{lines.length} lines</span>
          <span>•</span>
          <span>{content.length} characters</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className={`p-1.5 rounded-xl transition-colors ${
              showLineNumbers
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                : 'text-stone-400 hover:bg-stone-200/50'
            }`}
            title="Toggle line numbers"
          >
            <Hash className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setUseMonospace(!useMonospace)}
            className={`px-2 py-1 rounded-xl text-xs transition-colors ${
              useMonospace
                ? 'bg-stone-200 dark:bg-stone-800 font-mono text-stone-800 dark:text-stone-200'
                : 'text-stone-400 hover:bg-stone-200/50'
            }`}
          >
            {useMonospace ? 'Mono' : 'Proportional'}
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-200/50 dark:bg-stone-800/50 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Text Body */}
      <div
        onClick={onToggleDistractionFree}
        className="flex-1 overflow-auto p-4 sm:p-6"
        style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}
      >
        <div className={`max-w-3xl mx-auto ${useMonospace ? 'font-mono' : 'font-sans'}`}>
          {lines.map((line, idx) => (
            <div key={idx} className="flex items-start hover:bg-amber-500/5 transition-colors">
              {showLineNumbers && (
                <span className="w-12 shrink-0 select-none text-[11px] font-mono text-stone-400 dark:text-stone-600 pr-3 text-right">
                  {idx + 1}
                </span>
              )}
              <span className="flex-1 whitespace-pre-wrap break-words">{line || '\u00A0'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
