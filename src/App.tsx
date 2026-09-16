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
import { QuoteItem, QuoteCategory, QuoteFeedback, SixHourTrendingTheme } from './types/quote';
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

export default function App() {
  // Navigation tabs: 'studio' | 'explore' | 'favorites' | 'affirmations'
  const [activeTab, setActiveTab] = useState<'studio' | 'explore' | 'favorites' | 'affirmations'>('studio');

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

  const themeConfig: ThemeConfig = THEME_CONFIGS[preferences.themeColor] || THEME_CONFIGS['earthy-sage'];

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
        new Notification('Scriber Daily Affirmation Activated 👑', {
          body: 'Your crown is an archive of strength and divine patience. Walk in quiet royalty today.',
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
      userName: user?.displayName || 'Locs & Soul Friend',
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
    aestheticStyle?: any;
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
        visualStyle: generated.visualStyle || 'Locs Sanctuary',
        fontFamily: generated.fontFamily || 'fraunces',
        backgroundStyle: generated.backgroundStyle || 'locs-crown-art',
        accentColor: generated.accentColor || '#c98a4b',
        likesCount: 1,
        highlightWords: generated.highlightWords || [],
        vibeBadge: generated.vibeBadge || 'Crown Inspiration',
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
        text: "My dreadlocs are sacred roots grown skyward. I do not ask for permission to let my natural crown flourish.",
        authorName: "Crown Elder",
        category: params.category || 'locs-hair',
        visualStyle: "Crown Elevation",
        fontFamily: "playfair",
        backgroundStyle: "locs-crown-art",
        accentColor: "#c98a4b",
        likesCount: 1,
        highlightWords: ["sacred", "roots", "crown"],
        vibeBadge: "Dreadlocs Pride",
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
      category: 'locs-hair',
      aestheticStyle: theme.cycleId.includes('roots') ? 'reggae-roots' : theme.cycleId.includes('genz') ? 'gen-z' : 'locs-crown',
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
      className="min-h-screen transition-colors duration-200 flex flex-col font-body"
      style={{
        backgroundColor: darkMode ? themeConfig.bgDark : themeConfig.bgLight,
        color: darkMode ? themeConfig.textDark : themeConfig.textLight,
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* TAB 1: STUDIO */}
        {activeTab === 'studio' && (
          <div className="space-y-8 animate-fade-in">
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

        {/* TAB 2: EXPLORE (Locs & Roots Sanctuary) */}
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
                  Locs, Roots & Soul Sanctuary
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                  Curated and community inspirations celebrating crown patience, reggae culture, and relatable gen-z wisdom
                </p>
              </div>

              {/* Search input to locate past entries quickly */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search past quotes, locs, authors..."
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
              {[
                { id: 'all', label: 'All Inspirations' },
                { id: 'locs-hair', label: '👑 Locs & Crown' },
                { id: 'reggae-roots', label: '🌿 Roots Reggae' },
                { id: 'gen-z-motivation', label: '✨ Gen-Z Vibe' },
                { id: 'daily-affirmation', label: '🌸 Affirmations' },
                { id: 'earthy-zen', label: '🍂 Earthy Zen' },
                { id: 'creative-flow', label: '🖋️ Scribe Poetry' },
              ].map((cat) => (
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
                  Save your favorite loc quotes, reggae wisdom, and custom typography cards from the Studio or Explore tabs.
                </p>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: themeConfig.primary }}
                >
                  Explore Locs & Roots Quotes
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
                Crown & Soul Grounding
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                Sacred Daily Affirmations
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Ground yourself in gratitude, celebrate every coil of your locs, and cultivate unshakeable peace.
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
                          backgroundStyle: "locs-crown-art",
                          accentColor: "#c98a4b",
                          likesCount: 1,
                          highlightWords: ["peace", "crown"],
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
                  Never Miss a Morning Crown Affirmation
                </h4>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                  Activate scheduled push notifications to receive loc hair encouragement and soulful vibes every morning at {preferences.notificationTime || '9:00 AM'}.
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
            <span>• Earthy Quote Studio & Loc Hair Inspiration Sanctuary</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>PWA Offline-First</span>
            <span>•</span>
            <span>Cloud Synced</span>
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
