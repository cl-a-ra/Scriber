import React from 'react';
import { Clock, Sparkles, RefreshCw, Wand2, Compass } from 'lucide-react';
import { SixHourTrendingTheme } from '../types/quote';
import { ThemeConfig } from '../lib/themeStyles';

interface SixHourTrendingBannerProps {
  theme: SixHourTrendingTheme;
  countdown: string;
  onApplyTheme: (theme: SixHourTrendingTheme) => void;
  onQuickGenerateWithTheme: (theme: SixHourTrendingTheme) => void;
  themeConfig: ThemeConfig;
  darkMode: boolean;
}

export const SixHourTrendingBanner: React.FC<SixHourTrendingBannerProps> = ({
  theme,
  countdown,
  onApplyTheme,
  onQuickGenerateWithTheme,
  themeConfig,
  darkMode,
}) => {
  return (
    <div 
      id="six-hour-trending-banner"
      className="rounded-2xl p-5 sm:p-6 border transition-all relative overflow-hidden shadow-xs mb-8"
      style={{
        backgroundColor: darkMode ? `${themeConfig.cardDark}` : '#fdfaf5',
        borderColor: darkMode ? themeConfig.borderDark : '#e8decb',
      }}
    >
      {/* Subtle organic background accent blob */}
      <div 
        className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-10 blur-2xl pointer-events-none"
        style={{ backgroundColor: theme.palette.secondary }}
      />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative z-10">
        
        {/* Left column: 6-hour cycle indicator & title */}
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wide uppercase"
              style={{
                backgroundColor: themeConfig.accentBg,
                color: themeConfig.primary,
              }}
            >
              <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '10s' }} />
              6-Hour Cycle Active
            </span>

            <span 
              className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border"
              style={{
                borderColor: darkMode ? themeConfig.borderDark : '#dec9af',
                color: themeConfig.accent,
                backgroundColor: darkMode ? '#1e221c' : '#ffffff'
              }}
            >
              Rotates in {countdown}
            </span>

            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
              {theme.styleTag}
            </span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-1 text-stone-900 dark:text-stone-100">
            {theme.themeTitle}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 font-body mb-3">
            {theme.subtitle}
          </p>

          {/* Inspirational Seed & Loc Hair Affirmation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-stone-100/70 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/50">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1">
                Trending Font Pairing
              </span>
              <p className="text-xs font-medium text-stone-800 dark:text-stone-200">
                <span className="font-bold">{theme.fontPairing.headingLabel}</span> + {theme.fontPairing.bodyLabel}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/40">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-1">
                Crown Locs Focus
              </span>
              <p className="text-xs italic text-stone-700 dark:text-stone-300">
                "{theme.locHairAffirmation}"
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Action buttons */}
        <div className="flex flex-row lg:flex-col gap-2.5 flex-shrink-0">
          <button
            id="btn-apply-trending-typography"
            onClick={() => onApplyTheme(theme)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:shadow-xs"
            style={{
              borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
              backgroundColor: darkMode ? `${themeConfig.bgDark}80` : '#ffffff',
              color: darkMode ? themeConfig.textDark : themeConfig.textLight,
            }}
          >
            <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Apply Style to Studio</span>
          </button>

          <button
            id="btn-quick-generate-theme"
            onClick={() => onQuickGenerateWithTheme(theme)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all shadow-xs hover:scale-[1.01]"
            style={{
              backgroundColor: themeConfig.primary,
            }}
          >
            <Wand2 className="w-4 h-4" />
            <span>Generate In This Style</span>
          </button>
        </div>

      </div>
    </div>
  );
};
