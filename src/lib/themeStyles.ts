import { ThemeColorPreset, FontChoice, BackgroundStyle } from '../types/quote';
import { ART_ASSETS } from './assets';

export interface ThemeConfig {
  name: string;
  badge: string;
  primary: string;
  bgLight: string;
  bgDark: string;
  cardLight: string;
  cardDark: string;
  borderLight: string;
  borderDark: string;
  textLight: string;
  textDark: string;
  accent: string;
  accentBg: string;
}

export const THEME_CONFIGS: Record<ThemeColorPreset, ThemeConfig> = {
  'earthy-sage': {
    name: 'Earthy Sage & Lo-Fi Clay',
    badge: 'Cozy Earth',
    primary: '#4e5b31',
    bgLight: '#fbf9f5',
    bgDark: '#161914',
    cardLight: '#ffffff',
    cardDark: '#20241e',
    borderLight: '#e5e0d3',
    borderDark: '#2e352b',
    textLight: '#2c3325',
    textDark: '#e7ebe3',
    accent: '#82957b',
    accentBg: '#edf2ea',
  },
  'terracotta-ochre': {
    name: 'Terracotta & Desert Ochre',
    badge: 'Warm Terracotta',
    primary: '#9e6241',
    bgLight: '#fdf8f4',
    bgDark: '#1a1614',
    cardLight: '#ffffff',
    cardDark: '#26201c',
    borderLight: '#eedfd5',
    borderDark: '#3a302a',
    textLight: '#42281a',
    textDark: '#faeee6',
    accent: '#c98a4b',
    accentBg: '#faede3',
  },
  'reggae-gold': {
    name: 'Reggae Roots & Forest Gold',
    badge: 'Roots Vibration',
    primary: '#324024',
    bgLight: '#faf8f2',
    bgDark: '#141712',
    cardLight: '#ffffff',
    cardDark: '#1f241a',
    borderLight: '#e4decb',
    borderDark: '#323a2b',
    textLight: '#28311a',
    textDark: '#f2edd9',
    accent: '#d4a343',
    accentBg: '#f7edd5',
  },
  'genz-matcha': {
    name: 'Gen-Z Matcha & Oat Cream',
    badge: 'Matcha Clean',
    primary: '#3d4d38',
    bgLight: '#f5f7f3',
    bgDark: '#151915',
    cardLight: '#ffffff',
    cardDark: '#1e241e',
    borderLight: '#dbe2d7',
    borderDark: '#2b352b',
    textLight: '#232e20',
    textDark: '#e6ede4',
    accent: '#6b8265',
    accentBg: '#e8efe6',
  },
  'deep-cocoa': {
    name: 'Deep Espresso & Warm Linen',
    badge: 'Espresso Calm',
    primary: '#4a3728',
    bgLight: '#faf6f0',
    bgDark: '#181412',
    cardLight: '#ffffff',
    cardDark: '#241e1b',
    borderLight: '#e8dfd5',
    borderDark: '#382f2a',
    textLight: '#2e2118',
    textDark: '#f5ede5',
    accent: '#8a684d',
    accentBg: '#f2e8dd',
  },
  'desert-rose': {
    name: 'Desert Rose & Muted Sand',
    badge: 'Desert Warmth',
    primary: '#854b4b',
    bgLight: '#fcf6f5',
    bgDark: '#1a1415',
    cardLight: '#ffffff',
    cardDark: '#261e20',
    borderLight: '#ebdcdb',
    borderDark: '#3d2e30',
    textLight: '#381f21',
    textDark: '#faedee',
    accent: '#b87676',
    accentBg: '#faeaea',
  },
};

export const FONT_CONFIGS: Record<FontChoice, { name: string; styleClass: string; description: string }> = {
  fraunces: {
    name: 'Fraunces',
    styleClass: 'font-display',
    description: 'Warm editorial serif with organic curves'
  },
  syne: {
    name: 'Syne',
    styleClass: 'font-genz',
    description: 'Gen-Z experimental modern display'
  },
  playfair: {
    name: 'Playfair Display',
    styleClass: 'font-editorial',
    description: 'Regal serif for royal crown aesthetics'
  },
  jakarta: {
    name: 'Plus Jakarta Sans',
    styleClass: 'font-body',
    description: 'Refined, high-legibility geometric sans'
  },
  mono: {
    name: 'Space Mono',
    styleClass: 'font-code',
    description: 'Lo-fi typewriter minimalist precision'
  },
  hand: {
    name: 'Caveat Hand',
    styleClass: 'font-hand',
    description: 'Personal, cozy handwritten soul'
  },
  reggae: {
    name: 'Abril Roots',
    styleClass: 'font-reggae',
    description: 'Bold roots & culture display'
  }
};

export function getBackgroundVisual(style: BackgroundStyle, darkMode: boolean): {
  backgroundImage?: string;
  backgroundClass: string;
  textClass: string;
} {
  switch (style) {
    case 'reggae-roots-art':
      return {
        backgroundImage: `url("${ART_ASSETS.reggaeRoots}")`,
        backgroundClass: 'bg-cover bg-center',
        textClass: 'text-stone-900'
      };
    case 'locs-crown-art':
      return {
        backgroundImage: `url("${ART_ASSETS.locsCrown}")`,
        backgroundClass: 'bg-cover bg-center',
        textClass: 'text-stone-900'
      };
    case 'genz-aesthetic-art':
      return {
        backgroundImage: `url("${ART_ASSETS.genzAesthetic}")`,
        backgroundClass: 'bg-cover bg-center',
        textClass: 'text-stone-900'
      };
    case 'gradient-earth':
      return {
        backgroundClass: darkMode 
          ? 'bg-gradient-to-br from-[#26201c] via-[#1a1614] to-[#12100f]' 
          : 'bg-gradient-to-br from-[#f8f2ea] via-[#efe5d7] to-[#e4d3c0]',
        textClass: darkMode ? 'text-[#f5ede5]' : 'text-[#382618]'
      };
    case 'gradient-terracotta':
      return {
        backgroundClass: darkMode 
          ? 'bg-gradient-to-br from-[#2f1f18] via-[#211611] to-[#160f0c]' 
          : 'bg-gradient-to-br from-[#fdf2eb] via-[#f7dfd1] to-[#eed0be]',
        textClass: darkMode ? 'text-[#faeee6]' : 'text-[#442314]'
      };
    case 'gradient-forest':
      return {
        backgroundClass: darkMode 
          ? 'bg-gradient-to-br from-[#1b2416] via-[#141b11] to-[#0e130c]' 
          : 'bg-gradient-to-br from-[#f2f6ee] via-[#e2ecdb] to-[#d3e2cb]',
        textClass: darkMode ? 'text-[#e9f1e6]' : 'text-[#24331e]'
      };
    case 'gradient-matcha':
      return {
        backgroundClass: darkMode 
          ? 'bg-gradient-to-br from-[#1d261d] via-[#161e16] to-[#0f140f]' 
          : 'bg-gradient-to-br from-[#f4f7f2] via-[#e5ede1] to-[#d6e3cf]',
        textClass: darkMode ? 'text-[#e7f0e5]' : 'text-[#202e1e]'
      };
    case 'texture-linen':
    default:
      return {
        backgroundClass: darkMode 
          ? 'bg-[#1e1a17]' 
          : 'bg-[#faf7f2]',
        textClass: darkMode ? 'text-[#ede6de]' : 'text-[#2e2620]'
      };
  }
}
