/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Palette,
  Pipette,
  Github,
  FolderLock,
  ExternalLink,
  ShieldCheck,
  Check,
  Heart,
  Sliders,
  Sparkles,
  Info,
  ChevronRight,
  Download,
  GitBranch
} from 'lucide-react';
import { AppPreferences, ReaderTheme } from '../types/document';

interface SettingsScreenProps {
  preferences: AppPreferences;
  onUpdatePreferences: (updates: Partial<AppPreferences>) => void;
  onRequestPermissions: () => void;
  onNavigateToSupport: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  preferences,
  onUpdatePreferences,
  onRequestPermissions,
  onNavigateToSupport,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const PRESET_ACCENTS = [
    { id: 'amber', label: 'Vibrant Amber', color: '#f59e0b' },
    { id: 'emerald', label: 'Cyber Emerald', color: '#10b981' },
    { id: 'violet', label: 'Electric Violet', color: '#8b5cf6' },
    { id: 'blue', label: 'Pacific Blue', color: '#0284c7' },
    { id: 'coral', label: 'Sunset Coral', color: '#f43f5e' },
    { id: 'lime', label: 'Neon Lime', color: '#84cc16' },
    { id: 'slate', label: 'Monochrome', color: '#64748b' },
  ];

  const currentAccent = preferences.accentColor || '#f59e0b';

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 max-w-2xl mx-auto w-full space-y-6 pb-28 text-stone-900 dark:text-stone-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
          <p className="text-xs text-stone-400">Customization, system storage, and developer info</p>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-4 h-4 text-amber-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Section 1: Custom Accent Color & Theme */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 px-1">
          Color Accents & Appearance
        </h2>

