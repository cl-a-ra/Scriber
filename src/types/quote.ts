export type QuoteCategory = 
  | 'all'
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
  | 'earthy-sage'
  | 'terracotta-ochre'
  | 'reggae-gold'
  | 'genz-matcha'
  | 'deep-cocoa'
  | 'desert-rose';

export type BackgroundStyle = 
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
