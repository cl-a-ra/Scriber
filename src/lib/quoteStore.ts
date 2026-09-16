import { QuoteItem, QuoteFeedback, ThemeColorPreset, FontChoice } from '../types/quote';
import { INITIAL_CURATED_QUOTES } from './cycleThemes';
import { 
  db, 
  auth, 
  User, 
  signInWithPopup, 
  signInAnonymously, 
  signOut, 
  googleProvider,
  onAuthStateChanged 
} from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  updateDoc, 
  increment 
} from 'firebase/firestore';

const LOCAL_QUOTES_KEY = 'scriber_local_quotes_v1';
const SAVED_IDS_KEY = 'scriber_saved_ids_v1';
const LIKED_IDS_KEY = 'scriber_liked_ids_v1';
const FEEDBACKS_KEY = 'scriber_feedbacks_v1';
const PREFS_KEY = 'scriber_user_prefs_v1';

export interface UserPreferences {
  themeColor: ThemeColorPreset;
  fontChoice: FontChoice;
  darkMode: boolean;
  dailyNotificationEnabled: boolean;
  notificationTime: string; // e.g. "09:00"
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  themeColor: 'earthy-sage',
  fontChoice: 'fraunces',
  darkMode: false,
  dailyNotificationEnabled: false,
  notificationTime: '09:00',
};

// Safe LocalStorage helpers
export function loadLocalPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Unable to load preferences from localStorage', e);
  }
  return DEFAULT_PREFERENCES;
}

export function saveLocalPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Unable to save preferences to localStorage', e);
  }
}

export function loadSavedQuoteIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveSavedQuoteIds(ids: string[]): void {
  try {
    localStorage.setItem(SAVED_IDS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.warn('Failed to save quote ids to localStorage', e);
  }
}

export function loadLikedQuoteIds(): string[] {
  try {
    const raw = localStorage.getItem(LIKED_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveLikedQuoteIds(ids: string[]): void {
  try {
    localStorage.setItem(LIKED_IDS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.warn('Failed to save liked ids', e);
  }
}

export function loadLocalQuotes(): QuoteItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_QUOTES_KEY);
    if (raw) {
      const parsed: QuoteItem[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load quotes from localStorage', e);
  }
  return INITIAL_CURATED_QUOTES;
}

export function saveLocalQuotes(quotes: QuoteItem[]): void {
  try {
    localStorage.setItem(LOCAL_QUOTES_KEY, JSON.stringify(quotes));
  } catch (e) {
    console.warn('Failed to save quotes to localStorage', e);
  }
}

export function loadLocalFeedbacks(): Record<string, QuoteFeedback[]> {
  try {
    const raw = localStorage.getItem(FEEDBACKS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveLocalFeedbacks(feedbacks: Record<string, QuoteFeedback[]>): void {
  try {
    localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(feedbacks));
  } catch (e) {
    console.warn('Failed to save feedbacks to localStorage', e);
  }
}
