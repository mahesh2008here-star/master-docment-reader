/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  FolderLock,
  CheckCircle2,
  HardDrive,
  FileCheck,
  X,
  Lock,
  Unlock,
  ShieldCheck
} from 'lucide-react';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrantPermission: () => void;
  accentColor?: string;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
  isOpen,
  onClose,
  onGrantPermission,
  accentColor = '#f59e0b',
}) => {
  const [docPermission, setDocPermission] = useState<boolean>(true);
  const [allFilesPermission, setAllFilesPermission] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleGrant = () => {
    onGrantPermission();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[32px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-stone-900 dark:text-stone-100 relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
            style={{ backgroundColor: accentColor }}
          >
            <FolderLock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight">Storage Access Required</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Android 16 Scoped Storage Permission
            </p>
          </div>
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
          To open, parse, organize, and view your PDF, Office, and text files directly from your device storage in offline mode, Master Documents requires file access permission.
        </p>

        {/* Permission Item Toggles */}
        <div className="space-y-3">
          {/* Permission 1 */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileCheck className="w-5 h-5 text-emerald-500" />
              <div>
                <div className="text-xs font-bold">Read Documents & Media</div>
                <div className="text-[10px] text-stone-400">
                  Access .pdf, .docx, .xlsx, .pptx, .txt files
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={docPermission}
              onChange={(e) => setDocPermission(e.target.checked)}
              className="w-4 h-4 accent-amber-600 cursor-pointer"
            />
          </div>

          {/* Permission 2 */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-xs font-bold">Manage Storage Access</div>
                <div className="text-[10px] text-stone-400">
                  Enables offline caching and library persistence
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={allFilesPermission}
              onChange={(e) => setAllFilesPermission(e.target.checked)}
              className="w-4 h-4 accent-amber-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
          <span className="text-[11px]">
            Zero internet access. Documents never leave this device.
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
          >
            Not Now
          </button>
          <button
            onClick={handleGrant}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md active:scale-95 transition-transform"
            style={{ backgroundColor: accentColor }}
          >
            Allow File Access
          </button>
        </div>
      </div>
    </div>
  );
};
