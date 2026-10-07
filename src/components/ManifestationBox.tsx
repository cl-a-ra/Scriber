import React, { useEffect, useState } from 'react';
import { Sparkles, Sprout, ArrowUpRight, Check, Trash2, Bookmark, Download, Wand2 } from 'lucide-react';
import { ThemeConfig, FONT_CONFIGS, getBackgroundVisual, SANCTUARY_BACKGROUNDS } from '../lib/themeStyles';
import { BackgroundStyle, FontChoice } from '../types/quote';
import { ResponsiveSheet } from './BottomSheet';

type WritingMethod = 'freewrite' | 'future-self' | 'gratitude' | '369';
interface Draft {
  intention: string;
  feeling: string;
  action: string;
  text: string;
  focus: string;
  method: WritingMethod;
  background: BackgroundStyle;
  font: FontChoice;
}
interface Manifestation extends Draft {
  id: string;
  createdAt: string;
  fulfilled: boolean;
}
interface BoxState { draft: Draft; entries: Manifestation[] }
const STORAGE_KEY = 'scriber_manifestation_box_v1';
const METHODS: { id: WritingMethod; name: string; hint: string }[] = [
  { id: 'freewrite', name: 'Free flow', hint: 'No rules. Write what you want to invite into your life.' },
  { id: 'future-self', name: 'Future-self letter', hint: 'Write from the perspective of the person you are becoming.' },
  { id: 'gratitude', name: 'Gratitude scripting', hint: 'Notice what is already here, then imagine what comes next.' },
  { id: '369', name: '3 / 6 / 9 ritual', hint: 'A writing practice: repeat your intention 3 times in the morning, 6 in the afternoon, and 9 at night.' },
];
const EMPTY_DRAFT: Draft = {
  intention: '', feeling: '', action: '', text: '', focus: 'Personal growth',
  method: 'freewrite', background: 'aurora-bloom', font: 'hand',
};

function isDraft(value: unknown): value is Draft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Record<string, unknown>;
  return ['intention', 'feeling', 'action', 'text', 'focus'].every((key) => typeof draft[key] === 'string')
    && METHODS.some((method) => method.id === draft.method)
    && SANCTUARY_BACKGROUNDS.some((background) => background.id === draft.background)
    && typeof draft.font === 'string' && Object.hasOwn(FONT_CONFIGS, draft.font);
}

function loadBox(): BoxState & { error: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { draft: { ...EMPTY_DRAFT }, entries: [], error: '' };
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') throw new Error('Invalid manifestation box');
    const box = value as Record<string, unknown>;
    if (!isDraft(box.draft) || !Array.isArray(box.entries) || !box.entries.every((entry) =>
      isDraft(entry) && 'id' in entry && typeof entry.id === 'string' &&
      'createdAt' in entry && typeof entry.createdAt === 'string' &&
      'fulfilled' in entry && typeof entry.fulfilled === 'boolean')) {
      throw new Error('Invalid manifestation data');
    }
    return { draft: box.draft, entries: box.entries, error: '' };
  } catch (error) {
    console.error('Unable to restore manifestation box', error);
    return { draft: { ...EMPTY_DRAFT }, entries: [], error: 'Your saved box could not be loaded. Existing browser data will not be replaced until you make a change.' };
  }
}

