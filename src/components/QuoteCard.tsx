import React, { useState } from 'react';
import { 
  Heart, 
  Bookmark, 
  BookmarkCheck, 
  MessageSquare, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  Trash2,
  Tag
} from 'lucide-react';
import { QuoteItem } from '../types/quote';
import { ThemeConfig, FONT_CONFIGS, getBackgroundVisual } from '../lib/themeStyles';
import { exportQuoteAsImage } from '../lib/canvasExporter';

interface QuoteCardProps {
  quote: QuoteItem;
  isSaved: boolean;
  isLiked: boolean;
  onToggleSave: (quote: QuoteItem) => void;
  onToggleLike: (quote: QuoteItem) => void;
  onOpenFeedback: (quote: QuoteItem) => void;
  onDeleteFromSaved?: (quoteId: string) => void;
  onSelectForStudio?: (quote: QuoteItem) => void;
  feedbackCount?: number;
  themeConfig: ThemeConfig;
  darkMode: boolean;
  showDelete?: boolean;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
  quote,
  isSaved,
  isLiked,
  onToggleSave,
  onToggleLike,
  onOpenFeedback,
  onDeleteFromSaved,
  onSelectForStudio,
  feedbackCount = 0,
  themeConfig,
  darkMode,
  showDelete = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const bgVisual = getBackgroundVisual(quote.backgroundStyle, darkMode);
  const fontStyle = FONT_CONFIGS[quote.fontFamily] || FONT_CONFIGS.fraunces;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`“${quote.text}” — ${quote.authorName}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting(true);
    try {
      const dataUrl = await exportQuoteAsImage(quote, darkMode);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `quote-${quote.id}.png`;
      a.click();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quote by ${quote.authorName}`,
          text: `“${quote.text}” — ${quote.authorName}`,
          url: window.location.href,
        });
      } catch (err) {
        console.warn(err);
      }
    } else {
      handleCopy(e);
    }
  };

  return (
    <div 
      id={`quote-card-${quote.id}`}
      className={`rounded-2xl border shadow-xs transition-all hover:shadow-md flex flex-col justify-between overflow-hidden relative group ${bgVisual.backgroundClass}`}
      style={{
        backgroundImage: bgVisual.backgroundImage,
        borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
      }}
    >
      {/* Semi-transparent protective inner card for optimal text readability */}
      <div 
        className="absolute inset-3 rounded-xl pointer-events-none transition-opacity"
        style={{
          backgroundColor: darkMode ? 'rgba(20, 16, 14, 0.88)' : 'rgba(255, 255, 255, 0.90)',
          backdropFilter: 'blur(8px)',
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(120, 90, 60, 0.1)',
        }}
      />

      {/* Card Content Area */}
      <div className="relative z-10 p-5 sm:p-6 flex-1 flex flex-col justify-between">
        
        {/* Card Header: Vibe badge & category */}
        <div className="flex items-center justify-between mb-4">
          <span 
            className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border"
            style={{
              backgroundColor: darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)',
              borderColor: quote.accentColor || themeConfig.accent,
              color: quote.accentColor || themeConfig.primary,
            }}
          >
            {quote.vibeBadge || quote.visualStyle}
          </span>

          <div className="flex items-center gap-1">
            {onSelectForStudio && (
              <button
                onClick={() => onSelectForStudio(quote)}
                className="text-[11px] font-mono px-2 py-0.5 rounded-md hover:bg-stone-200/60 dark:hover:bg-stone-700/60 text-stone-500 dark:text-stone-400 transition-colors"
                title="Open in Studio to edit or customize"
              >
                Customize
              </button>
            )}

            {showDelete && onDeleteFromSaved && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFromSaved(quote.id);
                }}
                className="p-1 rounded-md text-stone-400 hover:text-rose-500 transition-colors"
                title="Remove from saved collection"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quote Text */}
        <div className="my-3">
          <p 
            className={`text-lg sm:text-xl leading-relaxed ${fontStyle.styleClass} ${
              darkMode ? 'text-stone-100' : 'text-stone-900'
            }`}
          >
            “{quote.text}”
          </p>

          <p className="mt-3 text-xs sm:text-sm font-semibold text-stone-600 dark:text-stone-400 font-body text-right">
            — {quote.authorName || 'Anonymous'}
          </p>

          {/* Highlight Words Tags */}
          {quote.highlightWords && quote.highlightWords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {quote.highlightWords.map((word, idx) => (
                <span 
                  key={idx}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: `${quote.accentColor || themeConfig.primary}15`,
                    color: quote.accentColor || themeConfig.primary,
                  }}
                >
                  #{word}
                </span>
              ))}
            </div>
          )}

          {/* Personal Note if exists */}
          {quote.notes && (
            <div className="mt-3 p-2 rounded-lg bg-stone-100/70 dark:bg-stone-800/50 text-xs italic text-stone-600 dark:text-stone-300 font-body">
              <span className="font-semibold not-italic text-[10px] uppercase font-mono block text-stone-400">Personal Reflection:</span>
              {quote.notes}
            </div>
          )}
        </div>

        {/* Card Footer: Likes, Comments, Share & Save */}
        <div className="pt-3 mt-4 border-t border-stone-200/40 dark:border-stone-700/40 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          
          <div className="flex items-center gap-3">
            {/* Like Counter */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(quote);
              }}
              className={`flex items-center gap-1 transition-colors ${
                isLiked ? 'text-rose-500 font-bold' : 'hover:text-rose-500'
              }`}
              title="Like this quote"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
              <span>{quote.likesCount + (isLiked ? 1 : 0)}</span>
            </button>

            {/* Community Feedback */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenFeedback(quote);
              }}
              className="flex items-center gap-1 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
              title="Community reflections & locs feedback"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{feedbackCount > 0 ? feedbackCount : 'Reflect'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-700/50 transition-colors"
              title="Copy quote"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="p-1.5 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-700/50 transition-colors"
              title="Download image card"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleNativeShare}
              className="p-1.5 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-700/50 transition-colors"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(quote);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                isSaved ? 'text-amber-700 dark:text-amber-300' : 'hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
              }`}
              title={isSaved ? "Saved in Personal Collection" : "Save to Personal Collection"}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 fill-amber-600/30" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
