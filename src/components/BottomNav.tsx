/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Compass,
  Wrench,
  Lock,
  SlidersHorizontal
} from 'lucide-react';

export type NavTab = 'home' | 'tools' | 'locker' | 'settings';

interface BottomNavProps {
  currentTab: NavTab | 'support';
  onSelectTab: (tab: NavTab) => void;
  vaultedCount?: number;
  accentColor?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  vaultedCount = 0,
  accentColor = '#f59e0b',
}) => {
  const tabs = [
    {
      id: 'home' as NavTab,
      label: 'Discover',
      icon: Compass,
      tooltip: 'Documents & Catalog',
    },
    {
      id: 'tools' as NavTab,
      label: 'Tools',
      icon: Wrench,
      tooltip: 'PDF & Document Tool Suite',
    },
    {
      id: 'locker' as NavTab,
      label: 'Locker',
      icon: Lock,
      tooltip: 'Private Vault (PIN Protected)',
      badge: vaultedCount > 0 ? vaultedCount : undefined,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: SlidersHorizontal,
      tooltip: 'Accents, Support & Info',
    },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <nav
        aria-label="Liquid Glass Dock"
        className="pointer-events-auto liquid-glass-dock rounded-[28px] p-1.5 flex items-center gap-1.5 sm:gap-2.5 max-w-fit shadow-2xl transition-all duration-300 backdrop-blur-2xl"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              title={tab.tooltip}
              className={`group relative flex flex-col items-center justify-center py-2 px-3.5 sm:px-5 rounded-[22px] transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'bg-white/80 dark:bg-white/10 shadow-xs'
                  : 'hover:bg-white/50 dark:hover:bg-white/5 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`}
                  style={{
                    color: isActive ? accentColor : undefined,
                  }}
                />

                {/* Vaulted items badge */}
                {tab.badge !== undefined && (
                  <span
                    className="absolute -top-1 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: accentColor }}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] tracking-tight mt-1 font-medium transition-colors ${
                  isActive
                    ? 'font-bold text-stone-900 dark:text-stone-100'
                    : 'text-stone-500 dark:text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200'
                }`}
              >
                {tab.label}
              </span>

              {/* Active liquid dot below label */}
              {isActive && (
                <div
                  className="w-1.5 h-1.5 rounded-full mt-0.5 transition-all shadow-xs"
                  style={{ backgroundColor: accentColor }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
