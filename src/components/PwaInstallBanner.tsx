import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';
import { ThemeConfig } from '../lib/themeStyles';

interface PwaInstallBannerProps {
  themeConfig: ThemeConfig;
  darkMode: boolean;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({
  themeConfig,
  darkMode,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already running in standalone PWA mode
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isStandalone || isDismissed || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <aside 
      aria-label="Install Scriber app"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-1"
    >
      <div 
        className="rounded-xl p-3 sm:p-4 border flex items-center justify-between gap-3 shadow-xs"
        style={{
          backgroundColor: darkMode ? `${themeConfig.cardDark}` : '#fdf8f0',
          borderColor: darkMode ? themeConfig.borderDark : '#e6d9c6',
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-xs"
            style={{ backgroundColor: themeConfig.primary }}
          >
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100">
              Install Scriber for Seamless Offline Access
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {isIOS 
                ? 'On iOS: Tap Share ⎙ then select "Add to Home Screen"' 
                : 'Keep your quote studio and inspiration sanctuary close, even offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-white shadow-xs transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: themeConfig.primary }}
            >
              Install App
            </button>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
