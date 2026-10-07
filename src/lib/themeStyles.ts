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
  'lavender-pop': {
    name: 'Lavender Playground', badge: 'Dream in Color',
    primary: '#6940b5', bgLight: '#faf7ff', bgDark: '#171225',
    cardLight: '#ffffff', cardDark: '#261f38', borderLight: '#e3d8f5', borderDark: '#45365e',
    textLight: '#302047', textDark: '#f2eaff', accent: '#9e58cf', accentBg: '#eee2ff',
  },
  'sunshine-club': {
    name: 'Sunshine Club', badge: 'Little Joys',
    primary: '#a64221', bgLight: '#fffaf0', bgDark: '#24160f',
    cardLight: '#ffffff', cardDark: '#36251c', borderLight: '#f4dcc1', borderDark: '#60402a',
    textLight: '#482919', textDark: '#fff2df', accent: '#c45b29', accentBg: '#ffe7bb',
  },
  'ocean-daydream': {
    name: 'Ocean Daydream', badge: 'Make Waves',
    primary: '#096d80', bgLight: '#f0fbfc', bgDark: '#0e2028',
    cardLight: '#ffffff', cardDark: '#19333e', borderLight: '#c5e8eb', borderDark: '#2b5361',
    textLight: '#163e48', textDark: '#e1f7fc', accent: '#137f8f', accentBg: '#cdf1f3',
  },
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
    description: 'Playful, expressive modern display'
  },
  playfair: {
    name: 'Playfair Display',
    styleClass: 'font-editorial',
    description: 'Expressive serif for timeless words'
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
    name: 'Abril Fatface',
    styleClass: 'font-reggae',
    description: 'Big-hearted, bold poster lettering'
  }
};

export function getBackgroundVisual(style: BackgroundStyle, darkMode: boolean): {
  backgroundImage?: string;
  backgroundClass: string;
  textClass: string;
} {
  switch (style) {
    case 'aurora-bloom':
    case 'sunset-checker':
    case 'celestial-night':
    case 'citrus-garden':
      return {
        backgroundImage: getSanctuaryBackground(style, darkMode),
        backgroundClass: 'bg-cover bg-center',
        textClass: darkMode ? 'text-violet-50' : 'text-violet-950',
      };
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

export const SANCTUARY_BACKGROUNDS: { id: BackgroundStyle; label: string; previewColor: string }[] = [
  { id: 'aurora-bloom', label: 'Aurora Bloom', previewColor: '#be9bf2' },
  { id: 'sunset-checker', label: 'Peach Picnic', previewColor: '#f4a787' },
  { id: 'celestial-night', label: 'Starlight Diary', previewColor: '#6350b6' },
  { id: 'citrus-garden', label: 'Citrus Daydream', previewColor: '#b7d883' },
];

// SVG artwork is shared by the live canvas and image export.
export function getSanctuaryBackground(style: BackgroundStyle, darkMode: boolean): string | undefined {
  const base = darkMode ? '#211b35' : '#f8efff';
  let artwork: string;
  switch (style) {
    case 'aurora-bloom':
      artwork = `<defs><radialGradient id="a"><stop stop-color="#b799f5"/><stop offset="1" stop-color="${base}"/></radialGradient></defs><rect width="1080" height="1080" fill="url(#a)"/><ellipse cx="120" cy="210" rx="320" ry="230" fill="#ee9cb8" opacity=".5"/><ellipse cx="1000" cy="880" rx="400" ry="300" fill="#75d9ce" opacity=".45"/><path d="M-80 810 Q350 440 1160 720 M-80 855 Q350 485 1160 765" fill="none" stroke="#fff" stroke-width="4" opacity=".45"/>`;
      break;
    case 'sunset-checker':
      artwork = `<defs><pattern id="p" width="160" height="160" patternUnits="userSpaceOnUse"><rect width="160" height="160" fill="${darkMode ? '#382131' : '#ffe9d9'}"/><path d="M0 0H80V80H0ZM80 80H160V160H80Z" fill="${darkMode ? '#573342' : '#f9c5b0'}"/></pattern></defs><rect width="1080" height="1080" fill="url(#p)"/><circle cx="980" cy="100" r="190" fill="#ffc86b" opacity=".7"/><path d="M-50 950 Q260 700 550 1100" fill="none" stroke="#ed809f" stroke-width="100" opacity=".6"/>`;
      break;
    case 'celestial-night':
      artwork = `<rect width="1080" height="1080" fill="${darkMode ? '#171632' : '#cac3f0'}"/><circle cx="920" cy="170" r="110" fill="#ffe4aa"/><circle cx="955" cy="140" r="100" fill="${darkMode ? '#171632' : '#cac3f0'}"/><g fill="#fff5d6"><path d="M140 120l10 35 35 10-35 10-10 35-10-35-35-10 35-10ZM850 850l12 42 42 12-42 12-12 42-12-42-42-12 42-12Z"/><circle cx="330" cy="80" r="5"/><circle cx="1000" cy="550" r="5"/><circle cx="100" cy="690" r="6"/><circle cx="670" cy="980" r="6"/></g><ellipse cx="300" cy="1100" rx="600" ry="230" fill="#9778d3" opacity=".45"/>`;
      break;
    case 'citrus-garden':
      artwork = `<rect width="1080" height="1080" fill="${darkMode ? '#1c302a' : '#eef4d9'}"/><g fill="#81b899" opacity=".6"><ellipse cx="70" cy="210" rx="70" ry="190" transform="rotate(-30 70 210)"/><ellipse cx="1000" cy="850" rx="90" ry="240" transform="rotate(35 1000 850)"/></g><g fill="#ffc66e" stroke="#fff0c4" stroke-width="12"><circle cx="980" cy="90" r="140"/><circle cx="50" cy="1030" r="150"/></g><g fill="#ec96ae"><circle cx="150" cy="480" r="24"/><circle cx="950" cy="540" r="20"/></g>`;
      break;
    default:
      return undefined;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">${artwork}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
