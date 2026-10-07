import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, ChevronRight, Heart, Bookmark, LogIn, LogOut, Mail, Moon, Palette, Pencil, ShieldCheck, Sun, Type, UserRound, Bell } from 'lucide-react';
import type { User } from 'firebase/auth';
import { BottomSheet } from './BottomSheet';
import { FONT_CONFIGS, getBackgroundVisual, ThemeConfig } from '../lib/themeStyles';
import { LocalProfile, prepareProfilePhoto, saveLocalProfile } from '../lib/profileStore';
import type { UserPreferences } from '../lib/quoteStore';
import type { SanctuaryTab } from '../types/quote';

interface ProfileTabProps {
  user: User | null;
  profile: LocalProfile;
  onProfileSaved: (profile: LocalProfile) => void;
  accountError: string;
  accountBusy: boolean;
  onSignIn: () => Promise<boolean>;
  onSignOut: () => Promise<boolean>;
  preferences: UserPreferences;
  themeConfig: ThemeConfig;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenThemeSettings: () => void;
  onOpenAffirmationSettings: () => void;
  onNavigate: (tab: SanctuaryTab) => void;
  savedCount: number;
  likedCount: number;
  syncLabel: string;
  onSync: () => void;
  onImportGuest: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user, profile, onProfileSaved, accountError, accountBusy, onSignIn, onSignOut, preferences, themeConfig, darkMode,
  onToggleDarkMode, onOpenThemeSettings, onOpenAffirmationSettings, onNavigate, savedCount, likedCount, syncLabel, onSync, onImportGuest,
}: ProfileTabProps) => {
  const [draft, setDraft] = useState(profile);
  const [editError, setEditError] = useState('');
  const [notice, setNotice] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const photoRequest = useRef(0);
  const photo = profile.photoData || (profile.useAccountPhoto ? user?.photoURL : undefined);
  const editPhoto = draft.photoData || (draft.useAccountPhoto ? user?.photoURL : undefined);
  const initials = profile.displayName.split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  const panelStyle = {
    backgroundColor: darkMode ? themeConfig.cardDark : themeConfig.cardLight,
    borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
  };
  useEffect(() => { setPhotoFailed(false); }, [photo]);
  useEffect(() => () => { photoRequest.current += 1; }, []);

  const openEditor = () => {
    photoRequest.current += 1;
    setIsPreparingPhoto(false);
    setDraft(profile);
    setEditError('');
    setIsEditing(true);
  };
  const closeEditor = () => {
    photoRequest.current += 1;
    setIsPreparingPhoto(false);
    setIsEditing(false);
  };
  const choosePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const request = ++photoRequest.current;
    setIsPreparingPhoto(true);
    setEditError('');
    try {
      const photoData = await prepareProfilePhoto(file);
      if (request !== photoRequest.current) return;
      setDraft((previous) => ({ ...previous, photoData, useAccountPhoto: false }));
    } catch (photoError) {
      if (request !== photoRequest.current) return;
      console.warn('Profile picture could not be prepared', { name: photoError instanceof Error ? photoError.name : 'Unknown error' });
      setEditError(photoError instanceof Error ? photoError.message : 'Your picture could not be prepared.');
    } finally {
      if (request === photoRequest.current) setIsPreparingPhoto(false);
    }
  };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const saved = saveLocalProfile(user?.uid || null, draft);
      onProfileSaved(saved);
      setIsEditing(false);
      setNotice(user ? 'Profile saved on this device. Private cloud sync runs in the background.' : 'Profile saved on this device.');
    } catch (saveError) {
      console.error('Local profile save failed', { name: saveError instanceof Error ? saveError.name : 'Unknown error' });
      setEditError(saveError instanceof Error && saveError.name !== 'QuotaExceededError'
        ? saveError.message : 'Your device storage is full or unavailable. Your profile was not saved.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div><span className="text-xs font-semibold uppercase tracking-widest" style={{ color: themeConfig.accent }}>Your little corner of Scriber</span><h1 className="font-display text-3xl sm:text-4xl font-bold mt-2">My Profile<span style={{ color: themeConfig.accent }}>.</span></h1></div>
      <p role="status" aria-live="polite" className="text-sm">{notice}</p>
      <section className="rounded-3xl border overflow-hidden" style={panelStyle} aria-label="Your profile">
        <div className="h-28 sm:h-36 bg-cover bg-center" style={{ backgroundImage: getBackgroundVisual('aurora-bloom', darkMode).backgroundImage }} />
        <div className="px-5 sm:px-7 pb-6">
          <div className="flex items-end justify-between gap-3 -mt-12 mb-4">
            <button type="button" onClick={openEditor} aria-label="Change profile picture" className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 overflow-hidden shrink-0 shadow-md" style={{ borderColor: panelStyle.backgroundColor, backgroundColor: themeConfig.primary }}>
              {photo && !photoFailed ? <img src={photo} alt={`${profile.displayName}'s profile picture`} className="w-full h-full object-cover" onError={() => setPhotoFailed(true)} />
                : <span className="w-full h-full flex items-center justify-center font-display text-3xl font-bold text-white">{initials}</span>}
              <span className="absolute bottom-0 inset-x-0 py-1.5 flex justify-center bg-black/35 text-white"><Camera size={16} /></span>
            </button>
            <button type="button" onClick={openEditor} className="inline-flex items-center gap-2 min-h-11 border rounded-full px-4 py-2 text-xs font-semibold" style={{ borderColor: panelStyle.borderColor }}><Pencil size={15} /> Edit profile</button>
          </div>
          <h2 className="font-display text-2xl font-bold break-words">{profile.displayName}</h2>
          <p className="text-sm mt-2 whitespace-pre-line break-words text-stone-600 dark:text-stone-300">{profile.bio || 'Your words, your dreams, your own way of becoming. Add a bio to make this space yours.'}</p>
          {photoFailed && <p role="alert" className="text-xs mt-2 text-red-700 dark:text-red-300">Your profile picture could not load. Choose a new picture or use your initials.</p>}
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 mt-4 text-[11px] font-semibold" style={{ backgroundColor: themeConfig.accentBg, color: themeConfig.primary }}><UserRound size={13} />{user ? 'Google account connected' : 'Guest profile'}</span>
          <p className="text-xs text-stone-500 dark:text-stone-300 mt-3">{user ? 'Your profile syncs privately to your account, with a device copy for offline use.' : 'Your guest photo, bio, and Scriber display name are saved on this device only.'} They do not change your Google account.</p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => onNavigate('favorites')} className="rounded-2xl border p-4 text-left min-h-24" style={panelStyle}><Bookmark size={18} style={{ color: themeConfig.accent }} /><strong className="block text-2xl mt-2">{savedCount}</strong><span className="text-xs text-stone-500 dark:text-stone-300">Saved quotes</span></button>
        <div className="rounded-2xl border p-4" style={panelStyle}><Heart size={18} className="text-pink-500" /><strong className="block text-2xl mt-2">{likedCount}</strong><span className="text-xs text-stone-500 dark:text-stone-300">Words you loved</span></div>
      </div>

      <section className="rounded-3xl border p-5 sm:p-6 space-y-4" style={panelStyle}>
        <h2 className="font-display text-xl font-bold flex items-center gap-2"><Palette size={19} /> Make it feel like you</h2>
        <button type="button" onClick={onOpenThemeSettings} className="w-full flex items-center justify-between gap-3 text-left rounded-2xl border p-4 min-h-16" style={{ borderColor: panelStyle.borderColor }}>
          <span className="flex items-center gap-3 min-w-0"><span className="w-10 h-10 rounded-xl shrink-0" style={{ background: `linear-gradient(135deg, ${themeConfig.primary}, ${themeConfig.accent})` }} /><span className="min-w-0"><strong className="block text-sm">Colors & themes</strong><span className="block text-xs text-stone-500 dark:text-stone-300">{themeConfig.name}</span></span></span><ChevronRight size={18} className="shrink-0" />
        </button>
        <button type="button" onClick={onOpenThemeSettings} className="w-full flex items-center justify-between gap-3 text-left rounded-2xl border p-4 min-h-16" style={{ borderColor: panelStyle.borderColor }}>
          <span className="flex items-center gap-3"><Type size={21} /><span><strong className="block text-sm">Fonts & typography</strong><span className={`block text-sm ${FONT_CONFIGS[preferences.fontChoice].styleClass}`}>{FONT_CONFIGS[preferences.fontChoice].name}</span></span></span><ChevronRight size={18} />
        </button>
        <button type="button" onClick={onToggleDarkMode} role="switch" aria-checked={darkMode} aria-label="Dark mode" className="w-full flex items-center justify-between gap-3 rounded-2xl border p-4 min-h-16" style={{ borderColor: panelStyle.borderColor }}>
          <span className="flex items-center gap-3 text-sm font-semibold">{darkMode ? <Moon size={20} /> : <Sun size={20} />}Dark mode</span>
          <span className="w-11 h-6 rounded-full p-0.5 flex items-center" style={{ backgroundColor: darkMode ? themeConfig.primary : '#a8a29e' }}><span className={`w-5 h-5 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-5' : ''}`} /></span>
        </button>
        <button type="button" onClick={onOpenAffirmationSettings} className="w-full flex items-center justify-between gap-3 text-left rounded-2xl border p-4 min-h-16" style={{ borderColor: panelStyle.borderColor }}>
          <span className="flex items-center gap-3"><Bell size={20} /><span><strong className="block text-sm">Daily inspiration</strong><span className="text-xs text-stone-500 dark:text-stone-300">{preferences.dailyNotificationEnabled ? 'Browser notifications enabled' : 'Explore affirmations & notification settings'}</span></span></span><ChevronRight size={18} className="shrink-0" />
        </button>
      </section>

      <section className="rounded-3xl border p-5 sm:p-6 space-y-4" style={panelStyle}>
        <h2 className="font-display text-xl font-bold flex items-center gap-2"><ShieldCheck size={19} /> Account & email</h2>
        {user ? <>
          <div className="flex items-start gap-3 min-w-0"><Mail size={18} className="shrink-0 mt-1" /><div className="min-w-0"><span className="block text-xs text-stone-500 dark:text-stone-300">Google account email</span><span className="block text-sm font-semibold break-all mt-1">{user.email || 'No email was provided by Google'}</span></div></div>
          <div className="flex flex-wrap gap-2 text-[11px]"><span className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 bg-green-100 text-green-900"><Check size={12} />Signed in with Google</span>{user.email && <span className="rounded-full px-3 py-1.5 border" style={{ borderColor: panelStyle.borderColor }}>{user.emailVerified ? 'Email verified' : 'Email not verified'}</span>}</div>
          <p className="text-xs text-stone-500 dark:text-stone-300">Your email is managed by Google. Scriber does not store a password. Generated quotes, profile edits, and manifestations stay private to your account.</p>
          <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: panelStyle.borderColor }}>
            <p role="status" className="text-xs">{syncLabel}</p>
            <button type="button" onClick={onSync} className="min-h-11 text-sm font-semibold underline">Sync now / retry</button>
            <p className="text-xs text-stone-500 dark:text-stone-300">Guest data stays separate. Import only writing that belongs to you. Account profile and theme settings are not replaced; an existing account draft is kept.</p>
            <button type="button" onClick={onImportGuest} className="min-h-11 rounded-full border px-4 text-xs font-semibold" style={{ borderColor: panelStyle.borderColor }}>Import guest writing & saved quotes</button>
          </div>
          <button type="button" onClick={onSignOut} disabled={accountBusy} className="inline-flex items-center gap-2 min-h-11 rounded-full border px-5 py-3 text-sm font-semibold disabled:opacity-60" style={{ borderColor: panelStyle.borderColor }}><LogOut size={16} />{accountBusy ? 'Please wait...' : 'Sign out'}</button>
          <p className="text-xs text-stone-500 dark:text-stone-300">Signing out hides this account, but keeps its offline cache on this device. Clear site data when leaving a shared device.</p>
        </> : <>
          <p className="text-sm text-stone-600 dark:text-stone-300">Make this space yours without an account, or connect Google to show your account email and Google photo.</p>
          <p className="text-xs text-stone-500 dark:text-stone-300">Signing into Firebase Console does not sign you into Scriber. Chrome, Edge, and VS Code's browser have separate sign-in sessions. If Google's window keeps closing here, open Scriber directly in Chrome or Edge.</p>
          <button type="button" onClick={onSignIn} disabled={accountBusy} className="inline-flex items-center justify-center gap-2 min-h-12 rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: themeConfig.primary }}><LogIn size={16} />{accountBusy ? 'Connecting...' : 'Continue with Google'}</button>
        </>}
        {accountError && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{accountError}</p>}
      </section>

      <BottomSheet isOpen={isEditing} onClose={closeEditor} title="Edit Your Profile" themeConfig={themeConfig} darkMode={darkMode}>
        <form onSubmit={save} className="space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-white" style={{ backgroundColor: themeConfig.primary }}>
              {editPhoto ? <img src={editPhoto} alt="Profile picture preview" className="w-full h-full object-cover" /> : <UserRound size={32} />}
            </div>
            <div className="space-y-2">
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} className="hidden" aria-label="Profile picture file" />
              <button type="button" onClick={() => fileInput.current?.click()} disabled={isPreparingPhoto} className="flex items-center gap-2 min-h-11 rounded-full border px-4 py-2 text-xs font-semibold disabled:opacity-60" style={{ borderColor: panelStyle.borderColor }}><Camera size={15} />{isPreparingPhoto ? 'Preparing picture...' : 'Choose a picture'}</button>
              <button type="button" disabled={isPreparingPhoto} onClick={() => setDraft((previous) => ({ ...previous, photoData: null, useAccountPhoto: false }))} className="text-xs underline min-h-11 px-2">Use initials instead</button>
              {user?.photoURL && <button type="button" disabled={isPreparingPhoto} onClick={() => setDraft((previous) => ({ ...previous, photoData: null, useAccountPhoto: true }))} className="block text-xs underline min-h-11 px-2">Use Google picture</button>}
            </div>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-300">JPG, PNG, or WebP. Up to 5 MB. Center-cropped and resized to 256 x 256. {user ? 'Uploaded privately when you save; queued on this device while offline.' : 'Saved on this device. Sign in to use private cloud saving.'}</p>
          <label className="block text-xs font-semibold">Scriber display name<input value={draft.displayName} onChange={(event) => setDraft((previous) => ({ ...previous, displayName: event.target.value }))} maxLength={100} required className="mt-2 w-full rounded-xl border px-3 py-3 bg-transparent" style={{ borderColor: panelStyle.borderColor }} /></label>
          <label className="block text-xs font-semibold">Bio<textarea value={draft.bio} onChange={(event) => setDraft((previous) => ({ ...previous, bio: event.target.value }))} maxLength={280} rows={4} placeholder="A little about you, your inspirations, and what you are becoming..." className="mt-2 w-full rounded-xl border px-3 py-3 text-base resize-y bg-transparent" style={{ borderColor: panelStyle.borderColor }} /></label>
          <p className="text-xs text-stone-500 dark:text-stone-300">{draft.bio.length}/280 characters. Saved on this device</p>
          {editError && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{editError}</p>}
          <button type="submit" disabled={isPreparingPhoto} className="w-full min-h-12 rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: themeConfig.primary }}><span className="inline-flex items-center gap-2"><Check size={16} />Save profile</span></button>
        </form>
      </BottomSheet>
    </div>
  );
}
