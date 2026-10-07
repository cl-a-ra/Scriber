import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { 
  Search, 
  Filter, 
  Sparkles, 
  Compass, 
  Bookmark, 
  BookmarkCheck, 
  Feather, 
  Heart, 
  Clock, 
  RefreshCw, 
  Download, 
  Share2, 
  Plus, 
  SlidersHorizontal,
  CloudCheck,
  Tag,
  AlertCircle
} from 'lucide-react';
import { QuoteItem, QuoteCategory, QuoteFeedback, SixHourTrendingTheme, SanctuaryTab, QUOTE_CATEGORIES, AestheticStyle } from './types/quote';
import { 
  getCurrentSixHourTheme, 
  INITIAL_CURATED_QUOTES, 
  DAILY_AFFIRMATIONS_BANK 
} from './lib/cycleThemes';
import { 
  THEME_CONFIGS, 
  ThemeConfig 
} from './lib/themeStyles';
import { 
  loadLocalPreferences, 
  saveLocalPreferences, 
  loadSavedQuoteIds, 
  saveSavedQuoteIds, 
  loadLikedQuoteIds, 
  saveLikedQuoteIds, 
  loadLocalQuotes, 
  saveLocalQuotes, 
  loadLocalFeedbacks, 
  saveLocalFeedbacks, 
  UserPreferences 
} from './lib/quoteStore';
import type { User } from 'firebase/auth';
import { getFirebaseClient, usingFirebaseEmulators } from './lib/firebaseClient';

import { Navbar } from './components/Navbar';
import { SixHourTrendingBanner } from './components/SixHourTrendingBanner';
import { QuoteCard } from './components/QuoteCard';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { generateQuote } from './lib/aiClient';
import { WelcomeCard } from './components/WelcomeCard';
import { loadLocalProfile, saveLocalProfile } from './lib/profileStore';
import { CloudSync, SyncStatus } from './lib/cloudSync';
import { CloudMutation, validateMutation } from './lib/cloudContracts';
import { loadManifestationState, saveManifestationState } from './lib/manifestationStore';
import { ManifestationState } from './types/manifestation';

const QuoteStudio = lazy(() => import('./components/QuoteStudio').then((module) => ({ default: module.QuoteStudio })));
const ManifestationBox = lazy(() => import('./components/ManifestationBox').then((module) => ({ default: module.ManifestationBox })));
const ProfileTab = lazy(() => import('./components/ProfileTab').then((module) => ({ default: module.ProfileTab })));
const ThemeCustomizerModal = lazy(() => import('./components/ThemeCustomizerModal').then((module) => ({ default: module.ThemeCustomizerModal })));
const FeedbackModal = lazy(() => import('./components/FeedbackModal').then((module) => ({ default: module.FeedbackModal })));
const DailyAffirmationModal = lazy(() => import('./components/DailyAffirmationModal').then((module) => ({ default: module.DailyAffirmationModal })));

