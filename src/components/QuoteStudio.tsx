import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Share2, 
  Download, 
  Bookmark, 
  BookmarkCheck, 
  Copy, 
  Check, 
  RefreshCw, 
  Maximize2, 
  Minimize2, 
  Twitter, 
  MessageCircle, 
  Instagram, 
  Eye,
  Type,
  Image as ImageIcon,
  Sliders,
  Heart,
  Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QuoteItem, QuoteCategory, FontChoice, BackgroundStyle, LayoutStyle, QUOTE_CATEGORIES, AestheticStyle } from '../types/quote';
import { ThemeConfig, FONT_CONFIGS, getBackgroundVisual, SANCTUARY_BACKGROUNDS } from '../lib/themeStyles';
import { exportQuoteAsImage } from '../lib/canvasExporter';
import { ResponsiveSheet } from './BottomSheet';

interface QuoteStudioProps {
  currentQuote: QuoteItem;
  onChangeQuote: (updated: QuoteItem) => void;
  onGenerateAI: (params: { userInput?: string; category: QuoteCategory; aestheticStyle?: AestheticStyle }) => Promise<boolean>;
  isGenerating: boolean;
  generationError: string;
  onSaveToPersonalCollection: (quote: QuoteItem) => void;
  isSaved: boolean;
  themeConfig: ThemeConfig;
  darkMode: boolean;
}

