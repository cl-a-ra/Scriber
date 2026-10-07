import { useEffect, useState } from 'react';
import { ArrowUpRight, Compass, Feather, Moon, Sparkles, Sprout, Sun } from 'lucide-react';
import { getBackgroundVisual, ThemeConfig } from '../lib/themeStyles';
import { getGreeting, getGreetingName } from '../lib/greeting';
import type { SanctuaryTab } from '../types/quote';

interface WelcomeCardProps {
  displayName: string;
  themeConfig: ThemeConfig;
  darkMode: boolean;
  onNavigate: (tab: SanctuaryTab) => void;
}

export function WelcomeCard({ displayName, themeConfig, darkMode, onNavigate }: WelcomeCardProps) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = window.setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  const GreetingIcon = now.getHours() >= 17 ? Moon : Sun;
  const journeys: { tab: SanctuaryTab; label: string; description: string; icon: typeof Feather }[] = [
    { tab: 'studio', label: 'Quotes', description: 'Create a quote about anything on your mind', icon: Feather },
    { tab: 'explore', label: 'Sanctuary', description: 'Explore quotes for every feeling', icon: Compass },
    { tab: 'manifest', label: 'Manifest', description: 'Write your dreams and intentions', icon: Sprout },
  ];
  return (
    <section aria-label="Welcome to Scriber" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-300"><GreetingIcon size={14} /><time dateTime={now.toISOString()}>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</time></p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1 break-words">{getGreeting(now)}, <span style={{ color: darkMode ? themeConfig.textDark : themeConfig.primary }}>{getGreetingName(displayName)}</span><span style={{ color: themeConfig.accent }}>.</span></h1>
        </div>
        <button type="button" onClick={() => onNavigate('profile')} aria-label="Open your profile" className="w-12 h-12 shrink-0 rounded-2xl border flex items-center justify-center font-display text-lg font-bold" style={{ backgroundColor: themeConfig.accentBg, color: themeConfig.primary, borderColor: themeConfig.borderLight }}>{getGreetingName(displayName)[0].toUpperCase()}</button>
      </div>
      <div className="grid md:grid-cols-[1.5fr_1fr] rounded-[2rem] border overflow-hidden shadow-xs" style={{ backgroundColor: darkMode ? themeConfig.cardDark : themeConfig.cardLight, borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}>
        <div className="p-5 sm:p-7">
          <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold rounded-full px-3 py-1.5" style={{ backgroundColor: themeConfig.accentBg, color: themeConfig.primary }}><Sparkles size={13} />Welcome to your inspiration sanctuary</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight mt-4">A little inspiration.<br /><span style={{ color: darkMode ? themeConfig.textDark : themeConfig.primary }}>A world of possibility.</span></h2>
          <p className="mt-3 text-sm leading-relaxed max-w-lg text-stone-600 dark:text-stone-300">Find words for whatever you feel, create quotes about what matters to you, and turn your dreams into written intentions. This is your space to feel, create, and grow.</p>
          <div className="grid grid-cols-3 gap-2 mt-5">
            {journeys.map(({ tab, label, description, icon: Icon }) => {
              const className = 'min-w-0 min-h-16 rounded-2xl border px-2 py-3 flex flex-col sm:flex-row items-center justify-center gap-1.5 text-xs font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5';
              const style = { borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight };
              const content = <>
                <Icon size={17} className="shrink-0" /><span>{label}</span><ArrowUpRight size={13} className="hidden lg:block shrink-0" />
              </>;
              return tab === 'studio'
                ? <a key={tab} href="#quote-studio-container" aria-label={description} className={className} style={style}>{content}</a>
                : <button key={tab} type="button" onClick={() => onNavigate(tab)} aria-label={description} className={className} style={style}>{content}</button>;
            })}
          </div>
        </div>
        <div aria-hidden="true" className="hidden md:flex flex-col justify-center items-center text-center p-8 bg-cover bg-center" style={{ backgroundImage: getBackgroundVisual('aurora-bloom', darkMode).backgroundImage }}>
          <Sparkles size={28} className="mb-5" />
          <p className="font-hand text-5xl leading-tight">Your next chapter<br />starts with<br />a little belief.</p>
          <span className="text-[10px] uppercase tracking-[.2em] font-semibold mt-6">Words to keep. Dreams to grow.</span>
        </div>
      </div>
    </section>
  );
}
