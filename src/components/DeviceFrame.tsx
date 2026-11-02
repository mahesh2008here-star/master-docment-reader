/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Wifi, BatteryMedium, Signal, Smartphone, Monitor } from 'lucide-react';

interface DeviceFrameProps {
  enabled: boolean;
  onToggleFrame: () => void;
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ enabled, onToggleFrame, children }) => {
  if (!enabled) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 selection:bg-amber-500/20">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-stone-900/90 py-4 px-2 sm:py-8 sm:px-4 flex flex-col items-center justify-center selection:bg-amber-500/20">
      {/* Top Device Bar */}
      <div className="w-full max-w-[430px] flex items-center justify-between pb-3 text-stone-400 text-xs px-2">
        <div className="flex items-center gap-1.5 font-medium">
          <Smartphone className="w-4 h-4 text-amber-500" />
          <span>Motorola Moto G45 5G • Android 16</span>
        </div>
        <button
          onClick={onToggleFrame}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
          title="Switch to full viewport view"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Full View</span>
        </button>
      </div>

      {/* Motorola Moto G45 5G Outer Chassis */}
      <div className="w-full max-w-[420px] h-[860px] max-h-[92vh] bg-stone-950 rounded-[48px] p-3 shadow-2xl border-4 border-stone-800 relative flex flex-col overflow-hidden ring-1 ring-white/10">
        {/* Moto Camera Hole */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-black ring-2 ring-stone-900 z-50 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-950/70" />
        </div>

        {/* Android 16 Status Bar */}
        <div className="w-full h-8 flex items-center justify-between px-6 text-stone-700 dark:text-stone-300 text-[11px] font-semibold tracking-tight select-none z-40 bg-stone-50 dark:bg-stone-900">
          <span>02:24</span>
          <div className="flex items-center gap-1.5 opacity-80">
            <Signal className="w-3 h-3" />
            <span className="text-[10px]">5G</span>
            <Wifi className="w-3 h-3" />
            <BatteryMedium className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* App Viewport */}
        <div className="relative flex-1 w-full overflow-hidden flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
          {children}
        </div>

        {/* Android 16 Gesture Pill */}
        <div className="w-full h-5 bg-stone-50 dark:bg-stone-950 flex items-center justify-center z-40">
          <div className="w-32 h-1 bg-stone-400 dark:bg-stone-600 rounded-full" />
        </div>
      </div>
    </div>
  );
};
