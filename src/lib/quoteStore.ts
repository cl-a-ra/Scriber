import { QuoteItem, QuoteFeedback } from '../types/quote';
import { INITIAL_CURATED_QUOTES } from './cycleThemes';
import { DEFAULT_PREFERENCES, parsePreferences, type UserPreferences } from './preferences';
export { DEFAULT_PREFERENCES, type UserPreferences } from './preferences';

const LOCAL_QUOTES_KEY = 'scriber_local_quotes_v1';
const SAVED_IDS_KEY = 'scriber_saved_ids_v1';
const LIKED_IDS_KEY = 'scriber_liked_ids_v1';
const FEEDBACKS_KEY = 'scriber_feedbacks_v1';
const PREFS_KEY = 'scriber_user_prefs_v1';

export function scopedStorageKey(key: string, userId: string | null): string {
  return userId ? `${key}:user:${userId}` : key;
}

// Safe LocalStorage helpers
export function loadLocalPreferences(userId: string | null = null): UserPreferences {
  try {
    const raw = localStorage.getItem(scopedStorageKey(PREFS_KEY, userId));
    if (raw) {
      return parsePreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(raw) });
    }
  } catch (e) {
    console.warn('Unable to load preferences from localStorage', e);
  }
  return DEFAULT_PREFERENCES;
}

export function saveLocalPreferences(prefs: UserPreferences, userId: string | null = null): void {
  localStorage.setItem(scopedStorageKey(PREFS_KEY, userId), JSON.stringify(prefs));
}

export function loadSavedQuoteIds(userId: string | null = null, strict = false): string[] {
  try {
    const raw = localStorage.getItem(scopedStorageKey(SAVED_IDS_KEY, userId));
    const ids: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string')) throw new Error('Invalid saved quote list.');
    return ids;
  } catch (e) {
    console.warn('Unable to restore saved quotes', { name: e instanceof Error ? e.name : 'Unknown error' });
    if (strict) throw new Error('Guest bookmarks could not be restored. Existing guest data is unchanged; restore the bookmark list before importing.');
    return [];
  }
}

export function saveSavedQuoteIds(ids: string[], userId: string | null = null): void {
  localStorage.setItem(scopedStorageKey(SAVED_IDS_KEY, userId), JSON.stringify(ids));
}

export function loadLikedQuoteIds(userId: string | null = null): string[] {
  try {
    const raw = localStorage.getItem(scopedStorageKey(LIKED_IDS_KEY, userId));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveLikedQuoteIds(ids: string[], userId: string | null = null): void {
  localStorage.setItem(scopedStorageKey(LIKED_IDS_KEY, userId), JSON.stringify(ids));
}

export function loadLocalQuotes(userId: string | null = null): QuoteItem[] {
  try {
    const raw = localStorage.getItem(scopedStorageKey(LOCAL_QUOTES_KEY, userId));
    if (raw) {
      const parsed: QuoteItem[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const curated = new Map(INITIAL_CURATED_QUOTES.map((quote) => [quote.id, quote]));
        return [
          ...parsed.map((quote) => userId ? quote : curated.get(quote.id) || quote),
          ...INITIAL_CURATED_QUOTES.filter((quote) => !parsed.some((stored) => stored.id === quote.id)),
        ];
      }
    }
  } catch (e) {
    console.warn('Failed to load quotes from localStorage', e);
  }
  return INITIAL_CURATED_QUOTES;
}

export function saveLocalQuotes(quotes: QuoteItem[], userId: string | null = null): void {
  localStorage.setItem(scopedStorageKey(LOCAL_QUOTES_KEY, userId), JSON.stringify(quotes));
}

export function loadLocalFeedbacks(userId: string | null = null): Record<string, QuoteFeedback[]> {
  try {
    const raw = localStorage.getItem(scopedStorageKey(FEEDBACKS_KEY, userId));
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveLocalFeedbacks(feedbacks: Record<string, QuoteFeedback[]>, userId: string | null = null): void {
  localStorage.setItem(scopedStorageKey(FEEDBACKS_KEY, userId), JSON.stringify(feedbacks));
}