export const QuoteStudio: React.FC<QuoteStudioProps> = ({
  currentQuote,
  onChangeQuote,
  onGenerateAI,
  isGenerating,
  generationError,
  onSaveToPersonalCollection,
  isSaved,
  themeConfig,
  darkMode,
}) => {
  const [userInputPrompt, setUserInputPrompt] = useState('');
  const [topicError, setTopicError] = useState('');
  const topicInputRef = useRef<HTMLTextAreaElement>(null);
  const [activeCategory, setActiveCategory] = useState<QuoteCategory>(currentQuote.category || 'self-worth');
  const [activeVibe, setActiveVibe] = useState<AestheticStyle>('earthy-minimal');
  const [isMinimalFocusMode, setIsMinimalFocusMode] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  useEffect(() => { setActiveCategory(currentQuote.category); }, [currentQuote.category]);

  // Background visual styling
  const bgVisual = getBackgroundVisual(currentQuote.backgroundStyle, darkMode);
  const fontStyle = FONT_CONFIGS[currentQuote.fontFamily] || FONT_CONFIGS.fraunces;

  const categories = QUOTE_CATEGORIES;

  const backgrounds: { id: BackgroundStyle; label: string; previewColor: string }[] = [
    ...SANCTUARY_BACKGROUNDS,
    { id: 'gradient-terracotta', label: 'Warm Terracotta', previewColor: '#9e6241' },
    { id: 'gradient-earth', label: 'Earthy Clay Gradient', previewColor: '#7d4926' },
    { id: 'gradient-matcha', label: 'Matcha Cream Gradient', previewColor: '#4e5b31' },
    { id: 'texture-linen', label: 'Soft Linen Paper', previewColor: '#ede6de' },
  ];

  const designPresets = [
    {
      id: 'aurora-bloom',
      name: 'Aurora Bloom',
      category: 'self-worth' as QuoteCategory,
      fontFamily: 'playfair' as FontChoice,
      fontName: 'Playfair Display',
      backgroundStyle: 'aurora-bloom' as BackgroundStyle,
      accentColor: '#6940b5',
      vibeBadge: 'Already Enough',
      desc: 'Expressive serif with dreamy color blooms',
      sampleQuote: 'You do not have to become someone else to begin. You are already worthy of a beautiful life.',
      author: 'Scriber Notes',
    },
    {
      id: 'roots-dub',
      name: 'Peach Picnic',
      category: 'joy' as QuoteCategory,
      fontFamily: 'reggae' as FontChoice,
      fontName: 'Abril Fatface',
      backgroundStyle: 'sunset-checker' as BackgroundStyle,
      accentColor: '#b34c37',
      vibeBadge: 'Everyday Magic',
      desc: 'A playful checkerboard and golden-hour glow',
      sampleQuote: 'Collect the little joys. A good song, a shared laugh, sunlight on the floor. This is your life happening.',
      author: 'Scriber Notes',
    },
    {
      id: 'genz-matcha',
      name: 'Citrus Daydream',
      category: 'gen-z-motivation' as QuoteCategory,
      fontFamily: 'syne' as FontChoice,
      fontName: 'Syne Display',
      backgroundStyle: 'citrus-garden' as BackgroundStyle,
      accentColor: '#6b8265',
      vibeBadge: 'Soft Matcha Era',
      desc: 'Modern type with leafy shapes and citrus suns',
      sampleQuote: 'Entering my quiet era: iced oat matcha, silent notifications, and protecting my sacred peace.',
      author: 'Modern Soul',
    },
    {
      id: 'earthy-editorial',
      name: 'Starlight Diary',
      category: 'dreams' as QuoteCategory,
      fontFamily: 'fraunces' as FontChoice,
      fontName: 'Fraunces Serif',
      backgroundStyle: 'celestial-night' as BackgroundStyle,
      accentColor: '#6940b5',
      vibeBadge: 'Cosmic Calm',
      desc: 'Soft serif, scattered stars, and a crescent moon',
      sampleQuote: 'Quiet patience is not the absence of momentum. It is the steady root gathering strength before the bloom.',
      author: 'Sage Journal',
    },
    {
      id: 'lofi-typewriter',
      name: 'Lo-Fi Typewriter',
      category: 'creative-flow' as QuoteCategory,
      fontFamily: 'mono' as FontChoice,
      fontName: 'Space Mono',
      backgroundStyle: 'gradient-terracotta' as BackgroundStyle,
      accentColor: '#9e6241',
      vibeBadge: 'Minimalist Scribe',
      desc: 'Monospace focus on terracotta gradient',
      sampleQuote: 'Document your evolution. The messy middle is where the true architecture of soul takes form.',
      author: 'The Studio Notebook',
    },
    {
      id: 'handwritten-soul',
      name: 'Handwritten Solitude',
      category: 'daily-affirmation' as QuoteCategory,
      fontFamily: 'hand' as FontChoice,
      fontName: 'Caveat Script',
      backgroundStyle: 'gradient-matcha' as BackgroundStyle,
      accentColor: '#854b4b',
      vibeBadge: 'Intimate Whisper',
      desc: 'Personal script on herbal matcha gradient',
      sampleQuote: 'Breathe in grace, exhale expectations. You are already whole just as you are right now.',
      author: 'Morning Note',
    },
  ];

  const handleApplyPreset = (preset: typeof designPresets[0], replaceText: boolean = false) => {
    onChangeQuote({
      ...currentQuote,
      fontFamily: preset.fontFamily,
      backgroundStyle: preset.backgroundStyle,
      accentColor: preset.accentColor,
      vibeBadge: preset.vibeBadge,
      category: preset.category,
      text: replaceText ? preset.sampleQuote : currentQuote.text,
      authorName: replaceText ? preset.author : currentQuote.authorName,
      highlightWords: replaceText ? [] : currentQuote.highlightWords,
    });
    setActiveCategory(preset.category);
  };

  const handleGenerate = async () => {
    const topic = userInputPrompt.trim();
    if (!topic) {
      setTopicError('Tell us what you want your quote to be about, such as love, hair, or a fresh start.');
      topicInputRef.current?.focus();
      return;
    }
    setTopicError('');
    const succeeded = await onGenerateAI({
      userInput: topic,
      category: activeCategory,
      aestheticStyle: activeVibe,
    });
    if (succeeded) setIsControlsOpen(false);
  };

  const handleSave = () => {
    onSaveToPersonalCollection(currentQuote);
    // Visual celebratory micro-interaction
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#c98a4b', '#4e5b31', '#d4a343', '#9e6241']
    });
  };

  const handleCopyQuote = async () => {
    const textToCopy = `“${currentQuote.text}”\n— ${currentQuote.authorName || 'Scriber'}\n\nVia Scriber (Inspiration Sanctuary)`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (e) {
      console.warn('Clipboard write failed', e);
    }
  };

  const handleDownloadImage = async () => {
    setIsExportingImage(true);
    try {
      const dataUrl = await exportQuoteAsImage(currentQuote, darkMode);
      const link = document.createElement('a');
      link.download = `scriber-quote-${currentQuote.id.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
      setShareFeedback('Image card saved!');
      setTimeout(() => setShareFeedback(null), 3000);
    } catch (err) {
      console.error('Error exporting image:', err);
    } finally {
      setIsExportingImage(false);
    }
  };

  // Social Sharing triggers
  const handleShareTwitter = () => {
    const text = encodeURIComponent(`“${currentQuote.text}” — ${currentQuote.authorName || 'Scriber'}\n\n#Scriber #Quotes #Inspiration`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`“${currentQuote.text}”\n— ${currentQuote.authorName || 'Scriber'}\n\nCreated on Scriber`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleSharePinterest = async () => {
    const description = encodeURIComponent(`“${currentQuote.text}” — ${currentQuote.authorName}`);
    window.open(`https://pinterest.com/pin/create/button/?description=${description}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Scriber Quote: ${currentQuote.authorName}`,
          text: `“${currentQuote.text}” — ${currentQuote.authorName}`,
          url: window.location.href,
        });
      } catch (err) {
        console.warn('Native share dismissed or failed', err);
      }
    } else {
      handleCopyQuote();
    }
  };

  return (
    <div id="quote-studio-container" className="flex flex-col gap-6 scroll-mt-24">
      
      {/* Top Bar with Minimal Focus Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Quote Studio
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-body">
            Your words, your mood. Create a quote card for any feeling, chapter, or possibility.
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Generated quotes stay private. Sharing or exporting is always your choice.</p>
        </div>
        <button
          onClick={() => setIsMinimalFocusMode(!isMinimalFocusMode)}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
          style={{
            borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
            color: darkMode ? themeConfig.textDark : themeConfig.textLight,
          }}
          title={isMinimalFocusMode ? "Exit Minimalist Writing Mode" : "Enter Distraction-Free Scribe Mode"}
        >
          {isMinimalFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">
            {isMinimalFocusMode ? "Show Controls" : "Minimal Focus"}
          </span>
        </button>
      </div>
      <button type="button" onClick={() => setIsControlsOpen(true)} aria-haspopup="dialog"
        className="lg:hidden w-full flex items-center justify-center gap-2 rounded-2xl min-h-12 px-5 py-3 text-sm font-semibold text-white"
        style={{ backgroundColor: themeConfig.primary }}>
        <Sliders size={18} /> Create & Style a Quote
      </button>
      {generationError && !isControlsOpen && <p role="alert" className="lg:hidden rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{generationError}</p>}

      {/* Signature Design Options Showcase Strip */}
      <div 
        id="design-options-showcase"
        className="order-3 lg:order-2 rounded-2xl p-4 sm:p-5 border shadow-xs transition-all"
        style={{
          backgroundColor: darkMode ? `${themeConfig.cardDark}` : '#fbf8f2',
          borderColor: darkMode ? themeConfig.borderDark : '#e6dac7',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span 
              className="p-1.5 rounded-lg text-white"
              style={{ backgroundColor: themeConfig.primary }}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div>
              <h3 className="font-display text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                Signature Design Styles & Archetypes
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Click any design option to transform your typographic canvas instantly
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest hidden md:inline">
            6 Handcrafted Combinations
          </span>
        </div>

        {/* Presets Grid */}
        <div className="grid grid-flow-col auto-cols-[140px] overflow-x-auto pb-2 lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-6 gap-2.5">
          {designPresets.map((preset) => {
            const isActive = currentQuote.fontFamily === preset.fontFamily && currentQuote.backgroundStyle === preset.backgroundStyle;
            const fontClass = FONT_CONFIGS[preset.fontFamily]?.styleClass || 'font-display';

            return (
              <div
                key={preset.id}
                onClick={() => handleApplyPreset(preset, false)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between group ${
                  isActive 
                    ? 'ring-2 shadow-xs' 
                    : 'hover:border-stone-400'
                }`}
                style={{
                  backgroundColor: darkMode ? `${themeConfig.bgDark}90` : '#ffffff',
                  borderColor: isActive ? themeConfig.primary : (darkMode ? themeConfig.borderDark : themeConfig.borderLight),
                  boxShadow: isActive ? `0 0 0 1px ${themeConfig.primary}` : undefined,
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span 
                      className="w-3 h-3 rounded-full border border-white shadow-2xs"
                      style={{ backgroundColor: preset.accentColor }}
                    />
                    {isActive ? (
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        Active
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-stone-400 uppercase">
                        {preset.category.split('-')[0]}
                      </span>
                    )}
                  </div>

                  <h4 className={`text-xs font-bold leading-tight line-clamp-1 ${fontClass}`}>
                    {preset.name}
                  </h4>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 leading-snug line-clamp-2">
                    {preset.desc}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-stone-400">
                    {preset.fontName.split(' ')[0]}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyPreset(preset, true);
                    }}
                    className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-300"
                    title="Load with sample words"
                  >
                    + Sample
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="order-2 lg:order-3 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Generative Controls & Customization (hidden in full minimal focus mode) */}
        {!isMinimalFocusMode && (
          <ResponsiveSheet isOpen={isControlsOpen} onClose={() => setIsControlsOpen(false)} title="Create & Style a Quote" themeConfig={themeConfig} darkMode={darkMode}>
            <div id="studio-controls-panel" className="space-y-5">
            <div>
              <label htmlFor="quote-topic" className="font-display text-lg font-bold block mb-2">
                What would you like your quote to be about?
              </label>
              <p id="quote-topic-help" className="text-xs text-stone-500 dark:text-stone-300 mb-3">
                Tell us in your own words. Pick a topic or describe a feeling, person, or moment.
              </p>
              <textarea
                id="quote-topic"
                disabled={isGenerating}
                ref={topicInputRef}
                value={userInputPrompt}
                onChange={(event) => {
                  setUserInputPrompt(event.target.value);
                  setTopicError('');
                }}
                placeholder="e.g. love that feels like home, embracing my natural hair, or finding courage to start over..."
                rows={3}
                maxLength={1000}
                aria-required="true"
                aria-invalid={Boolean(topicError)}
                aria-describedby={`quote-topic-help${topicError ? ' quote-topic-error' : ''}`}
                className="w-full px-3.5 py-3 rounded-xl border text-sm bg-stone-50 dark:bg-stone-900/50 resize-y focus:outline-hidden focus:ring-2"
                style={{
                  borderColor: topicError ? '#dc2626' : (darkMode ? themeConfig.borderDark : themeConfig.borderLight),
                  color: darkMode ? themeConfig.textDark : themeConfig.textLight,
                }}
              />
              {topicError && <p id="quote-topic-error" role="alert" className="mt-2 text-xs text-red-700 dark:text-red-300">{topicError}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-3" role="group" aria-label="Quote topic ideas">
                <span className="text-[11px] text-stone-500 dark:text-stone-300">Try:</span>
                {['Love', 'Hair', 'Friendship', 'New beginnings'].map((topic) => (
                  <button key={topic} type="button"
                    onClick={() => {
                      setUserInputPrompt(topic);
                      setTopicError('');
                      topicInputRef.current?.focus();
                    }}
                    className="px-3 py-1.5 rounded-full border text-xs font-medium"
                    style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}>
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400 block mb-2">
                Choose a Quote Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      onChangeQuote({ ...currentQuote, category: cat.id });
                    }}
                    className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      activeCategory === cat.id
                        ? 'text-white shadow-xs font-semibold'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                    style={activeCategory === cat.id ? { backgroundColor: themeConfig.primary } : {}}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Aesthetic Vibe */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400 block mb-2">
                Aesthetic Archetype
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'gen-z' as const, label: 'Playful & Bold', desc: 'Modern words, big feelings' },
                  { id: 'earthy-minimal' as const, label: 'Soft & Reflective', desc: 'A little pause, a deeper thought' },
                ].map((vibe) => (
                  <button
                    key={vibe.id}
                    onClick={() => setActiveVibe(vibe.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      activeVibe === vibe.id ? 'ring-2 shadow-xs' : 'hover:border-stone-400'
                    }`}
                    style={{
                      borderColor: activeVibe === vibe.id ? themeConfig.primary : (darkMode ? themeConfig.borderDark : themeConfig.borderLight),
                      backgroundColor: darkMode ? `${themeConfig.bgDark}40` : '#ffffff',
                    }}
                  >
                    <span className="text-xs font-bold block">{vibe.label}</span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400">{vibe.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Generate with AI Button */}
            {generationError && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{generationError}</p>}
            <button
              id="btn-generate-quote-ai"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              style={{ backgroundColor: themeConfig.primary }}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Scribing Unique Typography...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Inspire Me with Scriber AI</span>
                </>
              )}
            </button>

            {/* 5. Typography Selection */}
            <div className="pt-2 border-t" style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}>
              <label className="text-xs font-mono uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400 block mb-2">
                Canvas Typography
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(FONT_CONFIGS) as FontChoice[]).map((fontKey) => {
                  const font = FONT_CONFIGS[fontKey];
                  const isCurrent = currentQuote.fontFamily === fontKey;
                  return (
                    <button
                      key={fontKey}
                      onClick={() => onChangeQuote({ ...currentQuote, fontFamily: fontKey })}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all ${font.styleClass} ${
                        isCurrent
                          ? 'bg-amber-900/10 dark:bg-amber-100/10 font-bold ring-1 ring-amber-700 dark:ring-amber-300'
                          : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200'
                      }`}
                      style={{ color: isCurrent ? themeConfig.primary : undefined }}
                    >
                      {font.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Background Art / Textures */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider font-semibold text-stone-500 dark:text-stone-400 block mb-2">
                Background Visual
              </label>
              <div className="grid grid-cols-2 gap-2">
                {backgrounds.map((bg) => {
                  const isSelected = currentQuote.backgroundStyle === bg.id;
                  return (
                    <button
                      key={bg.id}
                      onClick={() => onChangeQuote({ ...currentQuote, backgroundStyle: bg.id })}
                      className={`p-2 rounded-lg border text-xs text-left flex items-center gap-2 transition-all ${
                        isSelected ? 'ring-2 font-semibold' : 'hover:border-stone-400'
                      }`}
                      style={{
                        borderColor: isSelected ? themeConfig.primary : (darkMode ? themeConfig.borderDark : themeConfig.borderLight),
                        backgroundColor: darkMode ? `${themeConfig.bgDark}60` : '#ffffff',
                      }}
                    >
                      <span className="w-10 h-10 rounded-lg flex-shrink-0 bg-cover bg-center" style={{ backgroundColor: bg.previewColor, backgroundImage: getBackgroundVisual(bg.id, darkMode).backgroundImage }} />
                      <span className="truncate">{bg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            </div>
          </ResponsiveSheet>
        )}

        {/* Right Side: Interactive Typography Canvas Card & Share Deck */}
        <div className={`${isMinimalFocusMode ? 'lg:col-span-12 max-w-4xl mx-auto' : 'lg:col-span-7'} space-y-4`}>
          
          {/* Scribing Canvas Preview Container */}
          <div 
            id="quote-canvas-preview"
            className={`relative rounded-3xl p-6 sm:p-10 border shadow-lg transition-all overflow-hidden flex flex-col justify-between min-h-[460px] ${bgVisual.backgroundClass}`}
            style={{
              backgroundImage: bgVisual.backgroundImage,
              borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
            }}
          >
            {/* Subtle frosted glass inner overlay card */}
            <div 
              className="absolute inset-4 sm:inset-6 rounded-2xl pointer-events-none transition-all"
              style={{
                backgroundColor: darkMode ? 'rgba(20, 16, 14, 0.86)' : 'rgba(255, 255, 255, 0.90)',
                backdropFilter: 'blur(10px)',
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(120, 90, 60, 0.12)',
              }}
            />

            {/* Canvas Header: Category Badge & Style Indicator */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span 
                  className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border"
                  style={{
                    backgroundColor: darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)',
                    borderColor: currentQuote.accentColor || themeConfig.accent,
                    color: currentQuote.accentColor || themeConfig.primary,
                  }}
                >
                  {currentQuote.vibeBadge || 'Scriber Reflection'}
                </span>
                <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 hidden sm:inline">
                  • {fontStyle.name}
                </span>
              </div>

              {/* Decorative quotation mark glyph */}
              <span className="font-editorial italic text-3xl opacity-20 text-stone-800 dark:text-stone-200">
                “
              </span>
            </div>

            {/* Central Editable Quote Text */}
            <div className="relative z-10 my-8">
              <textarea
                aria-label="Quote text"
                value={currentQuote.text}
                onChange={(e) => onChangeQuote({ ...currentQuote, text: e.target.value })}
                rows={4}
                className={`w-full bg-transparent border-none focus:outline-hidden resize-none text-xl sm:text-2xl md:text-3xl leading-relaxed text-center ${fontStyle.styleClass} ${
                  darkMode ? 'text-stone-100 placeholder-stone-600' : 'text-stone-900 placeholder-stone-400'
                }`}
                style={{
                  letterSpacing: currentQuote.fontFamily === 'mono' ? '-0.02em' : 'normal',
                }}
                placeholder="Type your authentic words here or tap 'Inspire Me with Scriber AI'..."
              />

              {/* Author attribution editable */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="text-stone-400 text-sm">—</span>
                <input
                  aria-label="Quote author"
                  type="text"
                  value={currentQuote.authorName}
                  onChange={(e) => onChangeQuote({ ...currentQuote, authorName: e.target.value })}
                  placeholder="Author or voice"
                  className="bg-transparent border-b border-dashed border-stone-400/40 text-center font-body text-xs sm:text-sm font-semibold text-stone-600 dark:text-stone-400 focus:outline-hidden focus:border-stone-700 dark:focus:border-stone-200 px-2 py-0.5"
                />
              </div>

              {/* Highlight Words Pill tags */}
              {currentQuote.highlightWords && currentQuote.highlightWords.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-5">
                  {currentQuote.highlightWords.map((hw, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium"
                      style={{
                        backgroundColor: `${currentQuote.accentColor || themeConfig.primary}18`,
                        color: currentQuote.accentColor || themeConfig.primary,
                      }}
                    >
                      #{hw}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Canvas Footer Bar */}
            <div className="relative z-10 flex items-center justify-between pt-4 border-t border-stone-200/40 dark:border-stone-700/40 text-xs font-mono text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span>{currentQuote.likesCount || 1} souls inspired</span>
              </span>
              <span>Scriber Studio</span>
            </div>

          </div>

          {/* Social Media Share Bar & Action Deck */}
          <div 
            id="quote-sharing-deck"
            className="rounded-2xl p-4 sm:p-5 border shadow-xs space-y-4"
            style={{
              backgroundColor: darkMode ? themeConfig.cardDark : themeConfig.cardLight,
              borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Share & Save This Design
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Direct share to social media or download high-res typography card
                </p>
              </div>

              {shareFeedback && (
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 animate-fade-in">
                  {shareFeedback}
                </span>
              )}
            </div>

            {/* Social Platform Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-share-twitter"
                onClick={handleShareTwitter}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
                style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}
                title="Share to Twitter / X"
              >
                <Twitter className="w-4 h-4 text-sky-500" />
                <span>Twitter / X</span>
              </button>

              <button
                id="btn-share-whatsapp"
                onClick={handleShareWhatsApp}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
                style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}
                title="Share to WhatsApp"
              >
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <span>WhatsApp</span>
              </button>

              <button
                id="btn-share-pinterest"
                onClick={handleSharePinterest}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
                style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}
                title="Pin on Pinterest"
              >
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-[10px]">
                  P
                </span>
                <span>Pinterest</span>
              </button>

              <button
                id="btn-share-native"
                onClick={handleNativeShare}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
                style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}
                title="Native Web Share"
              >
                <Share2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>More Share</span>
              </button>

              <button
                id="btn-copy-quote"
                onClick={handleCopyQuote}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
                style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-500" />}
                <span>{copiedText ? 'Copied Text' : 'Copy Quote'}</span>
              </button>
            </div>

            {/* Primary Action Buttons: Download Image & Save to Collection */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t"
              style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}
            >
              <button
                id="btn-download-image-card"
                onClick={handleDownloadImage}
                disabled={isExportingImage}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold border transition-all hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50"
                style={{
                  borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
                  color: darkMode ? themeConfig.textDark : themeConfig.textLight,
                }}
              >
                <Download className="w-4 h-4" />
                <span>{isExportingImage ? 'Rendering High-Res PNG...' : 'Download Image Card'}</span>
              </button>

              <button
                id="btn-save-personal-collection"
                onClick={handleSave}
                className={`w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs ${
                  isSaved ? 'bg-amber-800 text-white' : 'text-white'
                }`}
                style={{
                  backgroundColor: isSaved ? '#3d4d38' : themeConfig.primary,
                }}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4" />
                    <span>Saved to Collection</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>Save to Personal Collection</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
