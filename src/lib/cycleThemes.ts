import { SixHourTrendingTheme, QuoteItem } from '../types/quote';

export const SIX_HOUR_THEMES: SixHourTrendingTheme[] = [
  {
    cycleId: 'cycle-roots-night', themeTitle: 'Starlight Diary', subtitle: 'A little wonder for your late-night thoughts.',
    styleTag: 'Cosmic Calm',
    fontPairing: { heading: 'playfair', body: 'jakarta', headingLabel: 'Playfair Display', bodyLabel: 'Plus Jakarta Sans' },
    palette: { primary: '#6550a4', secondary: '#a68bd9', accent: '#9b67bf', bg: '#eee8fc' },
    inspirationalSeed: 'You can begin again, even before the sun comes up.',
    locHairAffirmation: 'I make space for possibility.', recommendedBackground: 'celestial-night', expiresAt: 0,
  },
  {
    cycleId: 'cycle-crown-dawn', themeTitle: 'Citrus Daydream', subtitle: 'Fresh starts, tiny joys, and room to grow.',
    styleTag: 'Fresh Perspective',
    fontPairing: { heading: 'syne', body: 'hand', headingLabel: 'Syne Display', bodyLabel: 'Caveat Hand' },
    palette: { primary: '#42764e', secondary: '#9cc785', accent: '#467b4e', bg: '#f3f8df' },
    inspirationalSeed: 'A small brave step is still a beautiful beginning.',
    locHairAffirmation: 'I grow at my own pace.', recommendedBackground: 'citrus-garden', expiresAt: 0,
  },
  {
    cycleId: 'cycle-genz-flow', themeTitle: 'Aurora Bloom', subtitle: 'Dream in full color. Let your words take up space.',
    styleTag: 'Creative Energy',
    fontPairing: { heading: 'fraunces', body: 'mono', headingLabel: 'Fraunces Soft Serif', bodyLabel: 'Space Mono' },
    palette: { primary: '#6940b5', secondary: '#b78aea', accent: '#9152b0', bg: '#faf0ff' },
    inspirationalSeed: 'Your imagination is a door. Give yourself permission to open it.',
    locHairAffirmation: 'My ideas deserve a place in the world.', recommendedBackground: 'aurora-bloom', expiresAt: 0,
  },
  {
    cycleId: 'cycle-twilight-clay', themeTitle: 'Peach Picnic', subtitle: 'Playful words, warm skies, and the joy of simply being.',
    styleTag: 'Golden Hour',
    fontPairing: { heading: 'reggae', body: 'jakarta', headingLabel: 'Abril Fatface', bodyLabel: 'Plus Jakarta Sans' },
    palette: { primary: '#a64221', secondary: '#f0a28e', accent: '#b34c37', bg: '#fff1e6' },
    inspirationalSeed: 'Let ordinary moments become the things you remember most.',
    locHairAffirmation: 'Joy belongs in my everyday life.', recommendedBackground: 'sunset-checker', expiresAt: 0,
  },
];

export function getCurrentSixHourTheme(): SixHourTrendingTheme {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const cycleIndex = Math.floor(utcHours / 6) % SIX_HOUR_THEMES.length;
  const expiresDate = new Date(now);
  expiresDate.setUTCHours((Math.floor(utcHours / 6) + 1) * 6, 0, 0, 0);
  return { ...SIX_HOUR_THEMES[cycleIndex], expiresAt: expiresDate.getTime() };
}