export default function App() {
  const [activeTab, setActiveTab] = useState<SanctuaryTab>('studio');

  // Preferences: theme colors, typography, dark mode, notifications
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadLocalPreferences());
  const [darkMode, setDarkMode] = useState<boolean>(() => preferences.darkMode);

  // User auth state
  const [user, setUser] = useState<User | null>(null);
  const [localProfile, setLocalProfile] = useState(() => loadLocalProfile(null, 'Scriber Muse'));
  const [accountError, setAccountError] = useState('');
  const [cloudSyncError, setCloudSyncError] = useState('');
  const [accountBusy, setAccountBusy] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ state: 'pending', pending: 0, error: '' });
  const [manifestation, setManifestation] = useState(() => loadManifestationState(null));
  const manifestationRef = useRef(manifestation);
  const scopeRef = useRef<string | null>(null);
  const cloudRef = useRef<CloudSync | null>(null);
  const hasHydratedRef = useRef(false);
  const publicQuotesRef = useRef<QuoteItem[]>([]);
  const privateQuoteIdsRef = useRef<Set<string>>(new Set());
  const publicQuoteIdsRef = useRef<Set<string>>(new Set());
  const [importNotice, setImportNotice] = useState('');
  const cacheErrorsRef = useRef({ profile: '', box: '' });
  const syncLabel = !user ? 'Saved on this device. Sign in for private cloud sync.'
    : syncStatus.state === 'synced' ? 'Private cloud synced'
    : syncStatus.state === 'offline' ? 'Offline. Device copy kept; sync resumes online.'
    : syncStatus.state === 'error' ? 'Cloud sync needs attention. Device copy kept.'
    : `Private cloud sync ${syncStatus.state === 'syncing' ? 'in progress' : 'pending'}${syncStatus.pending ? ` (${syncStatus.pending})` : ''}`;

  // Quotes data & interactions
  const [quotes, setQuotes] = useState<QuoteItem[]>(() => loadLocalQuotes());
  const [savedIds, setSavedIds] = useState<string[]>(() => loadSavedQuoteIds());
  const [likedIds, setLikedIds] = useState<string[]>(() => loadLikedQuoteIds());
  const [feedbacks, setFeedbacks] = useState<Record<string, QuoteFeedback[]>>(() => loadLocalFeedbacks());

  // Active Quote in Studio
  const [studioQuote, setStudioQuote] = useState<QuoteItem>(() => quotes[0] || INITIAL_CURATED_QUOTES[0]);
  const studioQuoteRef = useRef(studioQuote);
  useEffect(() => { studioQuoteRef.current = studioQuote; }, [studioQuote]);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState('');

  // 6-Hour Trending cycle
  const [trendingTheme, setTrendingTheme] = useState<SixHourTrendingTheme>(() => getCurrentSixHourTheme());
  const [countdownString, setCountdownString] = useState<string>('05h 59m');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<QuoteCategory>('all');

  // Modals state
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isAffirmationModalOpen, setIsAffirmationModalOpen] = useState(false);
  const [activeFeedbackQuote, setActiveFeedbackQuote] = useState<QuoteItem | null>(null);

  const themeConfig: ThemeConfig = THEME_CONFIGS[preferences.themeColor] || THEME_CONFIGS['lavender-pop'];
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  // 1. Sync Dark Mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // 2. Listen to Network Online/Offline events
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); void cloudRef.current?.sync(); };
    const handleOffline = () => { setIsOnline(false); setIsCloudSynced(false); void cloudRef.current?.sync(); };
    const handleFocus = () => { void cloudRef.current?.sync(); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // 3. Listen to Firebase Auth state
  useEffect(() => {
    let disposed = false;
    let unsubscribe = () => {};
    void getFirebaseClient().then(({ auth, db, onAuthStateChanged }) => {
      if (disposed) return;
      unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setAuthReady(true);
      cloudRef.current?.stop();
      cloudRef.current = null;
      hasHydratedRef.current = false;
      const userId = currentUser?.uid || null;
      scopeRef.current = userId;
      setUser(currentUser);
      const deviceProfile = loadLocalProfile(userId, currentUser?.displayName?.trim().slice(0, 100) || 'Scriber Muse');
      const deviceBox = loadManifestationState(userId);
      cacheErrorsRef.current = { profile: deviceProfile.error, box: deviceBox.error };
      setLocalProfile(deviceProfile);
      setManifestation(deviceBox);
      manifestationRef.current = deviceBox;
      const devicePreferences = loadLocalPreferences(userId);
      setPreferences(devicePreferences);
      setDarkMode(devicePreferences.darkMode);
      const deviceQuotes = loadLocalQuotes(userId);
      setQuotes(deviceQuotes);
      setStudioQuote(deviceQuotes[0] || INITIAL_CURATED_QUOTES[0]);
      studioQuoteRef.current = deviceQuotes[0] || INITIAL_CURATED_QUOTES[0];
      setSavedIds(loadSavedQuoteIds(userId));
      setLikedIds(loadLikedQuoteIds(userId));
      setFeedbacks(loadLocalFeedbacks(userId));
      privateQuoteIdsRef.current = new Set();
      setGenerationError('');
      setActiveFeedbackQuote(null);
      setIsThemeModalOpen(false);
      setIsAffirmationModalOpen(false);
      setImportNotice('');
      setIsCloudSynced(false);
      setSyncStatus({ state: 'pending', pending: 0, error: '' });
      setCloudSyncError('');
      setAccountError('');
      if (currentUser) {
        let migratedLegacyProfile = false;
        try {
          const adapter = () => import('./lib/firebaseCloud').then(({ createFirebaseCloud }) => createFirebaseCloud(currentUser, deviceProfile.profile, { auth, db }));
          const sync = new CloudSync({
            userId: currentUser.uid, adapter: {
              load: async () => (await adapter()).load(),
              apply: async (mutation) => (await adapter()).apply(mutation),
            }, storage: localStorage,
            isOnline: () => navigator.onLine, isCurrentUser: () => scopeRef.current === currentUser.uid && auth.currentUser?.uid === currentUser.uid,
            onStatus: (status) => { setSyncStatus(status); setIsCloudSynced(status.state === 'synced'); setCloudSyncError(status.error); },
            onHydrate: (snapshot) => {
              hasHydratedRef.current = true;
              if (snapshot.profileIsLegacy && !migratedLegacyProfile) {
                migratedLegacyProfile = true;
                sync.enqueue({ kind: 'profile', profile: snapshot.profile, preferences: snapshot.preferences });
              }
              setLocalProfile({ profile: snapshot.profile, error: cacheErrorsRef.current.profile });
              setPreferences(snapshot.preferences);
              setDarkMode(snapshot.preferences.darkMode);
              privateQuoteIdsRef.current = new Set(snapshot.quotes.map((quote) => quote.id));
              const merged = new Map<string, QuoteItem>();
              [...INITIAL_CURATED_QUOTES, ...publicQuotesRef.current, ...snapshot.quotes].forEach((quote) => merged.set(quote.id, quote));
              const accountQuotes = [...merged.values()];
              setQuotes(accountQuotes);
              setSavedIds(snapshot.savedIds);
              const box = { ...snapshot.box, error: cacheErrorsRef.current.box };
              manifestationRef.current = box;
              setManifestation(box);
              try {
                if (!cacheErrorsRef.current.profile) saveLocalProfile(currentUser.uid, snapshot.profile);
                if (!cacheErrorsRef.current.box) saveManifestationState(currentUser.uid, snapshot.box);
                saveLocalPreferences(snapshot.preferences, currentUser.uid);
                saveLocalQuotes(accountQuotes, currentUser.uid);
                saveSavedQuoteIds(snapshot.savedIds, currentUser.uid);
              } catch (error) {
                console.error('Private cache save failed', { name: error instanceof Error ? error.name : 'Unknown error' });
                setAccountError('Your cloud data loaded, but this device could not keep an offline copy. Check available storage.');
              }
            },
          });
          cloudRef.current = sync;
          void sync.sync();
        } catch (error) {
          console.error('Private sync could not start', { name: error instanceof Error ? error.name : 'Unknown error' });
          const message = 'Your pending-sync data could not be read. Existing device data is preserved; cloud syncing is paused.';
          setSyncStatus({ state: 'error', pending: 0, error: message });
          setCloudSyncError(message);
        }
      }
      });
    }).catch((error) => {
      console.error('Account services could not load', { name: error instanceof Error ? error.name : 'Unknown error' });
      setAuthReady(true);
      setAccountError('Account services could not load. Your device data is unchanged; check your connection and reload to restore cloud access.');
    });
    return () => { disposed = true; unsubscribe(); cloudRef.current?.stop(); };
  }, []);

  // 4. Firestore real-time sync for public quotes & saved quotes
  useEffect(() => {
    if (!isOnline) return;
    let disposed = false;
    let unsubscribe = () => {};
    void Promise.all([getFirebaseClient(), import('firebase/firestore')]).then(([{ db }, firestore]) => {
    if (disposed) return;
    const { collection, query, orderBy, limit, onSnapshot } = firestore;
    try {
      const quotesCol = collection(db, 'public_quotes');
      const q = query(quotesCol, orderBy('createdAt', 'desc'), limit(50));
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const cloudQuotes: QuoteItem[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            cloudQuotes.push({
              id: docSnap.id,
              text: data.text,
              authorName: data.authorName,
              category: data.category,
              visualStyle: data.visualStyle,
              fontFamily: data.fontFamily,
              backgroundStyle: data.backgroundStyle,
              accentColor: data.accentColor,
              likesCount: data.likesCount || 0,
              userId: data.userId,
              createdAt: data.createdAt || new Date().toISOString(),
              highlightWords: data.highlightWords || [],
              vibeBadge: data.vibeBadge || '',
              ...(typeof data.notes === 'string' ? { notes: data.notes } : {}),
            });
            publicQuotesRef.current = cloudQuotes;
            publicQuoteIdsRef.current = new Set(cloudQuotes.map((quote) => quote.id));
          });

          // Merge cloud quotes with curated initial quotes
          setQuotes((prev) => {
            const map = new Map<string, QuoteItem>();
            INITIAL_CURATED_QUOTES.forEach((cq) => map.set(cq.id, cq));
            prev.forEach((pq) => map.set(pq.id, pq));
            cloudQuotes.forEach((cq) => { if (!privateQuoteIdsRef.current.has(cq.id)) map.set(cq.id, cq); });
            const merged = Array.from(map.values());
            saveDeviceCopy(() => saveLocalQuotes(merged, scopeRef.current));
            return merged;
          });
        }
      }, (error) => {
        console.warn('Firestore snapshot listener paused, using offline cache', error);
      });

    } catch (e) {
      console.warn('Error setting up Firestore listener', e);
    }
    }).catch((error) => {
      console.warn('Community services could not load; device quotes remain available', { name: error instanceof Error ? error.name : 'Unknown error' });
    });
    return () => { disposed = true; unsubscribe(); };
  }, [isOnline]);

  // 5. 6-Hour Cycle Timer updater
  useEffect(() => {
    const updateCycle = () => {
      const currentTheme = getCurrentSixHourTheme();
      setTrendingTheme(currentTheme);

      const now = Date.now();
      const diff = Math.max(0, currentTheme.expiresAt - now);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      setCountdownString(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
    };

    updateCycle();
    const interval = setInterval(updateCycle, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update user preferences
  const saveDeviceCopy = (write: () => void) => {
    try {
      write();
      return true;
    } catch (error) {
      console.error('Device save failed', { name: error instanceof Error ? error.name : 'Unknown error' });
      setAccountError('This device could not save your latest changes. Keep this page open, free up storage, and retry; download important writing before leaving.');
      return false;
    }
  };
  const queueMutations = (mutations: CloudMutation[]) => {
    if (!scopeRef.current) return;
    try {
      if (!cloudRef.current) throw new Error('Cloud sync is not ready. Your device copy is retained; retry syncing before leaving.');
      cloudRef.current.enqueueBatch(mutations);
    } catch (error) {
      console.error('Could not queue private changes', { name: error instanceof Error ? error.name : 'Unknown error' });
      const message = error instanceof Error ? error.message : 'Cloud changes could not be queued. Keep this page open, check storage, and retry.';
      setIsCloudSynced(false);
      setSyncStatus((previous) => ({ ...previous, state: 'error', error: message }));
      setCloudSyncError(message);
      throw error;
    }
  };
  const queueMutation = (mutation: CloudMutation) => queueMutations([mutation]);
  const handleUpdatePreferences = (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    saveDeviceCopy(() => saveLocalPreferences(updated, scopeRef.current));
    try { queueMutation({ kind: 'profile', preferences: newPrefs }); } catch { /* The sync error is displayed in the settings sheet. */ }
    if (newPrefs.fontChoice !== undefined) {
      const fontFamily = newPrefs.fontChoice;
      setStudioQuote((previous) => ({ ...previous, fontFamily }));
    }
    if (newPrefs.darkMode !== undefined) {
      setDarkMode(newPrefs.darkMode);
    }
  };

  const handleToggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    handleUpdatePreferences({ darkMode: newMode });
  };

  // Request browser notification permission for daily affirmation
  const handleRequestNotificationPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        handleUpdatePreferences({ dailyNotificationEnabled: true });
        // Send welcoming test affirmation
        new Notification('Scriber Daily Affirmation Activated', {
          body: 'Your dreams deserve attention. Take one small, kind step toward what matters to you today.',
          icon: '/pwa-192x192.png',
        });
      } else {
        alert('Notifications were blocked in your browser settings.');
      }
    } else {
      alert('Your browser does not support web notifications.');
    }
  };

  // Sign In / Sign Out
  const handleSignIn = async () => {
    setAccountBusy(true);
    setAccountError('');
    try {
      const { auth, signInWithPopup, googleProvider } = await getFirebaseClient();
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (err) {
      const code = typeof err === 'object' && err !== null && 'code' in err ? err.code : '';
      console.warn('Google sign-in failed', { code: typeof code === 'string' ? code : 'unknown' });
      const messages: Record<string, string> = {
        'auth/popup-closed-by-user': 'Google sign-in did not finish in this browser. Try again, or open Scriber directly in Chrome or Edge. Your local profile is unchanged.',
        'auth/cancelled-popup-request': 'Another sign-in window was opened. Please finish sign-in there or try again.',
        'auth/popup-blocked': 'This browser blocked Google sign-in. Allow pop-ups for Scriber, or open Scriber directly in Chrome or Edge. Your local profile is unchanged.',
        'auth/web-storage-unsupported': 'This browser cannot keep a Google sign-in session. Enable cookies and site storage, or use Chrome or Edge. Your local profile is unchanged.',
        'auth/network-request-failed': 'Google sign-in could not connect. Check your internet connection and try again.',
        'auth/unauthorized-domain': 'Google sign-in is not configured for this domain. The site owner must enable it in Firebase.',
        'auth/operation-not-allowed': 'Google sign-in is not enabled in Firebase yet.',
      };
      setAccountError(typeof code === 'string' && messages[code] ? messages[code] : 'Google sign-in failed. Please try again. Your local profile is unchanged.');
      return false;
    } finally {
      setAccountBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAccountBusy(true);
    setAccountError('');
    try {
      const { auth, signOut } = await getFirebaseClient();
      await signOut(auth);
      return true;
    } catch (err) {
      console.warn('Sign out error', err);
      setAccountError('Sign-out failed. You are still signed in. Please try again.');
      return false;
    } finally {
      setAccountBusy(false);
    }
  };

  // Toggle Save / Bookmark
  const handleToggleSave = async (quote: QuoteItem) => {
    const isCurrentlySaved = savedIds.includes(quote.id);
    let nextSaved: string[];

    if (isCurrentlySaved) {
      nextSaved = savedIds.filter((id) => id !== quote.id);
    } else {
      nextSaved = [...savedIds, quote.id];
      privateQuoteIdsRef.current.add(quote.id);
    }

    setSavedIds(nextSaved);
    saveDeviceCopy(() => saveSavedQuoteIds(nextSaved, scopeRef.current));
    try { queueMutation({ kind: 'saved', id: quote.id, value: isCurrentlySaved ? null : quote }); } catch { /* Device bookmarks remain available and the sync error is visible. */ }
  };

  // Toggle Like
  const handleToggleLike = async (quote: QuoteItem) => {
    const isLiked = likedIds.includes(quote.id);
    const nextLiked = isLiked ? likedIds.filter((id) => id !== quote.id) : [...likedIds, quote.id];
    setLikedIds(nextLiked);
    saveDeviceCopy(() => saveLikedQuoteIds(nextLiked, scopeRef.current));

    const delta = isLiked ? -1 : 1;
    setQuotes((prev) =>
      prev.map((q) => (q.id === quote.id ? { ...q, likesCount: Math.max(0, q.likesCount + delta) } : q))
    );

    if (isOnline && user && publicQuoteIdsRef.current.has(quote.id)) {
      try {
        const [{ db }, { doc, updateDoc, increment }] = await Promise.all([getFirebaseClient(), import('firebase/firestore')]);
        if (scopeRef.current !== user.uid) throw new Error('Your account changed while saving this like.');
        const quoteDocRef = doc(db, 'public_quotes', quote.id);
        await updateDoc(quoteDocRef, {
          likesCount: increment(delta),
        });
      } catch (err) {
        console.warn('Community like sync failed', err);
        setAccountError('Your like was kept on this device, but could not sync to the community.');
      }
    }
  };

  const handleBoxChange = (box: ManifestationState, owner: string | null) => {
      if (scopeRef.current !== owner) {
        setAccountError('Your account changed while writing. The previous draft was not applied to this account.');
        return false;
      }
      const previous = manifestationRef.current;
      const current = { ...box, error: '' };
      manifestationRef.current = current;
      setManifestation(current);
      try {
        const mutations: CloudMutation[] = [];
        if (previous.draft !== box.draft) mutations.push({ kind: 'draft', value: box.draft });
        const oldEntries = new Map(previous.entries.map((entry) => [entry.id, entry]));
        const newEntries = new Set(box.entries.map((entry) => entry.id));
        box.entries.forEach((entry) => {
          if (JSON.stringify(oldEntries.get(entry.id)) !== JSON.stringify(entry)) mutations.push({ kind: 'manifestation', id: entry.id, value: entry });
        });
        previous.entries.forEach((entry) => {
          if (!newEntries.has(entry.id)) mutations.push({ kind: 'manifestation', id: entry.id, value: null });
        });
        queueMutations(mutations);
        saveManifestationState(owner, box);
        cacheErrorsRef.current.box = '';
        return true;
      } catch (error) {
        console.error('Manifestation persistence failed', { name: error instanceof Error ? error.name : 'Unknown error' });
        setManifestation({ ...box, error: 'Your writing could not be fully saved or queued. Download it before leaving, check device storage, and retry.' });
        return false;
      }
    };

    const handleImportGuest = () => {
      if (!user || scopeRef.current !== user.uid) {
        setAccountError('Sign in before importing guest writing.');
        return;
      }
      if (!hasHydratedRef.current) {
        setAccountError('Wait for your account to sync before importing, so existing account writing is protected.');
        return;
      }
      if (!window.confirm('Import guest saved quotes and manifestations into this account? Only import writing that belongs to you. Originals stay on this device. Your account draft is replaced only if it is empty.')) return;
      try {
        const guestBox = loadManifestationState(null);
        if (guestBox.error) throw new Error(guestBox.error);
        const guestIds = loadSavedQuoteIds(null, true);
        if (!Array.isArray(guestIds) || !guestIds.every((id) => typeof id === 'string')) throw new Error('The guest bookmark list is invalid.');
        const guestQuotes = new Map([...INITIAL_CURATED_QUOTES, ...publicQuotesRef.current, ...loadLocalQuotes(null)].map((quote) => [quote.id, quote]));
        const importedQuotes = guestIds.map((id) => {
          const quote = guestQuotes.get(id);
          if (!quote) throw new Error('A guest bookmark has no saved quote text. Restore or remove it before importing.');
          return quote;
        });
        const existing = manifestationRef.current;
        const emptyDraft = ![existing.draft.intention, existing.draft.text, existing.draft.feeling, existing.draft.action].some((text) => text.trim());
        const combinedEntries = new Map(guestBox.entries.map((entry) => [entry.id, entry]));
        existing.entries.forEach((entry) => combinedEntries.set(entry.id, entry));
        const guestMutations: CloudMutation[] = [
          { kind: 'draft', value: emptyDraft ? guestBox.draft : existing.draft },
          ...[...combinedEntries.values()].map((value): CloudMutation => ({ kind: 'manifestation', id: value.id, value })),
          ...importedQuotes.map((value): CloudMutation => ({ kind: 'saved', id: value.id, value })),
        ];
        guestMutations.forEach(validateMutation);
        if (!handleBoxChange({ draft: emptyDraft ? guestBox.draft : existing.draft, entries: [...combinedEntries.values()] }, user.uid)) {
          throw new Error('The guest import could not be fully saved or queued. Originals are unchanged; check storage and retry.');
        }
        importedQuotes.forEach((quote) => queueMutation({ kind: 'saved', id: quote.id, value: quote }));
        const ids = [...new Set([...savedIds, ...guestIds])];
        setSavedIds(ids);
        saveSavedQuoteIds(ids, user.uid);
        setQuotes((previous) => {
          const combined = new Map<string, QuoteItem>(previous.map((quote: QuoteItem) => [quote.id, quote]));
          importedQuotes.forEach((quote) => { if (!combined.has(quote.id)) combined.set(quote.id, quote); });
          const result = [...combined.values()];
          saveDeviceCopy(() => saveLocalQuotes(result, user.uid));
          return result;
        });
        setImportNotice('Guest writing and saved quotes imported into this account. Originals are unchanged; private cloud sync is queued.');
      } catch (error) {
        console.error('Guest import could not finish', { name: error instanceof Error ? error.name : 'Unknown error' });
        setAccountError(error instanceof Error ? error.message : 'The import could not finish. Guest originals are unchanged; you can retry.');
      }
    };

  // Submit Feedback / Reflection
  const handleSubmitFeedback = async (quoteId: string, comment: string) => {
    const newFeedback: QuoteFeedback = {
      id: `fb-${Date.now()}`,
      quoteId,
      userId: user?.uid || 'guest-soul',
      userName: user?.displayName || 'Sanctuary Friend',
      comment,
      createdAt: new Date().toISOString(),
    };
    const nextFeedbacks = {
      ...feedbacks,
      [quoteId]: [newFeedback, ...(feedbacks[quoteId] || [])],
    };
    setFeedbacks(nextFeedbacks);
    saveDeviceCopy(() => saveLocalFeedbacks(nextFeedbacks, scopeRef.current));

    if (isOnline && user && publicQuoteIdsRef.current.has(quoteId)) {
      try {
        const [{ db }, { doc, setDoc }] = await Promise.all([getFirebaseClient(), import('firebase/firestore')]);
        if (scopeRef.current !== user.uid) throw new Error('Your account changed while sharing this reflection.');
        await setDoc(doc(db, 'public_quotes', quoteId, 'feedbacks', newFeedback.id), newFeedback);
      } catch (e) {
        console.warn('Could not sync feedback to cloud', e);
        setAccountError('Your reflection was kept on this device, but could not sync to the community.');
      }
    }
  };

  // AI Quote Generation (calls server-side /api/generate-quote)
  const handleGenerateQuoteAI = async (params: {
    userInput?: string;
    category: QuoteCategory;
    aestheticStyle?: AestheticStyle;
  }) => {
    const originalQuote = studioQuoteRef.current;
    const requestScope = scopeRef.current;
    setIsGeneratingQuote(true);
    setGenerationError('');
    try {
      const generated = await generateQuote({
        userInput: params.userInput || '',
        category: params.category,
        aestheticStyle: params.aestheticStyle || 'earthy-minimal',
        authorName: user ? localProfile.profile.displayName : undefined,
      });
      if (scopeRef.current !== requestScope || studioQuoteRef.current !== originalQuote) {
        throw new Error('Your quote changed while AI was writing. The response was not applied so your edits are preserved. Please try again.');
      }
      const { stylingNotes, ...quoteDetails } = generated;
      const newQuote: QuoteItem = {
        ...quoteDetails,
        notes: stylingNotes,
        id: `quote-${crypto.randomUUID()}`,
        likesCount: 0,
        createdAt: new Date().toISOString(),
      };

      setStudioQuote(newQuote);
      setQuotes((prev) => [newQuote, ...prev]);
      saveDeviceCopy(() => saveLocalQuotes([newQuote, ...quotes], scopeRef.current));
      privateQuoteIdsRef.current.add(newQuote.id);
      try { queueMutation({ kind: 'quote', id: newQuote.id, value: newQuote }); } catch { /* The generated quote is retained locally and the sync error is visible. */ }
      return true;
    } catch (err) {
      console.error('Quote generation failed', { message: err instanceof Error ? err.message : 'Unknown error' });
      setGenerationError(err instanceof Error ? err.message : 'Quote generation failed. Please try again.');
      return false;
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  // Apply 6-Hour Trending theme to studio
  const handleApplyTrendingTheme = (theme: SixHourTrendingTheme) => {
    setStudioQuote((prev) => ({
      ...prev,
      fontFamily: theme.fontPairing.heading,
      backgroundStyle: theme.recommendedBackground,
      accentColor: theme.palette.accent,
      visualStyle: theme.themeTitle,
      vibeBadge: theme.styleTag,
    }));
    setActiveTab('studio');
  };

  // Quick generate with 6-Hour Trending theme
  const handleQuickGenerateWithTrending = async (theme: SixHourTrendingTheme) => {
    setActiveTab('studio');
    await handleGenerateQuoteAI({
      userInput: theme.inspirationalSeed,
      category: 'creative-flow',
      aestheticStyle: 'earthy-minimal',
    });
  };

  // Filtered quotes based on search query and category
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const matchesCategory = selectedCategory === 'all' || q.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const matchesText = q.text.toLowerCase().includes(query);
      const matchesAuthor = q.authorName.toLowerCase().includes(query);
      const matchesBadge = (q.vibeBadge || '').toLowerCase().includes(query);
      const matchesNotes = (q.notes || '').toLowerCase().includes(query);
      return matchesCategory && (matchesText || matchesAuthor || matchesBadge || matchesNotes);
    });
  }, [quotes, selectedCategory, searchQuery]);

  // Saved / Personal collection quotes
  const savedQuotes = useMemo(() => {
    return quotes.filter((q) => savedIds.includes(q.id));
  }, [quotes, savedIds]);

  return (
    <div 
      className="sanctuary-shell min-h-dvh transition-colors duration-200 flex flex-col font-body"
      style={{
        backgroundColor: darkMode ? themeConfig.bgDark : themeConfig.bgLight,
        color: darkMode ? themeConfig.textDark : themeConfig.textLight,
        paddingBottom: 'calc(88px + env(safe-area-inset-bottom))',
      }}
    >
      {/* PWA Install Banner */}
      <PwaInstallBanner themeConfig={themeConfig} darkMode={darkMode} />
      {usingFirebaseEmulators && <p role="status" className="px-4 py-2 text-xs bg-amber-100 text-amber-950 text-center">Local Firebase emulators: demo accounts and data only, not production cloud.</p>}

      {/* Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        isOnline={isOnline}
        isCloudSynced={isCloudSynced}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenAffirmationModal={() => setIsAffirmationModalOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        themeConfig={themeConfig}
        trendingCountdown={countdownString}
        savedCount={savedIds.length}
        accountBusy={accountBusy || !authReady}
      />

      {/* Main Content Area */}
      <main aria-labelledby={`nav-tab-${activeTab}`} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {user && <p role="status" aria-live="polite" className="mb-4 text-xs text-stone-600 dark:text-stone-300">{syncLabel}</p>}
        {importNotice && <p role="status" className="mb-4 text-sm">{importNotice}</p>}
        {localProfile.error && <p role="alert" className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{localProfile.error}</p>}
        {(accountError || cloudSyncError) && activeTab !== 'profile' && <p role="alert" className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{accountError || cloudSyncError}</p>}
        <Suspense fallback={<p role="status" className="p-6 text-sm">Opening your sanctuary...</p>}>
        {activeTab === 'profile' && <ProfileTab key={user?.uid || 'guest'} user={user} profile={localProfile.profile}
          onProfileSaved={(profile) => {
            if (scopeRef.current !== (user?.uid || null)) throw new Error('Your account changed. Please save in the current account.');
            cacheErrorsRef.current.profile = '';
            setLocalProfile({ profile, error: '' });
            queueMutation({ kind: 'profile', profile });
          }}
          syncLabel={syncLabel} onSync={() => { void cloudRef.current?.sync(); }} onImportGuest={handleImportGuest}
          accountError={accountError || cloudSyncError} accountBusy={accountBusy || !authReady} onSignIn={handleSignIn} onSignOut={handleSignOut}
          preferences={preferences} themeConfig={themeConfig} darkMode={darkMode} onToggleDarkMode={handleToggleDarkMode}
          onOpenThemeSettings={() => setIsThemeModalOpen(true)} onOpenAffirmationSettings={() => setIsAffirmationModalOpen(true)}
          onNavigate={setActiveTab} savedCount={savedIds.length} likedCount={likedIds.length} />}
        {activeTab === 'manifest' && <ManifestationBox key={user?.uid || 'guest'} themeConfig={themeConfig} darkMode={darkMode}
          box={manifestation} onChangeBox={(box) => handleBoxChange(box, user?.uid || null)} persistenceError={manifestation.error || cloudSyncError} syncLabel={syncLabel} />}
        
        {/* TAB 1: STUDIO */}
        {activeTab === 'studio' && (
          <div className="space-y-8 animate-fade-in">
            <WelcomeCard displayName={localProfile.profile.displayName} themeConfig={themeConfig} darkMode={darkMode} onNavigate={setActiveTab} />
            {/* 6-Hour Trending Banner */}
            <SixHourTrendingBanner
              theme={trendingTheme}
              countdown={countdownString}
              onApplyTheme={handleApplyTrendingTheme}
              onQuickGenerateWithTheme={handleQuickGenerateWithTrending}
              themeConfig={themeConfig}
              darkMode={darkMode}
            />

            {/* Interactive Studio Workspace */}
            <Suspense fallback={<p role="status" className="p-6 text-sm">Opening your quote studio...</p>}>
            <QuoteStudio
              currentQuote={studioQuote}
              onChangeQuote={setStudioQuote}
              onGenerateAI={handleGenerateQuoteAI}
              isGenerating={isGeneratingQuote}
              generationError={generationError}
              onSaveToPersonalCollection={handleToggleSave}
              isSaved={savedIds.includes(studioQuote.id)}
              themeConfig={themeConfig}
              darkMode={darkMode}
            />
            </Suspense>
          </div>
        )}

        {/* TAB 2: SANCTUARY */}
        {activeTab === 'explore' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* 6-Hour Trending Banner */}
            <SixHourTrendingBanner
              theme={trendingTheme}
              countdown={countdownString}
              onApplyTheme={handleApplyTrendingTheme}
              onQuickGenerateWithTheme={handleQuickGenerateWithTrending}
              themeConfig={themeConfig}
              darkMode={darkMode}
            />

            {/* Header & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                  Inspiration Sanctuary
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                  A place for every feeling: love, growth, courage, joy, and all the chapters in between.
                </p>
              </div>

              {/* Search input to locate past entries quickly */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search quotes, feelings, authors..."
                  aria-label="Search sanctuary quotes"
                  className="w-full pl-9 pr-4 py-2 rounded-full border text-xs sm:text-sm bg-white dark:bg-stone-900/60 focus:outline-hidden focus:ring-2"
                  style={{
                    borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
                    color: darkMode ? themeConfig.textDark : themeConfig.textLight,
                  }}
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {[{ id: 'all' as const, label: 'All Inspirations' }, ...QUOTE_CATEGORIES].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as QuoteCategory)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'text-white shadow-xs font-semibold'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                  }`}
                  style={selectedCategory === cat.id ? { backgroundColor: themeConfig.primary } : {}}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Quotes Grid */}
            {filteredQuotes.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700">
                <p className="text-stone-500 dark:text-stone-400 font-display text-lg mb-2">
                  No quotes found for your search.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="text-xs font-semibold underline"
                  style={{ color: themeConfig.primary }}
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuotes.map((quote) => (
                  <QuoteCard
                    key={quote.id}
                    quote={quote}
                    isSaved={savedIds.includes(quote.id)}
                    isLiked={likedIds.includes(quote.id)}
                    onToggleSave={handleToggleSave}
                    onToggleLike={handleToggleLike}
                    onOpenFeedback={(q) => setActiveFeedbackQuote(q)}
                    onSelectForStudio={(q) => {
                      setStudioQuote(q);
                      setActiveTab('studio');
                    }}
                    feedbackCount={(feedbacks[quote.id] || []).length}
                    themeConfig={themeConfig}
                    darkMode={darkMode}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB 3: FAVORITES (Personal Collection) */}
        {activeTab === 'favorites' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                  Your Personal Collection
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                  {savedQuotes.length} saved pieces of wisdom and typography designs (offline-ready & cloud-synced)
                </p>
              </div>

              <button
                onClick={() => setActiveTab('studio')}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white shadow-xs self-start sm:self-auto"
                style={{ backgroundColor: themeConfig.primary }}
              >
                <Plus className="w-4 h-4" />
                <span>Create New Quote</span>
              </button>
            </div>

            {savedQuotes.length === 0 ? (
              <div className="text-center py-20 rounded-3xl border border-dashed border-stone-300 dark:border-stone-700 max-w-md mx-auto p-6">
                <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-700" />
                <h3 className="font-display text-xl font-bold mb-1">
                  Your Sanctuary is Empty
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
                  Save the words that move you, your favorite affirmations, and custom typography cards from the Studio or Sanctuary.
                </p>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: themeConfig.primary }}
                >
                  Explore the Sanctuary
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedQuotes.map((quote) => (
                  <QuoteCard
                    key={quote.id}
                    quote={quote}
                    isSaved={true}
                    isLiked={likedIds.includes(quote.id)}
                    onToggleSave={handleToggleSave}
                    onToggleLike={handleToggleLike}
                    onOpenFeedback={(q) => setActiveFeedbackQuote(q)}
                    onDeleteFromSaved={() => { void handleToggleSave(quote); }}
                    onSelectForStudio={(q) => {
                      setStudioQuote(q);
                      setActiveTab('studio');
                    }}
                    feedbackCount={(feedbacks[quote.id] || []).length}
                    themeConfig={themeConfig}
                    darkMode={darkMode}
                    showDelete={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DAILY AFFIRMATIONS */}
        {activeTab === 'affirmations' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center max-w-xl mx-auto">
              <span 
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-2"
                style={{
                  backgroundColor: themeConfig.accentBg,
                  color: themeConfig.primary,
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                A Moment for You
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                Sacred Daily Affirmations
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                A gentle reset for your day. Find words for your confidence, your connections, and your next chapter.
              </p>
            </div>

            {/* Affirmations Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {DAILY_AFFIRMATIONS_BANK.map((item) => (
                <div
                  key={item.id}
                  className="p-6 rounded-2xl border shadow-xs flex flex-col justify-between"
                  style={{
                    backgroundColor: darkMode ? themeConfig.cardDark : themeConfig.cardLight,
                    borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
                  }}
                >
                  <div>
                    <span 
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border inline-block mb-3"
                      style={{
                        borderColor: themeConfig.primary,
                        color: themeConfig.primary,
                      }}
                    >
                      {item.focus}
                    </span>
                    <p className="font-display text-lg sm:text-xl leading-relaxed italic text-stone-900 dark:text-stone-100">
                      “{item.text}”
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t flex items-center justify-between"
                    style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}
                  >
                    <button
                      onClick={() => {
                        setStudioQuote({
                          id: `quote-${Date.now()}`,
                          text: item.text,
                          authorName: "Daily Affirmation",
                          category: "daily-affirmation",
                          visualStyle: item.focus,
                          fontFamily: "fraunces",
                          backgroundStyle: "aurora-bloom",
                          accentColor: "#6940b5",
                          likesCount: 1,
                          highlightWords: ["peace", "possibility"],
                          vibeBadge: item.focus,
                          createdAt: new Date().toISOString(),
                        });
                        setActiveTab('studio');
                      }}
                      className="text-xs font-mono font-semibold hover:underline"
                      style={{ color: themeConfig.primary }}
                    >
                      Customize in Studio →
                    </button>

                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(`“${item.text}” — Scriber Daily Affirmation`);
                        alert('Affirmation copied to clipboard!');
                      }}
                      className="text-xs font-mono text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Daily Affirmation Reminder Banner */}
            <div 
              className="p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4"
              style={{
                backgroundColor: darkMode ? `${themeConfig.cardDark}` : '#fbf7f0',
                borderColor: darkMode ? themeConfig.borderDark : '#decbb0',
              }}
            >
              <div>
                <h4 className="font-display text-lg font-bold">
                  A Little Morning Inspiration
                </h4>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                  Set your preferred reminder time to {preferences.notificationTime || '9:00 AM'} and enable browser notifications for daily inspiration.
                </p>
              </div>

              <button
                onClick={handleRequestNotificationPermission}
                className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white shadow-xs transition-transform hover:scale-[1.02] flex-shrink-0"
                style={{ backgroundColor: themeConfig.primary }}
              >
                {preferences.dailyNotificationEnabled ? 'Notifications Active ✓' : 'Enable Daily Push'}
              </button>
            </div>

          </div>
        )}

        </Suspense>
      </main>

      {/* Footer */}
      <footer 
        className="mt-12 py-8 border-t text-center text-xs text-stone-500 dark:text-stone-400"
        style={{
          borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
          backgroundColor: darkMode ? `${themeConfig.bgDark}80` : `${themeConfig.bgLight}80`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm tracking-tight text-stone-800 dark:text-stone-200">
              Scriber
            </span>
            <span>• Inspiration sanctuary. Words to keep. Dreams to grow.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>PWA Offline-First</span>
            <span>•</span>
            <span>{isCloudSynced ? 'Cloud Connected' : 'Local Mode'}</span>
            <span>•</span>
            <span>6-Hour Cycles</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <Suspense fallback={<p role="status" className="fixed bottom-24 inset-x-4 rounded-xl p-3 bg-white text-stone-900 border z-50">Opening settings...</p>}>
      {isThemeModalOpen && <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        themeConfig={themeConfig}
        darkMode={darkMode}
        onRequestNotificationPermission={handleRequestNotificationPermission}
        persistenceError={accountError || cloudSyncError}
      />}

      {isAffirmationModalOpen && <DailyAffirmationModal
        isOpen={isAffirmationModalOpen}
        onClose={() => setIsAffirmationModalOpen(false)}
        onRequestNotificationPermission={handleRequestNotificationPermission}
        notificationsEnabled={preferences.dailyNotificationEnabled}
        themeConfig={themeConfig}
        darkMode={darkMode}
      />}

      {activeFeedbackQuote && <FeedbackModal
        quote={activeFeedbackQuote}
        isOpen={!!activeFeedbackQuote}
        onClose={() => setActiveFeedbackQuote(null)}
        feedbacks={activeFeedbackQuote ? (feedbacks[activeFeedbackQuote.id] || []) : []}
        onSubmitFeedback={handleSubmitFeedback}
        userName={user?.displayName || 'Kind Soul'}
        themeConfig={themeConfig}
        darkMode={darkMode}
      />}
      </Suspense>

    </div>
  );
}
