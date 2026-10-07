import type { QuoteItem, BackgroundStyle, QuoteCategory } from '../types/quote';
import type { ManifestationDraft, ManifestationEntry, ManifestationState } from '../types/manifestation';
import { AI_BACKGROUNDS, AI_FONTS } from './aiContracts';
import { QUOTE_CATEGORIES } from '../types/quote';
import { DEFAULT_PREFERENCES, type UserPreferences } from './quoteStore';
import { parsePreferences } from './preferences';
export { parsePreferences } from './preferences';
import { validateProfile, type LocalProfile } from './profileStore';
import { EMPTY_DRAFT, copyManifestationDraft, isManifestationDraft, isManifestationEntry } from './manifestationStore';

export interface CloudSnapshot {
  profileIsLegacy?: boolean;
  profile: LocalProfile;
  preferences: UserPreferences;
  quotes: QuoteItem[];
  savedIds: string[];
  box: ManifestationState;
}

export type CloudMutation =
  | { kind: 'profile'; profile?: LocalProfile; preferences?: Partial<UserPreferences> }
  | { kind: 'quote' | 'saved'; id: string; value: QuoteItem | null }
  | { kind: 'draft'; value: ManifestationDraft }
  | { kind: 'manifestation'; id: string; value: ManifestationEntry | null };