export const INITIAL_CURATED_QUOTES: QuoteItem[] = [
  {
    id: 'quote-locs-1', text: 'You do not have to become someone else to begin. The person you are today is already worthy of a beautiful life.',
    authorName: 'Scriber Notes', category: 'self-worth', visualStyle: 'Aurora Bloom', fontFamily: 'playfair',
    backgroundStyle: 'aurora-bloom', accentColor: '#6940b5', likesCount: 142, highlightWords: ['worthy', 'beautiful'],
    vibeBadge: 'Already Enough', createdAt: new Date(Date.now() - 18000000).toISOString(),
  },
  {
    id: 'quote-reggae-1', text: 'Growth is not always a grand arrival. Sometimes it is the quiet decision to try again with a little more kindness.',
    authorName: 'Scriber Notes', category: 'growth', visualStyle: 'Citrus Daydream', fontFamily: 'fraunces',
    backgroundStyle: 'citrus-garden', accentColor: '#467b4e', likesCount: 98, highlightWords: ['Growth', 'kindness'],
    vibeBadge: 'Little by Little', createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'quote-genz-1', text: 'Unapologetically soft, wildly grounded, thriving exclusively on my own energetic frequency.',
    authorName: 'Scriber Notes', category: 'gen-z-motivation', visualStyle: 'Peach Picnic', fontFamily: 'syne',
    backgroundStyle: 'sunset-checker', accentColor: '#b34c37', likesCount: 184, highlightWords: ['soft', 'grounded'],
    vibeBadge: 'Your Own Era', createdAt: new Date(Date.now() - 72000000).toISOString(),
  },
  {
    id: 'quote-locs-2', text: 'Love is in the small things: remembering, listening, making room. Let your kindness be a place someone can rest.',
    authorName: 'Scriber Notes', category: 'love', visualStyle: 'Aurora Bloom', fontFamily: 'hand',
    backgroundStyle: 'aurora-bloom', accentColor: '#a84675', likesCount: 119, highlightWords: ['Love', 'kindness'],
    vibeBadge: 'Soft Connections', createdAt: new Date(Date.now() - 108000000).toISOString(),
  },
  {
    id: 'quote-affirmation-1', text: 'I breathe in calmness, I exhale haste. Today I make room for possibility, presence, and my own peace.',
    authorName: 'Daily Affirmation', category: 'daily-affirmation', visualStyle: 'Starlight Diary', fontFamily: 'fraunces',
    backgroundStyle: 'celestial-night', accentColor: '#6940b5', likesCount: 76, highlightWords: ['possibility', 'peace'],
    vibeBadge: 'A Gentle Reset', createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'quote-earth-1', text: 'You do not need to bloom all year round. Even the tallest trees know the quiet value of a season of rest.',
    authorName: 'Scriber Notes', category: 'earthy-zen', visualStyle: 'Citrus Daydream', fontFamily: 'mono',
    backgroundStyle: 'citrus-garden', accentColor: '#467b4e', likesCount: 88, highlightWords: ['bloom', 'rest'],
    vibeBadge: 'Natural Rhythm', createdAt: new Date(Date.now() - 252000000).toISOString(),
  },
  {
    id: 'quote-dreams-1', text: 'Keep a little room in your plans for the life you have not imagined yet. Possibility loves an open door.',
    authorName: 'Scriber Notes', category: 'dreams', visualStyle: 'Starlight Diary', fontFamily: 'playfair',
    backgroundStyle: 'celestial-night', accentColor: '#6940b5', likesCount: 64, highlightWords: ['Possibility', 'open'],
    vibeBadge: 'Dream Bigger', createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'quote-joy-1', text: 'Collect the little joys. A good song, a shared laugh, sunlight on the floor. This is your life happening.',
    authorName: 'Scriber Notes', category: 'joy', visualStyle: 'Peach Picnic', fontFamily: 'reggae',
    backgroundStyle: 'sunset-checker', accentColor: '#b34c37', likesCount: 53, highlightWords: ['joys', 'life'],
    vibeBadge: 'Everyday Magic', createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'quote-creative-1', text: 'Make something just because it makes you feel alive. Not everything beautiful needs to become a milestone.',
    authorName: 'Scriber Notes', category: 'creative-flow', visualStyle: 'Aurora Bloom', fontFamily: 'syne',
    backgroundStyle: 'aurora-bloom', accentColor: '#6940b5', likesCount: 47, highlightWords: ['alive', 'beautiful'],
    vibeBadge: 'Creative Permission', createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
];

export const DAILY_AFFIRMATIONS_BANK = [
  { id: 'aff-1', category: 'self-worth', text: 'I am worthy of care, connection, and a life that feels like mine.', focus: 'Self-Worth' },
  { id: 'aff-2', category: 'love', text: 'I welcome relationships where kindness, honesty, and respect move in both directions.', focus: 'Love & Connection' },
  { id: 'aff-3', category: 'gen-z-motivation', text: 'I release the urge to over-explain my quiet joy. My softness is my superpower.', focus: 'Unapologetic Peace' },
  { id: 'aff-4', category: 'growth', text: 'I can learn, change direction, and begin again. Progress does not need to be perfect.', focus: 'Becoming' },
  { id: 'aff-5', category: 'earthy-zen', text: 'Today I choose simplicity over noise, depth over speed, and authenticity over approval.', focus: 'Grounded Living' },
  { id: 'aff-6', category: 'dreams', text: 'My dreams deserve attention. Today I take one practical step toward what matters to me.', focus: 'Possibility' },
];
