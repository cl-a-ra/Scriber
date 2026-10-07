import { AestheticStyle, BackgroundStyle, FontChoice, QuoteCategory, QUOTE_CATEGORIES } from '../types/quote';
import { GeneratedManifestationGuide, ManifestationGuideRequest, MANIFESTATION_FOCUSES, WRITING_METHODS } from '../types/manifestation';

export const AI_FONTS: FontChoice[] = ['fraunces', 'syne', 'playfair', 'jakarta', 'mono', 'hand', 'reggae'];
export const AI_BACKGROUNDS: BackgroundStyle[] = ['aurora-bloom', 'sunset-checker', 'celestial-night', 'citrus-garden', 'texture-linen', 'gradient-earth', 'gradient-terracotta', 'gradient-forest', 'gradient-matcha', 'minimal-solid'];
const CATEGORIES: QuoteCategory[] = [...QUOTE_CATEGORIES.map((category) => category.id), 'reggae-roots', 'locs-hair'];
const AESTHETICS: AestheticStyle[] = ['earthy-minimal', 'gen-z', 'reggae-roots', 'locs-crown', 'vintage-dub'];

export interface QuoteGenerationRequest {
  userInput: string;
  category: QuoteCategory;
  aestheticStyle: AestheticStyle;
  authorName?: string;
}

export interface GeneratedQuoteResult {
  text: string;
  authorName: string;
  category: QuoteCategory;
  visualStyle: string;
  fontFamily: FontChoice;
  backgroundStyle: BackgroundStyle;
  accentColor: string;
  highlightWords: string[];
  vibeBadge: string;
  stylingNotes: string;
}

export class ContractError extends Error {}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ContractError('Expected a JSON object.');
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new ContractError(`${label} must be non-empty text of at most ${max} characters.`);
  }
  return value.trim();
}

function choice<T extends string>(value: unknown, values: readonly T[], label: string): T {
  const selected = values.find((item) => item === value);
  if (!selected) throw new ContractError(`${label} is not supported.`);
  return selected;
}

function strings(value: unknown, label: string, min: number, max: number, itemMax: number): string[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) {
    throw new ContractError(`${label} must contain ${min} to ${max} items.`);
  }
  return value.map((item) => text(item, label, itemMax));
}

function knownFields(value: Record<string, unknown>, fields: string[]): void {
  if (Object.keys(value).some((key) => !fields.includes(key))) throw new ContractError('The request contains unsupported fields.');
}

export function parseQuoteRequest(value: unknown): QuoteGenerationRequest {
  const data = object(value);
  knownFields(data, ['userInput', 'category', 'aestheticStyle', 'authorName']);
  return {
    userInput: text(data.userInput, 'Quote topic', 1000),
    category: choice(data.category ?? 'self-worth', CATEGORIES, 'Category'),
    aestheticStyle: choice(data.aestheticStyle ?? 'earthy-minimal', AESTHETICS, 'Aesthetic'),
    ...(data.authorName === undefined ? {} : { authorName: text(data.authorName, 'Author name', 100) }),
  };
}

export function parseManifestationRequest(value: unknown): ManifestationGuideRequest {
  const data = object(value);
  knownFields(data, ['intention', 'feeling', 'action', 'focus', 'method']);
  return {
    intention: text(data.intention, 'Intention', 180),
    feeling: text(data.feeling, 'Feeling', 180),
    action: text(data.action, 'Action', 240),
    focus: choice(data.focus, MANIFESTATION_FOCUSES, 'Focus'),
    method: choice(data.method, WRITING_METHODS, 'Writing method'),
  };
}

export function parseGeneratedQuote(value: unknown): GeneratedQuoteResult {
  const data = object(value);
  const quoteText = text(data.text, 'Quote', 1000);
  const wordCount = quoteText.split(/\s+/).length;
  if (wordCount < 15 || wordCount > 35) throw new ContractError('A generated quote must contain 15 to 35 words.');
  const accentColor = text(data.accentColor, 'Accent color', 7);
  if (!/^#[0-9a-f]{6}$/i.test(accentColor)) throw new ContractError('Accent color must be a six-digit hex color.');
  const highlightWords = strings(data.highlightWords, 'Highlights', 2, 4, 40);
  if (highlightWords.some((word) => !quoteText.toLowerCase().includes(word.toLowerCase()))) {
    throw new ContractError('Highlights must appear in the quote.');
  }
  return {
    text: quoteText,
    authorName: text(data.authorName, 'Author name', 100),
    category: choice(data.category, CATEGORIES, 'Category'),
    visualStyle: text(data.visualStyle, 'Visual style', 50),
    fontFamily: choice(data.fontFamily, AI_FONTS, 'Font'),
    backgroundStyle: choice(data.backgroundStyle, AI_BACKGROUNDS, 'Background'),
    accentColor, highlightWords,
    vibeBadge: text(data.vibeBadge, 'Vibe badge', 50),
    stylingNotes: text(data.stylingNotes, 'Styling notes', 500),
  };
}

export function parseGeneratedManifestation(value: unknown): GeneratedManifestationGuide {
  const data = object(value);
  return {
    text: text(data.text, 'Manifestation writing', 10000),
    reflectionPrompts: strings(data.reflectionPrompts, 'Reflection prompts', 3, 3, 240),
  };
}

export function build369Practice(statement: string, action: string): string {
  return `My intention: ${statement}\nMy grounded action: ${action}\n\n${[3, 6, 9].map((count, index) =>
    `${['Morning', 'Afternoon', 'Evening'][index]} / ${count} repetitions\n${Array.from({ length: count }, (_, line) => `${line + 1}. ${statement}`).join('\n')}`).join('\n\n')}`;
}
