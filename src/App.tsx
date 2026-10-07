import React, { useState, useEffect, useMemo } from 'react';
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
import { 
  auth, 
  db, 
  signInWithPopup, 
  signOut, 
  googleProvider, 
  onAuthStateChanged, 
  User, 
  testFirestoreConnection 
} from './lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  updateDoc, 
  increment 
} from 'firebase/firestore';

import { Navbar } from './components/Navbar';
import { SixHourTrendingBanner } from './components/SixHourTrendingBanner';
import { QuoteStudio } from './components/QuoteStudio';
import { QuoteCard } from './components/QuoteCard';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { FeedbackModal } from './components/FeedbackModal';
import { DailyAffirmationModal } from './components/DailyAffirmationModal';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { ManifestationBox } from './components/ManifestationBox';

export default function App() {
  const [activeTab, setActiveTab] = useState<SanctuaryTab>('studio');

  // Preferences: theme colors, typography, dark mode, notifications
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadLocalPreferences());
  const [darkMode, setDarkMode] = useState<boolean>(() => preferences.darkMode);

  // User auth state
  const [user, setUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Quotes data & interactions
  const [quotes, setQuotes] = useState<QuoteItem[]>(() => loadLocalQuotes());
  const [savedIds, setSavedIds] = useState<string[]>(() => loadSavedQuoteIds());
  const [likedIds, setLikedIds] = useState<string[]>(() => loadLikedQuoteIds());
  const [feedbacks, setFeedbacks] = useState<Record<string, QuoteFeedback[]>>(() => loadLocalFeedbacks());

  // Active Quote in Studio
  const [studioQuote, setStudioQuote] = useState<QuoteItem>(() => quotes[0] || INITIAL_CURATED_QUOTES[0]);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState<boolean>(false);

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
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial Firestore validation check mandated by firebase-skill
    testFirestoreConnection().then((connected) => {
      if (connected) setIsCloudSynced(true);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 3. Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsCloudSynced(true);
        // Sync user profile to Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(userDocRef, {
            uid: currentUser.uid,
            displayName: currentUser.displayName || 'Scriber Muse',
            email: currentUser.email || '',
            themeColor: preferences.themeColor,
            fontChoice: preferences.fontChoice,
            darkMode: preferences.darkMode,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (err) {
          console.warn('Could not sync user profile to cloud', err);
        }
      }
    });
    return () => unsubscribe();
  }, [preferences]);

  // 4. Firestore real-time sync for public quotes & saved quotes
  useEffect(() => {
    if (!isOnline) return;

    try {
      const quotesCol = collection(db, 'public_quotes');
      const q = query(quotesCol, orderBy('createdAt', 'desc'), limit(50));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
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
            });
          });

          // Merge cloud quotes with curated initial quotes
          setQuotes((prev) => {
            const map = new Map<string, QuoteItem>();
            INITIAL_CURATED_QUOTES.forEach((cq) => map.set(cq.id, cq));
            prev.forEach((pq) => map.set(pq.id, pq));
            cloudQuotes.forEach((cq) => map.set(cq.id, cq));
            const merged = Array.from(map.values());
            saveLocalQuotes(merged);
            return merged;
          });
        }
      }, (error) => {
        console.warn('Firestore snapshot listener paused, using offline cache', error);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Error setting up Firestore listener', e);
    }
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
  const handleUpdatePreferences = (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    saveLocalPreferences(updated);
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
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.warn('Google Sign-In dismissed or unavailable, continuing in offline mode', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.warn('Sign out error', err);
    }
  };

  // Toggle Save / Bookmark
  const handleToggleSave = async (quote: QuoteItem) => {
    const isCurrentlySaved = savedIds.includes(quote.id);
    let nextSaved: string[];

    if (isCurrentlySaved) {
      nextSaved = savedIds.filter((id) => id !== quote.id);
      if (user && isOnline) {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'saved_quotes', quote.id));
        } catch (e) {
          console.warn('Cloud delete failed', e);
        }
      }
    } else {
      nextSaved = [...savedIds, quote.id];
      if (user && isOnline) {
        try {
          await setDoc(doc(db, 'users', user.uid, 'saved_quotes', quote.id), {
            ...quote,
            userId: user.uid,
          });
        } catch (e) {
          console.warn('Cloud save failed', e);
        }
      }
    }

    setSavedIds(nextSaved);
    saveSavedQuoteIds(nextSaved);
  };

  // Toggle Like
  const handleToggleLike = async (quote: QuoteItem) => {
    const isLiked = likedIds.includes(quote.id);
    const nextLiked = isLiked ? likedIds.filter((id) => id !== quote.id) : [...likedIds, quote.id];
    setLikedIds(nextLiked);
    saveLikedQuoteIds(nextLiked);

    const delta = isLiked ? -1 : 1;
    setQuotes((prev) =>
      prev.map((q) => (q.id === quote.id ? { ...q, likesCount: Math.max(0, q.likesCount + delta) } : q))
    );

    if (isOnline) {
      try {
        const quoteDocRef = doc(db, 'public_quotes', quote.id);
        await updateDoc(quoteDocRef, {
          likesCount: increment(delta),
        });
      } catch (err) {
        // Document may not exist in Firestore yet if it was local only, set it
        try {
          await setDoc(doc(db, 'public_quotes', quote.id), {
            ...quote,
            likesCount: Math.max(0, quote.likesCount + delta),
          });
        } catch (e) {
          console.warn('Like sync ignored in offline mode', e);
        }
      }
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
    saveLocalFeedbacks(nextFeedbacks);

    if (isOnline && user) {
      try {
        await setDoc(doc(db, 'public_quotes', quoteId, 'feedbacks', newFeedback.id), newFeedback);
      } catch (e) {
        console.warn('Could not sync feedback to cloud', e);
      }
    }
  };

  // AI Quote Generation (calls server-side /api/generate-quote)
  const handleGenerateQuoteAI = async (params: {
    userInput?: string;
    category: QuoteCategory;
    aestheticStyle?: AestheticStyle;
  }) => {
    setIsGeneratingQuote(true);
    try {
      const response = await fetch('/api/generate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: params.userInput,
          category: params.category,
          aestheticStyle: params.aestheticStyle,
          authorName: user?.displayName || undefined,
        }),
      });

      if (!response.ok) throw new Error('API request failed');

      const generated = await response.json();
      const newQuote: QuoteItem = {
        id: `quote-${Date.now()}`,
        text: generated.text,
        authorName: generated.authorName || 'Scriber Muse',
        category: generated.category || params.category,
        visualStyle: generated.visualStyle || 'Inspiration Sanctuary',
        fontFamily: generated.fontFamily || 'fraunces',
        backgroundStyle: generated.backgroundStyle || 'aurora-bloom',
        accentColor: generated.accentColor || '#c98a4b',
        likesCount: 1,
        highlightWords: generated.highlightWords || [],
        vibeBadge: generated.vibeBadge || 'Everyday Inspiration',
        createdAt: new Date().toISOString(),
      };

      setStudioQuote(newQuote);
      setQuotes((prev) => [newQuote, ...prev]);
      saveLocalQuotes([newQuote, ...quotes]);

      // If user is online, also publish to community quotes in Firestore
      if (isOnline && user) {
        try {
          await setDoc(doc(db, 'public_quotes', newQuote.id), {
            ...newQuote,
            userId: user.uid,
          });
        } catch (e) {
          console.warn('Quote saved locally, cloud sync will resume when connection is verified', e);
        }
      }
    } catch (err) {
      console.error('Failed to generate quote via API', err);
      // Fallback locally
      const fallbackQuote: QuoteItem = {
        id: `quote-${Date.now()}`,
        text: "You can begin again with what you have, where you are. A small brave step is still a beautiful beginning.",
        authorName: "Scriber Notes",
        category: params.category || 'growth',
        visualStyle: "Aurora Bloom",
        fontFamily: "playfair",
        backgroundStyle: "aurora-bloom",
        accentColor: "#6940b5",
        likesCount: 1,
        highlightWords: ["brave", "beginning"],
        vibeBadge: "Fresh Possibility",
        createdAt: new Date().toISOString(),
      };
      setStudioQuote(fallbackQuote);
      setQuotes((prev) => [fallbackQuote, ...prev]);
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
      />

      {/* Main Content Area */}
      <main aria-labelledby={`nav-tab-${activeTab}`} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'manifest' && <ManifestationBox themeConfig={themeConfig} darkMode={darkMode} />}
        
        {/* TAB 1: STUDIO */}
        {activeTab === 'studio' && (
          <div className="space-y-8 animate-fade-in">
            <section className="hidden lg:grid md:grid-cols-[1.4fr_1fr] gap-6 items-center py-3 sm:py-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[.2em]" style={{ color: themeConfig.accent }}>Words for every version of you</span>
                <h1 className="font-display text-4xl sm:text-6xl font-bold leading-tight mt-3">A little inspiration.<br /><span style={{ color: themeConfig.primary }}>A world of possibility.</span></h1>
                <p className="text-sm sm:text-base max-w-lg mt-4 text-stone-600 dark:text-stone-300">Quotes to feel, words to keep, and dreams to grow. Make something that feels like you.</p>
                <button onClick={() => setActiveTab('explore')} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4" style={{ color: darkMode ? themeConfig.textDark : themeConfig.primary }}>Find your next favorite quote <Compass size={16} /></button>
              </div>
              <button onClick={() => setActiveTab('manifest')} className="relative overflow-hidden text-left rounded-[2rem] p-7 sm:p-8 border transition-transform hover:-translate-y-1"
                style={{ background: darkMode ? 'linear-gradient(130deg, #302547, #193e3a)' : 'linear-gradient(130deg, #e9dcff, #d6f3e9)', borderColor: darkMode ? '#58436f' : '#d9c9f1' }}>
                <span className="text-xs uppercase font-semibold tracking-widest text-violet-800 dark:text-violet-200">Introducing the manifestation box</span>
                <span className="block font-hand text-4xl sm:text-5xl mt-5 text-violet-950 dark:text-violet-50">What if it all<br />begins with a page?</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-violet-950/60 mt-6 px-4 py-2 text-xs font-semibold text-violet-900 dark:text-violet-100">Plant a possibility <Sparkles size={15} /></span>
              </button>
            </section>
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
            <QuoteStudio
              currentQuote={studioQuote}
              onChangeQuote={setStudioQuote}
              onGenerateAI={handleGenerateQuoteAI}
              isGenerating={isGeneratingQuote}
              onSaveToPersonalCollection={handleToggleSave}
              isSaved={savedIds.includes(studioQuote.id)}
              themeConfig={themeConfig}
              darkMode={darkMode}
            />
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
                    onDeleteFromSaved={(id) => {
                      const next = savedIds.filter((savedId) => savedId !== id);
                      setSavedIds(next);
                      saveSavedQuoteIds(next);
                    }}
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
      <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        themeConfig={themeConfig}
        darkMode={darkMode}
        onRequestNotificationPermission={handleRequestNotificationPermission}
      />

      <DailyAffirmationModal
        isOpen={isAffirmationModalOpen}
        onClose={() => setIsAffirmationModalOpen(false)}
        onRequestNotificationPermission={handleRequestNotificationPermission}
        notificationsEnabled={preferences.dailyNotificationEnabled}
        themeConfig={themeConfig}
        darkMode={darkMode}
      />

      <FeedbackModal
        quote={activeFeedbackQuote}
        isOpen={!!activeFeedbackQuote}
        onClose={() => setActiveFeedbackQuote(null)}
        feedbacks={activeFeedbackQuote ? (feedbacks[activeFeedbackQuote.id] || []) : []}
        onSubmitFeedback={handleSubmitFeedback}
        userName={user?.displayName || 'Kind Soul'}
        themeConfig={themeConfig}
        darkMode={darkMode}
      />

    </div>
  );
}
