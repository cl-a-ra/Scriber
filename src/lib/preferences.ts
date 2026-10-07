import type { ThemeColorPreset, FontChoice } from '../types/quote';
import { AI_FONTS } from './aiContracts';

export interface UserPreferences {
  themeColor: ThemeColorPreset;
  fontChoice: FontChoice;
  darkMode: boolean;
  dailyNotificationEnabled: boolean;
  notificationTime: string;
}
export const DEFAULT_PREFERENCES: UserPreferences = {
  themeColor: 'lavender-pop', fontChoice: 'fraunces', darkMode: false,
  dailyNotificationEnabled: false, notificationTime: '09:00',
};
const THEMES: ThemeColorPreset[] = ['lavender-pop', 'sunshine-club', 'ocean-daydream', 'earthy-sage', 'terracotta-ochre', 'reggae-gold', 'genz-matcha', 'deep-cocoa', 'desert-rose'];

export function parsePreferences(value: unknown): UserPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid preferences.');
  const data = value as Record<string, unknown>;
  const themeColor = THEMES.find((theme) => theme === data.themeColor);
  const fontChoice = AI_FONTS.find((font) => font === data.fontChoice);
  if (!themeColor || !fontChoice || Object.keys(data).some((key) => !Object.hasOwn(DEFAULT_PREFERENCES, key))
    || typeof data.darkMode !== 'boolean' || typeof data.dailyNotificationEnabled !== 'boolean'
    || typeof data.notificationTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.notificationTime)) {
    throw new Error('Invalid preferences.');
  }
  return { themeColor, fontChoice, darkMode: data.darkMode, dailyNotificationEnabled: data.dailyNotificationEnabled, notificationTime: data.notificationTime };
}
