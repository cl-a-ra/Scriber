import { AI_FONTS } from './aiContracts';
import { scopedStorageKey } from './quoteStore';
import { MANIFESTATION_FOCUSES, WRITING_METHODS, type ManifestationDraft, type ManifestationEntry, type ManifestationState } from '../types/manifestation';

const STORAGE_KEY = 'scriber_manifestation_box_v1';
export const EMPTY_DRAFT: ManifestationDraft = {
  intention: '', feeling: '', action: '', text: '', focus: 'Personal growth',
  method: 'freewrite', background: 'aurora-bloom', font: 'hand',
};

export function copyManifestationDraft(draft: ManifestationDraft): ManifestationDraft {
  return {
    intention: draft.intention, feeling: draft.feeling, action: draft.action, text: draft.text,
    focus: draft.focus, method: draft.method, background: draft.background, font: draft.font,
  };
}

export function isManifestationDraft(value: unknown, cloudLimits = true): value is ManifestationDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Record<string, unknown>;
  return ['intention', 'feeling', 'action', 'text', 'focus'].every((key) => typeof draft[key] === 'string')
    && (!cloudLimits || (typeof draft.text === 'string' && draft.text.length <= 100000
      && [draft.intention, draft.feeling, draft.action].every((field) => typeof field === 'string' && field.length <= 1000)))
    && WRITING_METHODS.some((method) => method === draft.method)
    && MANIFESTATION_FOCUSES.some((focus) => focus === draft.focus)
    && ['aurora-bloom', 'sunset-checker', 'celestial-night', 'citrus-garden'].includes(String(draft.background))
    && AI_FONTS.some((font) => font === draft.font);
}

export function isManifestationEntry(value: unknown, cloudLimits = true): value is ManifestationEntry {
  return isManifestationDraft(value, cloudLimits) && 'id' in value && typeof value.id === 'string'
    && /^[a-zA-Z0-9_-]{1,128}$/.test(value.id)
    && 'createdAt' in value && typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt))
    && 'fulfilled' in value && typeof value.fulfilled === 'boolean';
}

export function loadManifestationState(userId: string | null): ManifestationState & { error: string } {
  try {
    const raw = localStorage.getItem(scopedStorageKey(STORAGE_KEY, userId));
    if (!raw) return { draft: { ...EMPTY_DRAFT }, entries: [], error: '' };
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || !('draft' in value) || !('entries' in value)
      || !isManifestationDraft(value.draft, false) || !Array.isArray(value.entries) || !value.entries.every((entry) => isManifestationEntry(entry, false))) {
      throw new Error('Invalid manifestation box');
    }
    return { draft: copyManifestationDraft(value.draft), entries: value.entries, error: '' };
  } catch (error) {
    console.error('Unable to restore manifestation box', { name: error instanceof Error ? error.name : 'Unknown error' });
    return { draft: { ...EMPTY_DRAFT }, entries: [], error: 'Your saved box could not be loaded. Existing device data will not be replaced until you make a change.' };
  }
}

export function saveManifestationState(userId: string | null, box: ManifestationState): void {
  if (!isManifestationDraft(box.draft, false) || !box.entries.every((entry) => isManifestationEntry(entry, false))) throw new Error('The manifestation box contains invalid writing.');
  localStorage.setItem(scopedStorageKey(STORAGE_KEY, userId), JSON.stringify(box));
}
