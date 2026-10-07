import React, { useState } from 'react';
import { Send, Heart, Sparkles, MessageCircle } from 'lucide-react';
import { QuoteItem, QuoteFeedback } from '../types/quote';
import { ThemeConfig } from '../lib/themeStyles';
import { BottomSheet } from './BottomSheet';

interface FeedbackModalProps {
  quote: QuoteItem | null;
  isOpen: boolean;
  onClose: () => void;
  feedbacks: QuoteFeedback[];
  onSubmitFeedback: (quoteId: string, comment: string) => void;
  userName: string;
  themeConfig: ThemeConfig;
  darkMode: boolean;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  quote,
  isOpen,
  onClose,
  feedbacks,
  onSubmitFeedback,
  userName,
  themeConfig,
  darkMode,
}) => {
  const [commentText, setCommentText] = useState('');

  if (!isOpen || !quote) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onSubmitFeedback(quote.id, commentText.trim());
    setCommentText('');
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Echoes on this Quote" themeConfig={themeConfig} darkMode={darkMode}>
      <div 
        id="community-feedback-modal"
        className="w-full flex flex-col justify-between"
        style={{
          backgroundColor: darkMode ? themeConfig.cardDark : themeConfig.cardLight,
          borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
          color: darkMode ? themeConfig.textDark : themeConfig.textLight,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b"
          style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Community Reflections
            </div>
          </div>
        </div>

        {/* Quote Miniature Context */}
        <div className="my-3 p-3.5 rounded-xl bg-stone-100/70 dark:bg-stone-800/40 border border-stone-200/50 dark:border-stone-700/50">
          <p className="text-xs sm:text-sm italic font-display line-clamp-3 text-stone-800 dark:text-stone-200">
            “{quote.text}”
          </p>
          <span className="text-[11px] font-semibold text-stone-500 block text-right mt-1">
            — {quote.authorName}
          </span>
        </div>

        {/* Feedback List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 my-2 pr-1 min-h-[140px] max-h-[260px]">
          {feedbacks.length === 0 ? (
            <div className="text-center py-8 text-stone-400 dark:text-stone-500 text-xs">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No community reflections yet.</p>
              <p className="mt-0.5">Be the first to share what these words mean to you.</p>
            </div>
          ) : (
            feedbacks.map((fb) => (
              <div 
                key={fb.id}
                className="p-3 rounded-xl border text-xs"
                style={{
                  borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
                  backgroundColor: darkMode ? `${themeConfig.bgDark}60` : '#faf9f7',
                }}
              >
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span className="text-stone-800 dark:text-stone-200 font-mono text-[11px]">
                    {fb.userName || 'Kind Soul'}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {new Date(fb.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-stone-600 dark:text-stone-300 font-body leading-relaxed">
                  {fb.comment}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Feedback Input Form */}
        <form onSubmit={handleSubmit} className="pt-3 border-t flex items-center gap-2"
          style={{ borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight }}
        >
          <input 
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add an encouraging reflection..."
            aria-label="Your reflection"
            className="flex-1 px-3.5 py-2 rounded-xl border text-xs bg-stone-50 dark:bg-stone-900/50 focus:outline-hidden"
            style={{
              borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight,
              color: darkMode ? themeConfig.textDark : themeConfig.textLight,
            }}
          />
          <button
            type="submit"
            aria-label="Post reflection"
            disabled={!commentText.trim()}
            className="p-2.5 rounded-xl text-white shadow-xs transition-opacity disabled:opacity-40"
            style={{ backgroundColor: themeConfig.primary }}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </BottomSheet>
  );
};
