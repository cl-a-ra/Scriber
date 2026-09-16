import React from 'react';
import { 
  Feather, 
  Palette, 
  Moon, 
  Sun, 
  Bookmark, 
  Compass, 
  Clock, 
  Sparkles, 
  Wifi, 
  WifiOff, 
  LogIn, 
  LogOut,
  Bell,
  Heart
} from 'lucide-react';
import { User } from 'firebase/auth';
import { ThemeConfig } from '../lib/themeStyles';
import { ART_ASSETS } from '../lib/assets';

interface NavbarProps {
  activeTab: 'studio' | 'explore' | 'favorites' | 'affirmations';
  setActiveTab: (tab: 'studio' | 'explore' | 'favorites' | 'affirmations') => void;
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
  activeTab,
  setActiveTab,
  user,
  isOnline,
  isCloudSynced,
  onSignIn,
  onSignOut,
  onOpenThemeModal,
  onOpenAffirmationModal,
  darkMode,
  onToggleDarkMode,
  themeConfig,
  trendingCountdown,
  savedCount,
}) => {
  return (
    <header 
      id="scriber-header"
      className="sticky top-0 z-40 backdrop-blur-md transition-colors duration-200 border-b"
      style={{
        backgroundColor: darkMode ? `${themeConfig.cardDark}ea` : `${themeConfig.bgLight}ea`,
        borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo Brand Mark */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('studio')}>
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xs border border-amber-900/10 dark:border-amber-100/10 flex-shrink-0">
              <img 
                src={ART_ASSETS.appIcon} 
                alt="Scriber Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span 
                  className="font-display font-bold text-2xl tracking-tight"
                  style={{ color: darkMode ? themeConfig.textDark : themeConfig.textLight }}
                >
                  Scriber
                </span>
                <span 
                  className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    backgroundColor: themeConfig.accentBg,
                    color: themeConfig.primary,
                  }}
                >
                  Locs & Soul
                </span>
              </div>
              <p className="text-xs font-body text-stone-500 dark:text-stone-400 hidden sm:block">
                Minimalist typography & crown inspiration sanctuary
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full border"
            style={{
              backgroundColor: darkMode ? `${themeConfig.bgDark}80` : `${themeConfig.bgLight}cc`,
              borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
            }}
          >
            <button
              id="nav-tab-studio"
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'studio' 
                  ? 'shadow-xs font-semibold' 
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
              style={activeTab === 'studio' ? {
                backgroundColor: themeConfig.primary,
                color: '#ffffff',
              } : {}}
            >
              <Feather className="w-4 h-4" />
              <span>Studio</span>
            </button>

            <button
              id="nav-tab-explore"
              onClick={() => setActiveTab('explore')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'explore' 
                  ? 'shadow-xs font-semibold' 
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
              style={activeTab === 'explore' ? {
                backgroundColor: themeConfig.primary,
                color: '#ffffff',
              } : {}}
            >
              <Compass className="w-4 h-4" />
              <span>Locs & Roots</span>
            </button>

            <button
              id="nav-tab-favorites"
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all relative ${
                activeTab === 'favorites' 
                  ? 'shadow-xs font-semibold' 
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
              style={activeTab === 'favorites' ? {
                backgroundColor: themeConfig.primary,
                color: '#ffffff',
              } : {}}
            >
              <Bookmark className="w-4 h-4" />
              <span>Personal Collection</span>
              {savedCount > 0 && (
                <span 
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    activeTab === 'favorites' ? 'bg-white/20 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200'
                  }`}
                >
                  {savedCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-affirmations"
              onClick={() => setActiveTab('affirmations')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'affirmations' 
                  ? 'shadow-xs font-semibold' 
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
              style={activeTab === 'affirmations' ? {
                backgroundColor: themeConfig.primary,
                color: '#ffffff',
              } : {}}
            >
              <Sparkles className="w-4 h-4" />
              <span>Daily Affirmations</span>
            </button>
          </nav>

          {/* Action Tools: Cycle Countdown, Theme, Notifications, Auth */}
          <div className="flex items-center gap-2">
            
            {/* 6-Hour Cycle Timer Pill */}
            <div 
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium border cursor-pointer transition-transform hover:scale-[1.02]"
              style={{
                backgroundColor: darkMode ? `${themeConfig.cardDark}` : `${themeConfig.cardLight}`,
                borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
                color: themeConfig.accent,
              }}
              title="Quotes & Trending Typography refresh every 6 hours"
              onClick={() => setActiveTab('explore')}
            >
              <Clock className="w-3.5 h-3.5 animate-pulse text-amber-600 dark:text-amber-400" />
              <span className="text-stone-500 dark:text-stone-400 font-sans text-[11px]">Cycle:</span>
              <span className="font-bold">{trendingCountdown}</span>
            </div>

            {/* Offline / Online Cloud Status */}
            <div 
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono border"
              style={{
                backgroundColor: isOnline ? (darkMode ? '#172413' : '#edf6e8') : (darkMode ? '#2c1e19' : '#faebe6'),
                borderColor: isOnline ? (darkMode ? '#2c4024' : '#c8e2bd') : (darkMode ? '#543126' : '#f0c2b5'),
                color: isOnline ? (darkMode ? '#a1d892' : '#376829') : (darkMode ? '#f09880' : '#a33922'),
              }}
              title={isOnline ? (isCloudSynced ? 'Connected & Cloud-Synced' : 'Online (Local Cache Active)') : 'Offline Mode Active'}
            >
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span className="hidden sm:inline font-sans text-[11px] font-medium">
                {isOnline ? (isCloudSynced ? 'Cloud Synced' : 'Online') : 'Offline'}
              </span>
            </div>

            {/* Daily Affirmation Reminder Trigger */}
            <button
              id="btn-affirmation-reminder"
              onClick={onOpenAffirmationModal}
              className="p-2 rounded-full border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
              style={{
                borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
                color: darkMode ? themeConfig.textDark : themeConfig.textLight,
              }}
              aria-label="Daily Affirmation Notification"
              title="Daily Affirmation Notification"
            >
              <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </button>

            {/* Customizer Modal Trigger */}
            <button
              id="btn-theme-customizer"
              onClick={onOpenThemeModal}
              className="p-2 rounded-full border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
              style={{
                borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
                color: darkMode ? themeConfig.textDark : themeConfig.textLight,
              }}
              aria-label="Customize Earthy Theme & Typography"
              title="Customize Palette & Fonts"
            >
              <Palette className="w-4 h-4" />
            </button>

            {/* Dark Mode Switcher */}
            <button
              id="btn-darkmode-toggle"
              onClick={onToggleDarkMode}
              className="p-2 rounded-full border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
              style={{
                borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
                color: darkMode ? themeConfig.textDark : themeConfig.textLight,
              }}
              aria-label="Toggle Dark Mode"
              title={darkMode ? "Switch to Cozy Light" : "Switch to Accessible Dark"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Firebase Auth Google / Sign Out */}
            {user ? (
              <div className="flex items-center gap-2 pl-1">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-8 h-8 rounded-full border border-stone-300 dark:border-stone-700" 
                  />
                ) : (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
                    style={{ backgroundColor: themeConfig.primary }}
                  >
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  id="btn-sign-out"
                  onClick={onSignOut}
                  className="p-1.5 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-google-sign-in"
                onClick={onSignIn}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:shadow-xs"
                style={{
                  backgroundColor: themeConfig.primary,
                  borderColor: themeConfig.primary,
                  color: '#ffffff',
                }}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Cloud Sync</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t"
          style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}
        >
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex flex-col items-center py-1 px-3 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'studio' ? 'font-bold' : 'text-stone-500'
            }`}
            style={activeTab === 'studio' ? { color: themeConfig.primary } : {}}
          >
            <Feather className="w-4 h-4 mb-0.5" />
            <span>Studio</span>
          </button>
          
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex flex-col items-center py-1 px-3 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'explore' ? 'font-bold' : 'text-stone-500'
            }`}
            style={activeTab === 'explore' ? { color: themeConfig.primary } : {}}
          >
            <Compass className="w-4 h-4 mb-0.5" />
            <span>Locs & Roots</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex flex-col items-center py-1 px-3 text-xs font-medium rounded-lg transition-colors relative ${
              activeTab === 'favorites' ? 'font-bold' : 'text-stone-500'
            }`}
            style={activeTab === 'favorites' ? { color: themeConfig.primary } : {}}
          >
            <Bookmark className="w-4 h-4 mb-0.5" />
            <span>Saved ({savedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('affirmations')}
            className={`flex flex-col items-center py-1 px-3 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'affirmations' ? 'font-bold' : 'text-stone-500'
            }`}
            style={activeTab === 'affirmations' ? { color: themeConfig.primary } : {}}
          >
            <Sparkles className="w-4 h-4 mb-0.5" />
            <span>Affirm</span>
          </button>
        </div>

      </div>
    </header>
  );
};
