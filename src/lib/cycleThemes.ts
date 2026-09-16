import { SixHourTrendingTheme, QuoteItem } from '../types/quote';

export const SIX_HOUR_THEMES: SixHourTrendingTheme[] = [
  {
    cycleId: 'cycle-roots-night',
    themeTitle: 'Midnight Roots & Deep Reverie',
    subtitle: 'Bass frequencies, spiritual stillness, and sacred crown protection',
    styleTag: 'Roots & Dub',
    fontPairing: {
      heading: 'reggae',
      body: 'jakarta',
      headingLabel: 'Abril Roots Display',
      bodyLabel: 'Plus Jakarta Clean'
    },
    palette: {
      primary: '#2d3319',
      secondary: '#b36b39',
      accent: '#d4a343',
      bg: '#1a1d12'
    },
    inspirationalSeed: 'In the quiet hours, your roots absorb the silent strength of the earth.',
    locHairAffirmation: 'My locs are antennae of ancient peace; I wrap my crown in gratitude tonight.',
    recommendedBackground: 'reggae-roots-art',
    expiresAt: 0
  },
  {
    cycleId: 'cycle-crown-dawn',
    themeTitle: 'Solar Crown & Morning Hydration',
    subtitle: 'Golden sunrise tones, rosewater mist, and unapologetic self-worth',
    styleTag: 'Crown Radiance',
    fontPairing: {
      heading: 'playfair',
      body: 'fraunces',
      headingLabel: 'Playfair Royal',
      bodyLabel: 'Fraunces Editorial'
    },
    palette: {
      primary: '#7d4926',
      secondary: '#c98a4b',
      accent: '#4e5b31',
      bg: '#fbf8f3'
    },
    inspirationalSeed: 'Rise like your crown—patiently formed, deeply rooted, reaching for light.',
    locHairAffirmation: 'Every coil in my dreadlocs holds divine patience, strength, and sovereign beauty.',
    recommendedBackground: 'locs-crown-art',
    expiresAt: 0
  },
  {
    cycleId: 'cycle-genz-flow',
    themeTitle: 'Gen-Z Matcha & Unbothered Flow',
    subtitle: 'Organic lo-fi matcha tones, fluid boundaries, and high-frequency growth',
    styleTag: 'Modern Gen-Z',
    fontPairing: {
      heading: 'syne',
      body: 'mono',
      headingLabel: 'Syne Experimental',
      bodyLabel: 'Space Mono Minimal'
    },
    palette: {
      primary: '#3d4d38',
      secondary: '#82957b',
      accent: '#c47d53',
      bg: '#f4f6f1'
    },
    inspirationalSeed: 'Protect your peace loudly. Grow your goals softly.',
    locHairAffirmation: 'Growing locs taught me that real transformation cannot be rushed by anyone.',
    recommendedBackground: 'genz-aesthetic-art',
    expiresAt: 0
  },
  {
    cycleId: 'cycle-twilight-clay',
    themeTitle: 'Terracotta Dusk & Acoustic Hearth',
    subtitle: 'Warm earth, tactile cozy textures, and gratitude for the journey',
    styleTag: 'Earthy Warmth',
    fontPairing: {
      heading: 'fraunces',
      body: 'hand',
      headingLabel: 'Fraunces Old-Style',
      bodyLabel: 'Caveat Hand Scribed'
    },
    palette: {
      primary: '#6b3e26',
      secondary: '#9e6241',
      accent: '#55633e',
      bg: '#fcf6f0'
    },
    inspirationalSeed: 'Simplicity is not the absence of clutter; it is the presence of purpose.',
    locHairAffirmation: 'My crown does not need to conform to be sacred; it is royal as it grows.',
    recommendedBackground: 'texture-linen',
    expiresAt: 0
  }
];

export function getCurrentSixHourTheme(): SixHourTrendingTheme {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const cycleIndex = Math.floor(utcHours / 6) % SIX_HOUR_THEMES.length;
  
  const baseTheme = SIX_HOUR_THEMES[cycleIndex];
  
  // Expiration is at the next 6-hour interval
  const nextCycleHour = (Math.floor(utcHours / 6) + 1) * 6;
  const expiresDate = new Date(now);
  expiresDate.setUTCHours(nextCycleHour, 0, 0, 0);
  
  return {
    ...baseTheme,
    expiresAt: expiresDate.getTime()
  };
}