export function ManifestationBox({ themeConfig, darkMode }: { themeConfig: ThemeConfig; darkMode: boolean }) {
  const [initial] = useState(loadBox);
  const [draft, setDraft] = useState<Draft>(initial.draft);
  const [entries, setEntries] = useState<Manifestation[]>(initial.entries);
  const [error, setError] = useState(initial.error);
  const [notice, setNotice] = useState('');
  const [guideOpen, setGuideOpen] = useState(true);
  const [isGuideSheetOpen, setIsGuideSheetOpen] = useState(false);
  useEffect(() => {
    if (draft === initial.draft && entries === initial.entries) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, entries }));
      setError('');
    } catch (storageError) {
      console.error('Unable to save manifestation box', storageError);
      setError('Browser storage is unavailable or full. Your changes are not saved; download your writing before leaving.');
    }
  }, [draft, entries, initial]);

  const updateDraft = (changes: Partial<Draft>) => {
    setDraft((previous) => ({ ...previous, ...changes }));
    setNotice('');
  };
  const buildGuide = () => {
    if (!draft.intention.trim() || !draft.feeling.trim() || !draft.action.trim()) {
      setError('Add your intention, how you want to feel, and one small action before creating a guided draft.');
      return;
    }
    if (draft.text.trim() && !window.confirm('Replace your current writing with a guided draft? Your saved entries will stay in your box.')) return;
    const intention = draft.intention.trim();
    const feeling = draft.feeling.trim();
    const action = draft.action.trim();
    const statement = `I am making space for ${intention}. I choose to feel ${feeling}.`;
    const templates: Record<WritingMethod, string> = {
      freewrite: `${statement}\n\nThis matters to me because...\n\nToday, my next small step is ${action}.\n\nI give myself permission to learn along the way.`,
      'future-self': `Dear future me,\n\nI am proud of the way you kept showing up for ${intention}. You are learning to feel ${feeling}.\n\nIt started with one small step: ${action}.\n\nSomething you learned along the way was...\n\nWith love,\nYour present self`,
      gratitude: `Today, I am grateful for...\n\nI welcome ${intention} into my life, and I imagine feeling ${feeling}.\n\nA moment I can picture is...\n\nI support this intention by choosing to ${action}.\n\nOne good thing already here is...`,
      '369': `My intention: ${statement}\nMy grounded action: ${action}\n\n${[3, 6, 9].map((count, index) =>
        `${['Morning', 'Afternoon', 'Evening'][index]} / ${count} repetitions\n${Array.from({ length: count }, (_, line) => `${line + 1}. ${statement}`).join('\n')}`).join('\n\n')}`,
    };
    updateDraft({ text: templates[draft.method] });
    setNotice('Prompt-based draft created. Make it yours below. No AI service was called.');
    setIsGuideSheetOpen(false);
  };
  const saveEntry = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.intention.trim() || !draft.text.trim()) {
      setError('Give your manifestation an intention and write a few words before saving.');
      return;
    }
    setEntries((previous) => [{ ...draft, intention: draft.intention.trim(), text: draft.text.trim(),
      id: crypto.randomUUID(), createdAt: new Date().toISOString(), fulfilled: false }, ...previous]);
    setNotice('Added to your box. Your draft stays here so you can keep writing.');
  };
  const downloadWriting = () => {
    if (!draft.text.trim()) { setError('Write something first, then download your manifestation.'); return; }
    const url = URL.createObjectURL(new Blob([`${draft.intention || 'My manifestation'}\n\n${draft.text}\n\nWritten in Scriber`], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'scriber-manifestation.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const panelStyle = { backgroundColor: darkMode ? themeConfig.cardDark : themeConfig.cardLight, borderColor: darkMode ? themeConfig.borderDark : themeConfig.borderLight };
  const inputClass = 'w-full rounded-xl border border-stone-200 dark:border-stone-600 bg-white/80 dark:bg-stone-950/30 px-3 py-2.5 text-sm';
  const background = getBackgroundVisual(draft.background, darkMode);
  const activeMethod = METHODS.find((method) => method.id === draft.method)!;

  return (
    <div className="space-y-7 animate-fade-in">
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: themeConfig.accent }}><Sprout size={16} /> A little space for your becoming</span>
          <h1 className="font-display text-3xl sm:text-5xl font-bold">The manifestation box<span style={{ color: themeConfig.accent }}>.</span></h1>
          <p className="text-sm mt-3 max-w-xl text-stone-600 dark:text-stone-300">Dream it. Write it. Take one small step. This is your private place to turn possibilities into intentions.</p>
        </div>
        <span className="text-xs rounded-full px-4 py-2 border" style={panelStyle}>Private to this browser · No cloud sync</span>
      </section>
      <div role="status" aria-live="polite" className="text-sm">{notice}</div>
      {error && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 text-red-800 p-3 text-sm">{error}</p>}
      <button type="button" onClick={() => setIsGuideSheetOpen(true)} aria-haspopup="dialog"
        className="lg:hidden flex items-center justify-center gap-2 w-full min-h-12 rounded-2xl px-5 py-3 text-sm font-semibold text-white"
        style={{ backgroundColor: themeConfig.primary }}><Wand2 size={18} /> Open Guided Writing</button>
      <div className="grid lg:grid-cols-[350px_1fr] gap-6 items-start">
        <ResponsiveSheet isOpen={isGuideSheetOpen} onClose={() => setIsGuideSheetOpen(false)} title="Your Manifestation Guide"
          themeConfig={themeConfig} darkMode={darkMode} inlineClassName="rounded-3xl border p-5 sm:p-6 space-y-5">
          <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold flex items-center gap-2"><Wand2 size={19} /> Guided writing</h2>
            <button onClick={() => setGuideOpen(!guideOpen)} aria-expanded={guideOpen} aria-controls="manifest-guide" className="text-xs underline">{guideOpen ? 'Hide' : 'Show'}</button>
          </div>
          <div className="rounded-xl bg-violet-50 text-violet-900 p-3 text-xs leading-relaxed">
            <strong>AI guide · frontend preview</strong><br />Try the guided flow with local writing templates. Personalized AI guidance will be connected in the backend phase.
          </div>
          {guideOpen && <div id="manifest-guide" className="space-y-4">
            <label className="block text-xs font-semibold">What are you inviting in?
              <input className={`${inputClass} mt-2`} value={draft.intention} onChange={(event) => updateDraft({ intention: event.target.value })} maxLength={180} placeholder="A creative career that feels like me" />
            </label>
            <label className="block text-xs font-semibold">How would you like to feel?
              <input className={`${inputClass} mt-2`} value={draft.feeling} onChange={(event) => updateDraft({ feeling: event.target.value })} maxLength={180} placeholder="Confident, supported, and curious" />
            </label>
            <label className="block text-xs font-semibold">One small action you can take
              <input className={`${inputClass} mt-2`} value={draft.action} onChange={(event) => updateDraft({ action: event.target.value })} maxLength={240} placeholder="Spend 20 minutes on my portfolio" />
            </label>
            <button type="button" onClick={buildGuide} className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-white text-sm font-semibold" style={{ backgroundColor: themeConfig.primary }}><Sparkles size={16} /> Create a guided draft</button>
          </div>}
          <p className="text-xs text-stone-500 dark:text-stone-300">A reflection practice, not a promise of outcomes. Pair your intentions with care and practical action.</p>
          </div>
        </ResponsiveSheet>
        <form onSubmit={saveEntry} className="space-y-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Writing method">
            {METHODS.map((method) => <button key={method.id} type="button" aria-pressed={draft.method === method.id}
              onClick={() => updateDraft({ method: method.id })} className="rounded-full border px-4 py-2 text-xs font-semibold"
              style={draft.method === method.id ? { backgroundColor: themeConfig.primary, borderColor: themeConfig.primary, color: '#fff' } : panelStyle}>{method.name}</button>)}
          </div>
          <div className={`rounded-3xl border p-4 sm:p-6 ${background.backgroundClass}`} style={{ backgroundImage: background.backgroundImage, borderColor: panelStyle.borderColor }}>
            <div className="rounded-2xl bg-white/90 dark:bg-stone-950/85 p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: darkMode ? '#d8bcff' : themeConfig.primary }}><Sparkles size={14} /> {activeMethod.name}</div>
              <label className="block text-xs font-semibold">My intention
                <input className={`${inputClass} mt-2 font-display text-lg`} value={draft.intention} onChange={(event) => updateDraft({ intention: event.target.value })} placeholder="Give your dream a name..." maxLength={180} required />
              </label>
              <p className="text-xs text-stone-500 dark:text-stone-300">{activeMethod.hint}</p>
              <label className="block text-xs font-semibold">My manifestation
                <textarea aria-label="My manifestation" className={`mt-2 w-full resize-y min-h-72 bg-transparent leading-relaxed text-2xl ${FONT_CONFIGS[draft.font].styleClass}`}
                  value={draft.text} onChange={(event) => updateDraft({ text: event.target.value })} placeholder="I am creating a life where..." maxLength={20000} required />
              </label>
              <div className="flex flex-wrap justify-between gap-2 text-[11px] text-stone-500 dark:text-stone-300">
                <span>{draft.text.trim() ? draft.text.trim().split(/\s+/).length : 0} words · {draft.text.length}/20,000 characters</span>
                <span>Draft stored on this device when browser storage is available</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border p-4 space-y-4" style={panelStyle}>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-xs font-semibold">Focus
                <select className={`${inputClass} mt-2`} value={draft.focus} onChange={(event) => updateDraft({ focus: event.target.value })}>
                  {['Personal growth', 'Love & connection', 'Career & creativity', 'Abundance', 'Well-being', 'Adventure'].map((focus) => <option key={focus}>{focus}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold">Writing font
                <select className={`${inputClass} mt-2`} value={draft.font} onChange={(event) => updateDraft({ font: event.target.value as FontChoice })}>
                  {Object.entries(FONT_CONFIGS).map(([id, font]) => <option key={id} value={id}>{font.name}</option>)}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Writing background">
              {SANCTUARY_BACKGROUNDS.map((item) => <button key={item.id} type="button" aria-pressed={draft.background === item.id}
                onClick={() => updateDraft({ background: item.id })} className="flex items-center gap-2 border rounded-full px-3 py-2 text-xs"
                style={{ borderColor: draft.background === item.id ? themeConfig.primary : panelStyle.borderColor }}>
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.previewColor }} />{item.label}{draft.background === item.id && <Check size={12} />}
              </button>)}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white" style={{ backgroundColor: themeConfig.primary }}><Bookmark size={16} /> Add to my box</button>
            <button type="button" onClick={downloadWriting} className="flex items-center gap-2 border rounded-full px-4 py-3 text-xs" style={panelStyle}><Download size={15} /> Download writing</button>
            <button type="button" onClick={() => {
              if (!draft.text.trim() || window.confirm('Start a fresh page? Your current draft will be cleared, but saved entries will stay.')) updateDraft({ ...EMPTY_DRAFT });
            }} className="rounded-full px-4 py-3 text-xs underline">Fresh page</button>
          </div>
        </form>
      </div>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-bold">My little universe <span className="text-sm font-body font-normal">({entries.length})</span></h2>
          <span className="text-xs text-stone-500 dark:text-stone-300">{entries.filter((entry) => entry.fulfilled).length} intentions celebrated</span>
        </div>
        {entries.length === 0 ? <div className="rounded-3xl border border-dashed p-8 text-center" style={{ borderColor: panelStyle.borderColor }}>
          <Sprout className="mx-auto mb-3" style={{ color: themeConfig.accent }} size={28} />
          <h3 className="font-display text-xl">Plant your first possibility.</h3><p className="mt-2 text-sm text-stone-500 dark:text-stone-300">Your saved manifestations will live here. Start small; make it yours.</p>
        </div> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => <article key={entry.id} className="rounded-2xl border p-5 space-y-3" style={panelStyle}>
            <div className="flex items-center justify-between gap-2"><span className="text-xs" style={{ color: darkMode ? '#d8bcff' : themeConfig.primary }}>{entry.focus}</span>
              <button type="button" aria-label={`Delete ${entry.intention}`} onClick={() => {
                if (window.confirm(`Delete "${entry.intention}" from your box?`)) setEntries((previous) => previous.filter((item) => item.id !== entry.id));
              }} className="p-2 rounded-full hover:bg-red-100 hover:text-red-800"><Trash2 size={14} /></button>
            </div>
            <h3 className="font-display font-bold text-lg break-words">{entry.intention}</h3>
            <p className={`line-clamp-4 whitespace-pre-line break-words text-lg ${FONT_CONFIGS[entry.font].styleClass}`}>{entry.text}</p>
            <div className="text-[11px] text-stone-500 dark:text-stone-300">{new Date(entry.createdAt).toLocaleDateString()} · {METHODS.find((method) => method.id === entry.method)?.name}</div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="button" onClick={() => {
                if (!draft.text.trim() || window.confirm('Open this saved entry? Your current draft will be replaced.')) updateDraft(entry);
              }} className="flex items-center gap-1 text-xs font-semibold underline">Open writing <ArrowUpRight size={13} /></button>
              <button type="button" aria-pressed={entry.fulfilled} onClick={() => setEntries((previous) => previous.map((item) => item.id === entry.id ? { ...item, fulfilled: !item.fulfilled } : item))}
                className="flex items-center gap-1 text-xs rounded-full px-3 py-1.5 bg-green-100 text-green-900"><Check size={12} />{entry.fulfilled ? 'Celebrated!' : 'Celebrate progress'}</button>
            </div>
          </article>)}
        </div>}
      </section>
    </div>
  );
}
