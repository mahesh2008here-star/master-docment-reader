/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, X, CheckCircle, AlertTriangle, FileText, Info } from 'lucide-react';
import { COMPATIBILITY_MATRIX, CompatibilityLevel } from '../../types/document';

interface CompatibilityMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompatibilityMatrixModal: React.FC<CompatibilityMatrixModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const entries = Object.values(COMPATIBILITY_MATRIX);

  const getBadge = (level: CompatibilityLevel) => {
    switch (level) {
      case 'fully_rendered':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            Fully Rendered
          </span>
        );
      case 'partially_rendered':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            Partially Rendered
          </span>
        );
      case 'text_extraction_only':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            Text Extraction Only
          </span>
        );
      case 'unsupported':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            Unsupported
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-stone-900 dark:text-stone-100 relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">Offline Document Compatibility Matrix</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Verified capabilities and architectural limitations on Android 16
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
          {entries.map((item) => (
            <div
              key={item.format}
              className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/50"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span>{item.displayName}</span>
                </div>
                {getBadge(item.compatibilityLevel)}
              </div>

              <div className="text-[11px] text-stone-500 dark:text-stone-400 mb-2 font-mono">
                Engine: {item.engineDescription}
              </div>

              {/* Capabilities */}
              {item.capabilities.length > 0 && (
                <div className="space-y-1 mb-2">
                  {item.capabilities.map((cap, cIdx) => (
                    <div key={cIdx} className="flex items-start gap-1.5 text-stone-700 dark:text-stone-300 text-[11px]">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Limitations */}
              {item.limitations.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-stone-200/40 dark:border-stone-700/40">
                  {item.limitations.map((lim, lIdx) => (
                    <div key={lIdx} className="flex items-start gap-1.5 text-stone-500 dark:text-stone-400 text-[10px]">
                      <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                      <span>{lim}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 mt-2 border-t border-stone-200 dark:border-stone-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold shadow-xs hover:bg-amber-500 transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
