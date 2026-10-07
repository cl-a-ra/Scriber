import React from 'react';
import { Feather, Palette, Moon, Sun, Bookmark, Compass, Sparkles, LogIn, LogOut, Bell, Sprout, Wifi, WifiOff } from 'lucide-react';
import { User } from 'firebase/auth';
import { ThemeConfig } from '../lib/themeStyles';
import { SanctuaryTab } from '../types/quote';

interface NavbarProps {
  activeTab: SanctuaryTab;
  setActiveTab: (tab: SanctuaryTab) => void;
  user: User | null;
  isOnline: boolean;
  isCloudSynced: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenThemeModal: () => void;
  onOpenAffirmationModal: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  themeConfig: ThemeConfig;
  trendingCountdown: string;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab, setActiveTab, user, isOnline, isCloudSynced, onSignIn, onSignOut,
  onOpenThemeModal, onOpenAffirmationModal, darkMode, onToggleDarkMode, themeConfig, savedCount,
}) => {
  const tabs = [
    { id: 'studio' as const, label: 'Studio', icon: Feather },
    { id: 'explore' as const, label: 'Sanctuary', icon: Compass },
    { id: 'manifest' as const, label: 'Manifest', icon: Sprout },
    { id: 'favorites' as const, label: 'Saved', icon: Bookmark },
    { id: 'affirmations' as const, label: 'Affirm', icon: Sparkles },
  ];
  return (
    <>
    <header id="scriber-header" className="sticky top-0 z-40 border-b backdrop-blur-xl"
      style={{ backgroundColor: `${darkMode ? themeConfig.cardDark : themeConfig.cardLight}ed`, borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-3" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
          <button onClick={() => setActiveTab('studio')} className="flex items-center gap-2 sm:gap-3 text-left" aria-label="Scriber home">
            <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-white shadow-sm rotate-[-6deg]"
              style={{ background: `linear-gradient(135deg, ${themeConfig.primary}, ${themeConfig.accent})` }}>
              <Feather className="w-6 h-6" />
            </span>
            <span>
              <span className="block font-display text-xl sm:text-2xl font-bold tracking-tight">Scriber<span style={{ color: themeConfig.accent }}>.</span></span>
              <span className="hidden min-[360px]:block text-[11px] sm:text-xs text-stone-500 dark:text-stone-300">Inspiration sanctuary</span>
            </span>
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="hidden lg:flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-300"
              title={isCloudSynced ? 'Cloud connected' : 'Local cache active'}>
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isOnline ? (isCloudSynced ? 'Cloud connected' : 'Local mode') : 'Offline'}
            </span>
            <button id="btn-theme-customizer" onClick={onOpenThemeModal} aria-label="Customize colors and fonts"
              className="rounded-full min-w-11 min-h-11 flex items-center justify-center border" style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}>
              <Palette size={18} />
            </button>
            <button onClick={onToggleDarkMode} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} className="hidden sm:flex rounded-full min-w-11 min-h-11 items-center justify-center border"
              style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={onOpenAffirmationModal} aria-label="Daily affirmation reminder" className="rounded-full min-w-11 min-h-11 flex items-center justify-center border"
              style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}><Bell size={18} /></button>
            <button onClick={user ? onSignOut : onSignIn} aria-label={user ? 'Sign out' : 'Sign in for cloud sync'}
              className="flex items-center justify-center gap-2 rounded-full min-w-11 min-h-11 px-3 py-2.5 text-xs font-semibold text-white" style={{ backgroundColor: themeConfig.primary }}>
              {user ? <LogOut size={16} /> : <LogIn size={16} />}
              <span className="hidden sm:inline">{user ? 'Sign out' : 'Cloud sync'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
    <nav aria-label="Main navigation" className="fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-xl"
      style={{ backgroundColor: `${darkMode ? themeConfig.cardDark : themeConfig.cardLight}f5`, borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
      <div className="grid grid-cols-5 max-w-2xl mx-auto px-2 pt-2 gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} id={`nav-tab-${id}`} onClick={() => setActiveTab(id)} aria-current={activeTab === id ? 'page' : undefined}
              aria-label={id === 'favorites' && savedCount ? `Saved (${savedCount})` : label}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl min-h-14 px-1 py-1 text-[10px] sm:text-xs font-semibold transition-colors"
              style={{ color: activeTab === id ? (darkMode ? themeConfig.textDark : themeConfig.primary) : (darkMode ? '#c4bdd0' : '#68616f') }}>
              <span className="flex items-center justify-center w-12 h-7 rounded-full" style={{ backgroundColor: activeTab === id ? themeConfig.primary : 'transparent', color: activeTab === id ? '#fff' : undefined }}><Icon size={19} /></span>
              <span>{label}{id === 'favorites' && savedCount > 0 ? ` (${Math.min(savedCount, 99)}${savedCount > 99 ? '+' : ''})` : ''}</span>
            </button>
          ))}
      </div>
    </nav>
    </>
  );
};