        <div className="droplert-card rounded-3xl p-5 shadow-sm space-y-4 text-xs">
          {/* Preset Swatches */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                Preset Palette Accents
              </span>
              <span className="font-mono text-[11px] text-stone-400 font-semibold">
                {currentAccent.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {PRESET_ACCENTS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onUpdatePreferences({ accentColor: preset.color })}
                  title={preset.label}
                  className={`w-9 h-9 rounded-2xl transition-all duration-200 flex items-center justify-center shadow-xs active:scale-95 ${
                    currentAccent.toLowerCase() === preset.color.toLowerCase()
                      ? 'ring-3 ring-offset-2 ring-stone-900 dark:ring-stone-100 scale-105'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset.color }}
                >
                  {currentAccent.toLowerCase() === preset.color.toLowerCase() && (
                    <Check className="w-4 h-4 text-white stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-stone-200/60 dark:bg-stone-800/60" />

          {/* Custom Hex Color Picker */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <Pipette className="w-3.5 h-3.5" style={{ color: currentAccent }} />
                <span>Custom Color Picker</span>
              </div>
              <div className="text-[11px] text-stone-400">
                Select any custom HEX shade for buttons, dock, and indicators
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentAccent}
                onChange={(e) => onUpdatePreferences({ accentColor: e.target.value })}
                className="w-9 h-9 rounded-xl cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={currentAccent}
                onChange={(e) => onUpdatePreferences({ accentColor: e.target.value })}
                className="w-20 px-2 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 font-mono text-xs text-center border border-stone-200 dark:border-stone-700"
              />
            </div>
          </div>

          <div className="h-px bg-stone-200/60 dark:bg-stone-800/60" />

          {/* Theme Mode Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-stone-800 dark:text-stone-200">Interface Mode</div>
              <div className="text-[11px] text-stone-400">Light paper, charcoal dark, or system</div>
            </div>

            <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl">
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onUpdatePreferences({ themeMode: mode })}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    preferences.themeMode === mode
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Storage Permissions */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 px-1">
          Permissions & File Access
        </h2>

        <div className="droplert-card rounded-3xl p-5 shadow-sm space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: currentAccent }}
              >
                <FolderLock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-stone-800 dark:text-stone-200">
                  Android Storage Access
                </div>
                <div className="text-[11px] text-stone-400">
                  {preferences.storagePermissionGranted
                    ? 'All Files Access active (offline sandbox)'
                    : 'Requires permission to scan local documents'}
                </div>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                preferences.storagePermissionGranted
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              {preferences.storagePermissionGranted ? 'Granted' : 'Action Required'}
            </span>
          </div>

          <button
            onClick={onRequestPermissions}
            className="w-full py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs transition-colors"
          >
            {preferences.storagePermissionGranted ? 'Review Permissions' : 'Grant File Permissions'}
          </button>
        </div>
      </div>

      {/* Section 3: Releases & Developer GitHub */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Release v1.0.0 & Source Code
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Latest Production Release
          </span>
        </div>

        <div className="droplert-card rounded-3xl p-5 shadow-sm space-y-4 text-xs">
          {/* Developer Profile Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-stone-900 dark:bg-stone-800 text-white flex items-center justify-center shadow-md">
                <Github className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    mahesh2008here
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] font-mono text-stone-500">
                    v1.0.0
                  </span>
                </div>
                <div className="text-[11px] text-stone-400">
                  Master Documents Lead Developer • Android & Web
                </div>
              </div>
            </div>

            <a
              href="https://github.com/mahesh2008here"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl text-white font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
              style={{ backgroundColor: currentAccent }}
            >
              <span>GitHub Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <p className="text-stone-600 dark:text-stone-300 text-[11px] leading-relaxed">
            All code and production distributions are packaged, tagged with <strong>v1.0.0</strong>, and ready for offline use or GitHub publishing.
          </p>

          {/* Release Download Packages */}
          <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800/60 space-y-2.5">
            <div className="font-semibold text-stone-800 dark:text-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" style={{ color: currentAccent }} />
                <span>Download Release Assets</span>
              </div>
              <span className="text-[10px] text-stone-400 font-mono">3 packages ready</span>
            </div>

            {/* Asset 1: Full Source Code Archive */}
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <span>Source Code Archive (.zip)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300">276 KB</span>
                </div>
                <div className="text-[10px] text-stone-400">
                  Full git repository with React 19 app, native Android project & configs
                </div>
              </div>

              <a
                href="/master-documents.zip"
                download="master-documents-source-v1.0.0.zip"
                className="px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 text-white font-semibold flex items-center gap-1 shadow-sm active:scale-95 transition-all text-[11px] shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Source Code</span>
              </a>
            </div>

            {/* Asset 2: Web Production Bundle */}
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <span>Compiled Web App Bundle (.zip)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300">1.2 MB</span>
                </div>
                <div className="text-[10px] text-stone-400">
                  Compiled, zero-dependency HTML/JS distribution ready for web hosting or PWA
                </div>
              </div>

              <a
                href="/master-documents-web.zip"
                download="master-documents-web-v1.0.0.zip"
                className="px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 text-white font-semibold flex items-center gap-1 shadow-sm active:scale-95 transition-all text-[11px] shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Web Bundle</span>
              </a>
            </div>

            {/* Asset 3: Native Android Project */}
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <span>Android Studio Project (.zip)</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300">14 KB</span>
                </div>
                <div className="text-[10px] text-stone-400">
                  Native Kotlin Jetpack Compose app, Room DB, SAF file picker, PdfRenderer
                </div>
              </div>

              <a
                href="/master-documents-android.zip"
                download="master-documents-android-v1.0.0.zip"
                className="px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 text-white font-semibold flex items-center gap-1 shadow-sm active:scale-95 transition-all text-[11px] shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Android App</span>
              </a>
            </div>
          </div>

          {/* GitHub Actions CI/CD Automated APK Builder */}
          <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" style={{ color: currentAccent }} />
                <span>GitHub Actions APK Builder (.github/workflows/main.yml)</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Auto-Build CI Ready
              </span>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              When pushed to GitHub, the workflow automatically spins up an Android Ubuntu runner with JDK 17, compiles the native Android app with Gradle, and attaches <strong>MasterDocuments-v1.0.0-release.apk</strong> and <strong>MasterDocuments-v1.0.0-debug.apk</strong> directly to the GitHub Release.
            </p>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                Push Commands to Trigger Build:
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    'git push -u origin main && git push origin v1.0.0'
                  );
                  showToast('Git push commands copied to clipboard!');
                }}
                className="text-[10px] font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:underline"
              >
                Copy Commands
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-950 font-mono text-[11px] text-emerald-400 overflow-x-auto select-all leading-relaxed">
              <div>git remote add origin https://github.com/mahesh2008here/master-documents.git</div>
              <div>git push -u origin main</div>
              <div className="text-amber-400">git push origin v1.0.0</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-400 pt-2 border-t border-stone-200/60 dark:border-stone-800/60">
            <span>Branch: <strong>main</strong> • Tag: <strong>v1.0.0</strong></span>
            <span>License: <strong>Apache 2.0 (Offline)</strong></span>
          </div>
        </div>
      </div>

      {/* Section 4: Support Creator Banner */}
      <div
        onClick={onNavigateToSupport}
        className="droplert-card rounded-3xl p-5 shadow-sm flex items-center justify-between gap-3 cursor-pointer group active:scale-98"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Heart className="w-5 h-5 fill-rose-500" />
          </div>
          <div>
            <div className="font-bold text-xs text-stone-900 dark:text-stone-100 group-hover:underline">
              Support the Creator via UPI
            </div>
            <div className="text-[11px] text-stone-400">
              Contribute via QR code or UPI ID to keep Master Documents ad-free
            </div>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
};
