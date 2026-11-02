/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Compass,
  Layers,
  Bookmark,
  Heart,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';

export type NavTab = 'home' | 'files' | 'favorites' | 'support' | 'settings';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  favoritesCount?: number;
  accentColor?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  favoritesCount = 0,
  accentColor = '#f59e0b',
}) => {
  const tabs = [
    {
      id: 'home' as NavTab,
      label: 'Discover',
      icon: Compass,
      tooltip: 'Overview & Recent',
    },
    {
      id: 'files' as NavTab,
      label: 'Library',
      icon: Layers,
      tooltip: 'All Documents',
    },
    {
      id: 'favorites' as NavTab,
      label: 'Starred',
      icon: Bookmark,
      badge: favoritesCount > 0 ? favoritesCount : undefined,
      tooltip: 'Favorites',
    },
    {
      id: 'support' as NavTab,
      label: 'Support',
      icon: Heart,
      tooltip: 'Support & UPI Donation',
      highlight: true,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: SlidersHorizontal,
      tooltip: 'Accents & GitHub',
    },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <nav
        aria-label="Liquid Glass Dock"
        className="pointer-events-auto liquid-glass-dock rounded-[28px] p-1.5 flex items-center gap-1 sm:gap-2 max-w-fit shadow-2xl transition-all duration-300"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              title={tab.tooltip}
              className={`group relative flex flex-col items-center justify-center py-2 px-3 sm:px-4 rounded-[22px] transition-all duration-200 active:scale-90 ${
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

                {/* Starred badge */}
                {tab.badge !== undefined && (
                  <span
                    className="absolute -top-1 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: accentColor }}
                  >
                    {tab.badge}
                  </span>
                )}

                {/* Heart pulse ring for support tab */}
                {tab.highlight && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-ping opacity-75" />
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
                  className="w-1 h-1 rounded-full mt-0.5 transition-all"
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