export const INITIAL_CURATED_QUOTES: QuoteItem[] = [
  {
    id: 'quote-locs-1',
    text: "My locs are not just hair; they are an archive of every season I chose patience over haste, and truth over conformity.",
    authorName: "Crown Elder",
    category: "locs-hair",
    visualStyle: "Locs Majesty",
    fontFamily: "playfair",
    backgroundStyle: "locs-crown-art",
    accentColor: "#c98a4b",
    likesCount: 142,
    highlightWords: ["patience", "truth", "crown"],
    vibeBadge: "Dreadlocs Wisdom",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  },
  {
    id: 'quote-reggae-1',
    text: "Emancipate yourself from mental gravity; when roots run deeper than concrete, no storm can uproot your spirit.",
    authorName: "Roots & Dub Archive",
    category: "reggae-roots",
    visualStyle: "Reggae Vinyl",
    fontFamily: "reggae",
    backgroundStyle: "reggae-roots-art",
    accentColor: "#d4a343",
    likesCount: 98,
    highlightWords: ["roots", "deeper", "spirit"],
    vibeBadge: "Roots Vibration",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
  },
  {
    id: 'quote-genz-1',
    text: "Unapologetically soft, wildly grounded, thriving exclusively on my own energetic frequency.",
    authorName: "Mya Z.",
    category: "gen-z-motivation",
    visualStyle: "Matcha Modern",
    fontFamily: "syne",
    backgroundStyle: "genz-aesthetic-art",
    accentColor: "#82957b",
    likesCount: 184,
    highlightWords: ["soft", "grounded", "frequency"],
    vibeBadge: "Gen-Z Relatable",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString()
  },
  {
    id: 'quote-locs-2',
    text: "Let each dreadloc lock in wisdom and lock out negativity. Your crown was never meant to be tame.",
    authorName: "Loc Community Voice",
    category: "locs-hair",
    visualStyle: "Earthy Royalty",
    fontFamily: "fraunces",
    backgroundStyle: "locs-crown-art",
    accentColor: "#b36b39",
    likesCount: 119,
    highlightWords: ["wisdom", "crown", "tame"],
    vibeBadge: "Locs Journey",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString()
  },
  {
    id: 'quote-affirmation-1',
    text: "I breathe in calmness, I exhale haste. Today I move in divine rhythm with nature and my inner peace.",
    authorName: "Daily Affirmation",
    category: "daily-affirmation",
    visualStyle: "Cozy Linen",
    fontFamily: "fraunces",
    backgroundStyle: "texture-linen",
    accentColor: "#4e5b31",
    likesCount: 76,
    highlightWords: ["calmness", "rhythm", "peace"],
    vibeBadge: "Daily Affirmation",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
  },
  {
    id: 'quote-earth-1',
    text: "You do not need to bloom all year round. Even the great baobab tree knows the sacred value of resting beneath the dry season.",
    authorName: "Earthy Zen",
    category: "earthy-zen",
    visualStyle: "Minimalist Earth",
    fontFamily: "mono",
    backgroundStyle: "gradient-earth",
    accentColor: "#7d4926",
    likesCount: 88,
    highlightWords: ["bloom", "sacred", "resting"],
    vibeBadge: "Natural Rhythm",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString()
  }
];

export const DAILY_AFFIRMATIONS_BANK = [
  {
    id: 'aff-1',
    category: 'locs-hair',
    text: 'My locs are flourishing in patience, health, and grace. My crown is my sanctuary.',
    focus: 'Locs & Crown'
  },
  {
    id: 'aff-2',
    category: 'reggae-roots',
    text: 'One love in my heart, deep peace in my mind, and steady steps on holy ground.',
    focus: 'Roots & Harmony'
  },
  {
    id: 'aff-3',
    category: 'gen-z-motivation',
    text: 'I release the urge to over-explain my quiet joy. My softness is my superpower.',
    focus: 'Unapologetic Peace'
  },
  {
    id: 'aff-4',
    category: 'locs-hair',
    text: 'Just like my dreadlocs bind and mature with time, so does my inner wisdom and confidence.',
    focus: 'Crown Evolution'
  },
  {
    id: 'aff-5',
    category: 'earthy-zen',
    text: 'Today I choose simplicity over noise, depth over speed, and authenticity over approval.',
    focus: 'Grounded Living'
  }
];