const BACKGROUNDS: BackgroundStyle[] = [...AI_BACKGROUNDS, 'reggae-roots-art', 'locs-crown-art', 'genz-aesthetic-art'];
const CATEGORIES: QuoteCategory[] = [...QUOTE_CATEGORIES.map((item) => item.id), 'all', 'locs-hair', 'reggae-roots'];

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid cloud document.');
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error('Invalid cloud text field.');
  return value;
}
function choice<T extends string>(value: unknown, options: T[]): T {
  const result = options.find((option) => value === option);
  if (!result) throw new Error('Invalid cloud preference.');
  return result;
}
export function parseCloudProfile(value: unknown): { profile: LocalProfile; preferences: UserPreferences; createdAt: string } {
  const data = record(value);
  const profile = validateProfile({
    displayName: data.displayName, bio: data.bio ?? '', photoData: data.photoData ?? null, useAccountPhoto: data.useAccountPhoto ?? true,
  });
  const preferences = parsePreferences(data.preferences ?? { ...DEFAULT_PREFERENCES, themeColor: data.themeColor, fontChoice: data.fontChoice, darkMode: data.darkMode });
  const createdAt = text(data.createdAt, 40);
  if (!Number.isFinite(Date.parse(createdAt))) throw new Error('Invalid profile creation date.');
  return { profile, preferences, createdAt };
}
export function parseCloudQuote(value: unknown): QuoteItem {
  const data = record(value);
  const id = text(data.id, 128);
  if (!/^[a-zA-Z0-9_-]+$/.test(id) || typeof data.likesCount !== 'number' || !Number.isFinite(data.likesCount) || data.likesCount < 0) throw new Error('Invalid cloud quote.');
  const color = text(data.accentColor, 7);
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Invalid quote color.');
  const highlights = data.highlightWords ?? [];
  if (!Array.isArray(highlights) || highlights.length > 4 || highlights.some((item) => typeof item !== 'string' || item.length > 40)) throw new Error('Invalid quote highlights.');
  const createdAt = text(data.createdAt, 40);
  if (!Number.isFinite(Date.parse(createdAt))) throw new Error('Invalid quote creation date.');
  return {
    id, text: text(data.text, 1000), authorName: text(data.authorName, 100),
    category: choice(data.category, CATEGORIES), visualStyle: text(data.visualStyle, 50),
    fontFamily: choice(data.fontFamily, AI_FONTS), backgroundStyle: choice(data.backgroundStyle, BACKGROUNDS),
    accentColor: color, likesCount: data.likesCount, highlightWords: highlights,
    createdAt, ...(data.userId === undefined ? {} : { userId: text(data.userId, 128) }),
    ...(data.vibeBadge === undefined || data.vibeBadge === '' ? {} : { vibeBadge: text(data.vibeBadge, 50) }),
    ...(data.notes === undefined || data.notes === '' ? {} : { notes: text(data.notes, 2000) }),
    ...(data.sixHourCycle === undefined || data.sixHourCycle === '' ? {} : { sixHourCycle: text(data.sixHourCycle, 100) }),
  };
}
export function mutationKey(mutation: CloudMutation): string {
  return mutation.kind === 'profile' || mutation.kind === 'draft' ? mutation.kind : `${mutation.kind}:${mutation.id}`;
}
export function validateMutation(value: unknown): CloudMutation {
  const data = record(value);
  if (data.kind === 'profile') {
    const profile = data.profile === undefined ? undefined : validateProfile(data.profile);
    const preferences = data.preferences === undefined ? undefined : record(data.preferences);
    if (!profile && !preferences) throw new Error('Empty cloud profile change.');
    if (preferences) {
      if (Object.keys(preferences).some((key) => !Object.hasOwn(DEFAULT_PREFERENCES, key))) throw new Error('Unsupported preference.');
      parsePreferences({ ...DEFAULT_PREFERENCES, ...preferences });
    }
    return { kind: 'profile', ...(profile ? { profile } : {}), ...(preferences ? { preferences } : {}) };
  }
  if (data.kind === 'draft' && isManifestationDraft(data.value)) return { kind: 'draft', value: copyManifestationDraft(data.value) };
  if ((data.kind === 'quote' || data.kind === 'saved' || data.kind === 'manifestation') && typeof data.id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(data.id)) {
    if (data.kind === 'manifestation') {
      if (data.value === null) return { kind: data.kind, id: data.id, value: null };
      if (!isManifestationEntry(data.value) || data.value.id !== data.id) throw new Error('Invalid manifestation change.');
      return { kind: data.kind, id: data.id, value: {
        ...copyManifestationDraft(data.value), id: data.value.id, createdAt: data.value.createdAt, fulfilled: data.value.fulfilled,
      } };
    }
    const quote = data.value === null ? null : parseCloudQuote(data.value);
    if (quote && quote.id !== data.id) throw new Error('Mismatched quote id.');
    return { kind: data.kind, id: data.id, value: quote };
  }
  throw new Error('Invalid pending cloud change.');
}
export function emptyCloudSnapshot(displayName: string): CloudSnapshot {
  return { profile: { displayName, bio: '', photoData: null, useAccountPhoto: true }, preferences: { ...DEFAULT_PREFERENCES }, quotes: [], savedIds: [], box: { draft: { ...EMPTY_DRAFT }, entries: [] } };
}
export function overlayMutations(snapshot: CloudSnapshot, mutations: CloudMutation[]): CloudSnapshot {
  const quotes = new Map(snapshot.quotes.map((quote) => [quote.id, quote]));
  const saved = new Set(snapshot.savedIds);
  const entries = new Map(snapshot.box.entries.map((entry) => [entry.id, entry]));
  let profile = snapshot.profile, preferences = snapshot.preferences, draft = snapshot.box.draft;
  for (const mutation of mutations) {
    if (mutation.kind === 'profile') { profile = mutation.profile ?? profile; preferences = { ...preferences, ...mutation.preferences }; }
    else if (mutation.kind === 'draft') draft = mutation.value;
    else if (mutation.kind === 'manifestation') { if (mutation.value) entries.set(mutation.id, mutation.value); else entries.delete(mutation.id); }
    else {
      if (mutation.kind === 'saved') { if (mutation.value) saved.add(mutation.id); else saved.delete(mutation.id); }
      if (mutation.value) quotes.set(mutation.id, mutation.value);
      else if (mutation.kind === 'quote') quotes.delete(mutation.id);
    }
  }
  return { profileIsLegacy: snapshot.profileIsLegacy, profile, preferences, quotes: [...quotes.values()], savedIds: [...saved], box: { draft, entries: [...entries.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) } };
}
