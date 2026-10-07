export type QuoteCategory = 
  | 'all'
  | 'self-worth'
  | 'growth'
  | 'love'
  | 'dreams'
  | 'joy'
  | 'locs-hair'
  | 'reggae-roots'
  | 'gen-z-motivation'
  | 'daily-affirmation'
  | 'earthy-zen'
  | 'creative-flow';

export type FontChoice = 
  | 'fraunces'
  | 'syne'
  | 'playfair'
  | 'jakarta'
  | 'mono'
  | 'hand'
  | 'reggae';

export type ThemeColorPreset = 
  | 'lavender-pop'
  | 'sunshine-club'
  | 'ocean-daydream'
  | 'earthy-sage'
  | 'terracotta-ochre'
  | 'reggae-gold'
  | 'genz-matcha'
  | 'deep-cocoa'
  | 'desert-rose';

export type BackgroundStyle = 
  | 'aurora-bloom'
  | 'sunset-checker'
  | 'celestial-night'
  | 'citrus-garden'
  | 'texture-linen'
  | 'reggae-roots-art'
  | 'locs-crown-art'
  | 'genz-aesthetic-art'
  | 'gradient-earth'
  | 'gradient-terracotta'
  | 'gradient-forest'
  | 'gradient-matcha'
  | 'minimal-solid';

export type LayoutStyle = 
  | 'centered'
  | 'editorial-left'
  | 'poster-bold'
  | 'cozy-card'
  | 'minimal-stamp';

export type SanctuaryTab = 'studio' | 'explore' | 'favorites' | 'affirmations' | 'manifest' | 'profile';
export type AestheticStyle = 'earthy-minimal' | 'reggae-roots' | 'gen-z' | 'locs-crown' | 'vintage-dub';

export const QUOTE_CATEGORIES: { id: QuoteCategory; label: string }[] = [
  { id: 'self-worth', label: 'Self-Worth' },
  { id: 'growth', label: 'Growth' },
  { id: 'love', label: 'Love & Connection' },
  { id: 'dreams', label: 'Dreams & Ambition' },
  { id: 'joy', label: 'Everyday Joy' },
  { id: 'gen-z-motivation', label: 'Your Own Era' },
  { id: 'daily-affirmation', label: 'Affirmations' },
  { id: 'earthy-zen', label: 'Mindful Living' },
  { id: 'creative-flow', label: 'Creativity & Poetry' },
];

export interface QuoteItem {
  id: string;
  text: string;
  authorName: string;
  category: QuoteCategory;
  visualStyle: string;
  fontFamily: FontChoice;
  backgroundStyle: BackgroundStyle;
  accentColor: string;
  likesCount: number;
  userId?: string;
  userLiked?: boolean;
  isSaved?: boolean;
  sixHourCycle?: string;
  highlightWords?: string[];
  vibeBadge?: string;
  createdAt: string;
  notes?: string;
}

export interface QuoteFeedback {
  id: string;
  quoteId: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
}

export interface SixHourTrendingTheme {
  cycleId: string;
  themeTitle: string;
  subtitle: string;
  styleTag: string;
  fontPairing: {
    heading: FontChoice;
    body: FontChoice;
    headingLabel: string;
    bodyLabel: string;
  };
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
  };
  inspirationalSeed: string;
  locHairAffirmation: string;
  recommendedBackground: BackgroundStyle;
  expiresAt: number;
}
