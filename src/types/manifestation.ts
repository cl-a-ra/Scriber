export const WRITING_METHODS = ['freewrite', 'future-self', 'gratitude', '369'] as const;
export type WritingMethod = typeof WRITING_METHODS[number];

export const MANIFESTATION_FOCUSES = [
  'Personal growth', 'Love & connection', 'Career & creativity', 'Abundance', 'Well-being', 'Adventure',
] as const;
export type ManifestationFocus = typeof MANIFESTATION_FOCUSES[number];

export interface ManifestationGuideRequest {
  intention: string;
  feeling: string;
  action: string;
  focus: ManifestationFocus;
  method: WritingMethod;
}

export interface GeneratedManifestationGuide {
  text: string;
  reflectionPrompts: string[];
}

export interface ManifestationDraft {
  intention: string;
  feeling: string;
  action: string;
  text: string;
  focus: string;
  method: WritingMethod;
  background: BackgroundStyle;
  font: FontChoice;
}

export interface ManifestationEntry extends ManifestationDraft {
  id: string;
  createdAt: string;
  fulfilled: boolean;
}

export interface ManifestationState {
  draft: ManifestationDraft;
  entries: ManifestationEntry[];
}
import type { BackgroundStyle, FontChoice } from './quote';
