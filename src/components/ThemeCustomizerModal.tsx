import React from 'react';
import { Check, Bell, BellRing, Sparkles, Moon, Sun, Type } from 'lucide-react';
import { ThemeColorPreset, FontChoice } from '../types/quote';
import { THEME_CONFIGS, FONT_CONFIGS, ThemeConfig } from '../lib/themeStyles';
import { UserPreferences } from '../lib/quoteStore';
import { BottomSheet } from './BottomSheet';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  themeConfig: ThemeConfig;
  darkMode: boolean;
  onRequestNotificationPermission: () => Promise<void>;
  persistenceError?: string;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  themeConfig,
  darkMode,
  onRequestNotificationPermission,
  persistenceError,
}) => {
  if (!isOpen) return null;

  const presets: { id: ThemeColorPreset; label: string; primary: string; secondary: string; desc: string }[] = [
    { id: 'lavender-pop', label: 'Lavender Playground', primary: '#6940b5', secondary: '#c79aec', desc: 'Lilac dreams, orchid pop, a little magic' },
    { id: 'sunshine-club', label: 'Sunshine Club', primary: '#a64221', secondary: '#ffd16c', desc: 'Peach fizz, marigold, sunny little joys' },
    { id: 'ocean-daydream', label: 'Ocean Daydream', primary: '#096d80', secondary: '#79d4dc', desc: 'Lagoon blues, mint skies, fresh possibilities' },
    { id: 'earthy-sage', label: 'Earthy Sage', primary: '#4e5b31', secondary: '#82957b', desc: 'Olive greens, cozy clay and soft stone' },
    { id: 'terracotta-ochre', label: 'Terracotta Ochre', primary: '#9e6241', secondary: '#c98a4b', desc: 'Sun-baked clay, warm desert sand' },
    { id: 'reggae-gold', label: 'Reggae Roots & Gold', primary: '#324024', secondary: '#d4a343', desc: 'Roots forest, ochre gold and earth warmth' },
    { id: 'genz-matcha', label: 'Gen-Z Matcha', primary: '#3d4d38', secondary: '#82957b', desc: 'Matcha sage, oat milk, aesthetic lo-fi' },
    { id: 'deep-cocoa', label: 'Deep Espresso & Linen', primary: '#4a3728', secondary: '#8a684d', desc: 'Deep warm wood, cocoa, quiet sanctuary' },
    { id: 'desert-rose', label: 'Desert Rose', primary: '#854b4b', secondary: '#b87676', desc: 'Dusty terracotta rose, muted earthy warmth' },
  ];

  const fontKeys = Object.keys(FONT_CONFIGS) as FontChoice[];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Personalize Studio Aesthetic" themeConfig={themeConfig} darkMode={darkMode}>
      <div 
        id="theme-customizer-dialog"
        className="w-full"
        style={{
          backgroundColor: darkMode ? themeConfig.cardDark : themeConfig.cardLight,
          borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
          color: darkMode ? themeConfig.textDark : themeConfig.textLight,
        }}
      >
        {persistenceError && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{persistenceError}</p>}
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b"
          style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}
        >
          <div>
            <p className="text-xs font-body text-stone-500 dark:text-stone-400 mt-1">
              Pick your mood: playful palettes, expressive fonts, and a space that feels like you
            </p>
          </div>
        </div>

        {/* 1. Earthy Color Schemes */}
        <div className="mt-6">
          <label className="text-xs font-mono uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400 block mb-3">
            Your Color Playground
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {presets.map((preset) => {
              const isSelected = preferences.themeColor === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onUpdatePreferences({ themeColor: preset.id })}
                  className={`p-3 rounded-xl border text-left flex items-start justify-between transition-all ${
                    isSelected ? 'ring-2 shadow-xs' : 'hover:border-stone-400'
                  }`}
                  style={{
                    borderColor: isSelected ? themeConfig.primary : (darkMode ? themeConfig.borderDark : themeConfig.borderLight),
                    backgroundColor: darkMode ? `${themeConfig.bgDark}60` : '#ffffff',
                    boxShadow: isSelected ? `0 0 0 1px ${themeConfig.primary}` : undefined
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex -space-x-1">
                        <span className="w-3.5 h-3.5 rounded-full border border-white" style={{ backgroundColor: preset.primary }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-white" style={{ backgroundColor: preset.secondary }} />
                      </div>
                      <span className="font-medium text-sm">{preset.label}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight">
                      {preset.desc}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: themeConfig.primary }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Distinctive Typography Pairing */}
        <div className="mt-6">
          <label className="text-xs font-mono uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400 block mb-3">
            Signature Typography
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fontKeys.map((key) => {
              const font = FONT_CONFIGS[key];
              const isSelected = preferences.fontChoice === key;
              return (
                <button
                  key={key}
                  onClick={() => onUpdatePreferences({ fontChoice: key })}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected ? 'ring-2 shadow-xs' : 'hover:border-stone-400'
                  }`}
                  style={{
                    borderColor: isSelected ? themeConfig.primary : (darkMode ? themeConfig.borderDark : themeConfig.borderLight),
                    backgroundColor: darkMode ? `${themeConfig.bgDark}60` : '#ffffff',
                  }}
                >
                  <div>
                    <span className={`text-base font-medium block ${font.styleClass}`}>
                      {font.name}
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400">
                      {font.description}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: themeConfig.primary }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Dark Mode & Accessibility */}
        <div className="mt-6 p-4 rounded-xl border flex items-center justify-between"
          style={{
            borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
            backgroundColor: darkMode ? `${themeConfig.bgDark}80` : '#fcfbfa',
          }}
        >
          <div className="flex items-center gap-3">
            {darkMode ? (
              <Moon className="w-5 h-5 text-amber-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-600" />
            )}
            <div>
              <p className="font-semibold text-sm">Accessible Night Mode</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Gentle on the eyes, deep warm-tinted dark aesthetic
              </p>
            </div>
          </div>
          <button
            onClick={() => onUpdatePreferences({ darkMode: !darkMode })}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
              darkMode ? 'bg-amber-600' : 'bg-stone-300'
            }`}
          >
            <div 
              className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 4. Daily Affirmation Notifications */}
        <div className="mt-4 p-4 rounded-xl border"
          style={{
            borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
            backgroundColor: darkMode ? `${themeConfig.bgDark}80` : '#fcfbfa',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold text-sm">Daily Affirmation Reminder</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Make room for a mindful moment of inspiration
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (!preferences.dailyNotificationEnabled) {
                  await onRequestNotificationPermission();
                } else {
                  onUpdatePreferences({ dailyNotificationEnabled: false });
                }
              }}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                preferences.dailyNotificationEnabled ? 'bg-amber-600' : 'bg-stone-300'
              }`}
            >
              <div 
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  preferences.dailyNotificationEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {preferences.dailyNotificationEnabled && (
            <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-stone-500"
              style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}
            >
              <span className="font-medium">Scheduled Delivery Time:</span>
              <input 
                type="time" 
                value={preferences.notificationTime || '09:00'}
                onChange={(e) => onUpdatePreferences({ notificationTime: e.target.value })}
                className="px-2 py-1 rounded-md border text-xs font-mono bg-transparent"
                style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}
              />
            </div>
          )}
        </div>

        {/* Close Done Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            aria-label="Close theme customizer"
            className="px-6 py-2.5 rounded-full text-sm font-semibold text-white shadow-xs transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: themeConfig.primary }}
          >
            Apply Changes
          </button>
        </div>

      </div>
    </BottomSheet>
  );
};
