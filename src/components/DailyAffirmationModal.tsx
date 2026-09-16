import React, { useState } from 'react';
import { X, Sparkles, Bell, BellRing, Copy, Check, Heart, Volume2, Share2 } from 'lucide-react';
import { DAILY_AFFIRMATIONS_BANK } from '../lib/cycleThemes';
import { ThemeConfig } from '../lib/themeStyles';

interface DailyAffirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestNotificationPermission: () => Promise<void>;
  notificationsEnabled: boolean;
  themeConfig: ThemeConfig;
  darkMode: boolean;
}

export const DailyAffirmationModal: React.FC<DailyAffirmationModalProps> = ({
  isOpen,
  onClose,
  onRequestNotificationPermission,
  notificationsEnabled,
  themeConfig,
  darkMode,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentAffirmation = DAILY_AFFIRMATIONS_BANK[currentIndex % DAILY_AFFIRMATIONS_BANK.length];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`“${currentAffirmation.text}” — Daily Affirmation from Scriber`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % DAILY_AFFIRMATIONS_BANK.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div 
        id="daily-affirmation-modal"
        className="w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all text-center relative overflow-hidden"
        style={{
          backgroundColor: darkMode ? themeConfig.cardDark : themeConfig.cardLight,
          borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
          color: darkMode ? themeConfig.textDark : themeConfig.textLight,
        }}
      >
        {/* Soft glowing ambient circle */}
        <div 
          className="absolute -top-12 -left-12 w-48 h-48 rounded-full opacity-15 blur-2xl pointer-events-none"
          style={{ backgroundColor: themeConfig.accent }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5 text-stone-400" />
        </button>

        {/* Affirmation Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-4 border"
          style={{
            borderColor: themeConfig.primary,
            color: themeConfig.primary,
            backgroundColor: themeConfig.accentBg,
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{currentAffirmation.focus}</span>
        </div>

        <h3 className="font-display text-2xl font-bold tracking-tight mb-2">
          Daily Sacred Affirmation
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto mb-6">
          Read aloud, breathe deeply, and crown yourself in quiet confidence
        </p>

        {/* Affirmation Text Card */}
        <div 
          className="p-6 sm:p-7 rounded-2xl border my-4 shadow-xs relative"
          style={{
            backgroundColor: darkMode ? `${themeConfig.bgDark}80` : '#faf8f4',
            borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
          }}
        >
          <p className="font-display text-xl sm:text-2xl leading-relaxed italic text-stone-900 dark:text-stone-100">
            “{currentAffirmation.text}”
          </p>
        </div>

        {/* Actions: Copy & Next affirmation */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
            style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Affirmation Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleNext}
            className="px-4 py-2 rounded-full text-xs font-medium border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
            style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}
          >
            Next Affirmation
          </button>
        </div>

        {/* Notification Subscription Card */}
        <div 
          className="mt-6 p-4 rounded-2xl border text-left flex items-center justify-between"
          style={{
            borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
            backgroundColor: darkMode ? `${themeConfig.bgDark}60` : '#fcfbfa',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-xs text-stone-800 dark:text-stone-200">
                Morning Affirmation Push
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {notificationsEnabled ? 'Active: Delivering daily inspiration' : 'Get notified with crown wisdom daily'}
              </p>
            </div>
          </div>

          <button
            onClick={onRequestNotificationPermission}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
            style={{
              borderColor: notificationsEnabled ? '#4e5b31' : themeConfig.primary,
              backgroundColor: notificationsEnabled ? '#4e5b31' : themeConfig.primary,
              color: '#ffffff'
            }}
          >
            {notificationsEnabled ? 'Enabled' : 'Enable'}
          </button>
        </div>

      </div>
    </div>
  );
};
