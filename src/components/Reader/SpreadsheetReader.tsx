/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Loader2, Search, Table, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { DocumentItem, ReaderTheme } from '../../types/document';
import { parseSpreadsheetFile, ParsedSheetData } from '../../services/documentParser';

interface SpreadsheetReaderProps {
  document: DocumentItem;
  theme: ReaderTheme;
  searchOpen: boolean;
  onToggleDistractionFree: () => void;
}

export const SpreadsheetReader: React.FC<SpreadsheetReaderProps> = ({
  document: doc,
  theme,
  searchOpen,
  onToggleDistractionFree,
}) => {
  const [data, setData] = useState<ParsedSheetData | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

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
        const parsed = await parseSpreadsheetFile(doc.fileBlob);
        setData(parsed);
        setActiveSheet(parsed.activeSheet);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to parse workbook');
        setIsLoading(false);
      }
    }
    load();
  }, [doc.fileBlob]);

  const currentSheetData = data && activeSheet ? data.sheets[activeSheet] : null;
  const rows = currentSheetData?.rows || [];
  const headerRow = rows[0] || [];
  const bodyRows = rows.slice(1);

  // Column letters (A, B, C... Z, AA...)
  const getColLetter = (index: number): string => {
    let result = '';
    let temp = index;
    while (temp >= 0) {
      result = String.fromCharCode((temp % 26) + 65) + result;
      temp = Math.floor(temp / 26) - 1;
    }
    return result;
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
        return 'bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          <span>Parsing workbook sheets...</span>
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
        <h3 className="text-base font-semibold">Unable to Load Spreadsheet</h3>
        <p className="text-xs text-stone-400 max-w-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative flex-1 flex flex-col w-full h-full overflow-hidden ${getContainerBg()}`}>
      {/* Top Controls & Search Bar */}
      <div className="px-3 py-2 border-b border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between gap-3 text-xs z-20 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md">
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cells..."
            className="w-full bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-lg text-xs focus:outline-hidden"
          />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
            className="p-1 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono font-medium text-stone-500">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
            className="p-1 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Virtualized / Scrollable Spreadsheet Grid */}
      <div
        onClick={onToggleDistractionFree}
        className="flex-1 overflow-auto p-2"
        style={{ fontSize: `${zoomLevel * 12}px` }}
      >
        <div className="inline-block min-w-full align-middle">
          <table className="border-collapse table-auto text-left shadow-xs rounded-xl overflow-hidden bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-800 font-mono">
            {/* Frozen Header Presentation */}
            <thead className="bg-stone-200/80 dark:bg-stone-800 sticky top-0 z-10 shadow-xs">
              <tr>
                {/* Top-left row index corner */}
                <th className="px-2 py-1.5 border border-stone-300 dark:border-stone-700 text-center text-stone-500 font-bold bg-stone-300/60 dark:bg-stone-800/80 w-12 text-[10px]">
                  #
                </th>
                {headerRow.map((col, idx) => (
                  <th
                    key={idx}
                    className="px-3 py-1.5 border border-stone-300 dark:border-stone-700 font-semibold text-stone-700 dark:text-stone-200 truncate max-w-[240px]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-stone-400 font-normal">
                        {getColLetter(idx)}
                      </span>
                      <span className="truncate">{col || `Col ${idx + 1}`}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {bodyRows.map((row, rIdx) => {
                const rowNum = rIdx + 2;
                return (
                  <tr
                    key={rIdx}
                    className="hover:bg-amber-500/5 dark:hover:bg-amber-400/5 transition-colors border-b border-stone-200/50 dark:border-stone-800/50"
                  >
                    {/* Row Index */}
                    <td className="px-2 py-1 border border-stone-300 dark:border-stone-700 text-center font-bold text-stone-400 text-[10px] bg-stone-100/60 dark:bg-stone-900/60 select-none">
                      {rowNum}
                    </td>

                    {/* Cell Values */}
                    {headerRow.map((_, cIdx) => {
                      const cellVal = row[cIdx] || '';
                      const isMatch =
                        searchQuery.trim() !== '' &&
                        cellVal.toLowerCase().includes(searchQuery.toLowerCase());

                      return (
                        <td
                          key={cIdx}
                          className={`px-3 py-1.5 border border-stone-200 dark:border-stone-800 truncate max-w-[280px] ${
                            isMatch
                              ? 'bg-amber-200 dark:bg-amber-950 font-bold text-amber-900 dark:text-amber-100'
                              : 'text-stone-800 dark:text-stone-200'
                          }`}
                        >
                          {cellVal}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Sheet Navigation Tabs */}
      <div className="px-3 py-1.5 bg-stone-200/70 dark:bg-stone-900/80 backdrop-blur-md border-t border-stone-300 dark:border-stone-800 flex items-center justify-between gap-2 overflow-x-auto text-xs z-20">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {data?.sheetNames.map((name) => (
            <button
              key={name}
              onClick={() => setActiveSheet(name)}
              className={`px-3 py-1 rounded-lg font-medium text-xs whitespace-nowrap transition-all ${
                activeSheet === name
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'bg-white/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-700'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="text-[10px] text-stone-500 shrink-0 font-medium hidden sm:block">
          {rows.length} rows • {currentSheetData?.colCount || 0} cols
        </div>
      </div>
    </div>
  );
};
