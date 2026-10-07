import test from 'node:test';
import assert from 'node:assert/strict';
import { CloudSync, cloudQueueKey, type CloudAdapter, type SyncStatus } from './cloudSync';
import { emptyCloudSnapshot, overlayMutations, parseCloudProfile, parseCloudQuote, validateMutation, type CloudMutation } from './cloudContracts';
import { EMPTY_DRAFT } from './manifestationStore';
import { DEFAULT_PREFERENCES, loadLocalPreferences, loadSavedQuoteIds, saveLocalPreferences, saveSavedQuoteIds, saveLocalQuotes, saveLikedQuoteIds, saveLocalFeedbacks, scopedStorageKey } from './quoteStore';

const quote = {
  id: 'quote-test', text: 'Make room for the dreams you are becoming brave enough to name.', authorName: 'Clara',
  category: 'growth' as const, visualStyle: 'Aurora Bloom', fontFamily: 'fraunces' as const,
  backgroundStyle: 'aurora-bloom' as const, accentColor: '#6940b5', likesCount: 0, createdAt: '2026-10-07T09:00:00.000Z',
};
function storage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}
function harness() {
  const cache = storage();
  let remote = emptyCloudSnapshot('Clara');
  let online = true, owner = true, fail = false;
  const statuses: SyncStatus[] = [];
  const writes: CloudMutation[] = [];
  const adapter: CloudAdapter = {
    load: async () => structuredClone(remote),
    apply: async (mutation) => {
      if (fail) throw new Error('Unavailable');
      writes.push(mutation);
      remote = overlayMutations(remote, [mutation]);
    },
  };
  const options = { userId: 'alice', storage: cache, adapter, isOnline: () => online, isCurrentUser: () => owner, onStatus: (value: SyncStatus) => statuses.push(value), onHydrate: () => {} };
  const sync = new CloudSync(options);
  return { sync, options, cache, writes, statuses, remote: () => remote, setOnline: (value: boolean) => { online = value; }, setOwner: (value: boolean) => { owner = value; }, setFail: (value: boolean) => { fail = value; } };
}

test('offline mutations survive a new session and remain account-scoped', async () => {
  const h = harness();
  try {
    h.setOnline(false);
    h.sync.enqueue({ kind: 'saved', id: quote.id, value: quote });
    await h.sync.sync();
    assert.equal(h.writes.length, 0);
    assert.equal(h.statuses.at(-1)?.state, 'offline');
    assert.equal(h.cache.getItem(cloudQueueKey('bob')), null);
    h.sync.stop();
    h.setOnline(true);
    const reloaded = new CloudSync(h.options);
    try {
      await reloaded.sync();
      assert.deepEqual(h.remote().savedIds, [quote.id]);
      assert.equal(h.statuses.at(-1)?.state, 'synced');
      assert.equal(h.cache.getItem(cloudQueueKey('alice')), '[]');
    } finally { reloaded.stop(); }
  } finally { h.sync.stop(); }
});

test('profile preference patches coalesce without resetting unrelated preferences', async () => {
  const h = harness();
  try {
    h.sync.enqueue({ kind: 'profile', preferences: { themeColor: 'ocean-daydream' } });
    h.sync.enqueue({ kind: 'profile', preferences: { fontChoice: 'hand' } });
    await h.sync.sync();
    assert.equal(h.writes.length, 1);
    assert.equal(h.remote().preferences.themeColor, 'ocean-daydream');
    assert.equal(h.remote().preferences.fontChoice, 'hand');
    assert.equal(h.remote().preferences.notificationTime, '09:00');
  } finally { h.sync.stop(); }
});

test('failed writes are retained, are not reported as synced, and succeed on retry', async () => {
  const h = harness();
  try {
    h.setFail(true);
    h.sync.enqueue({ kind: 'quote', id: quote.id, value: quote });
    await h.sync.sync();
    assert.equal(h.statuses.at(-1)?.state, 'error');
    assert.equal(h.statuses.at(-1)?.pending, 1);
    assert.match(h.cache.getItem(cloudQueueKey('alice')) || '', /quote-test/);
    h.setFail(false);
    await h.sync.sync();
    assert.equal(h.statuses.at(-1)?.state, 'synced');
  } finally { h.sync.stop(); }
});

test('switching accounts stops processing the previous account queue', async () => {
  const h = harness();
  try {
    h.sync.enqueue({ kind: 'saved', id: quote.id, value: quote });
    h.setOwner(false);
    await h.sync.sync();
    assert.equal(h.writes.length, 0);
    assert.throws(() => h.sync.enqueue({ kind: 'draft', value: EMPTY_DRAFT }), /account changed/);
    assert.match(h.cache.getItem(cloudQueueKey('alice')) || '', /quote-test/);
  } finally { h.sync.stop(); }
});

test('edits made during an in-flight write are not discarded by its acknowledgement', async () => {
  const h = harness();
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const originalApply = h.options.adapter.apply;
  let entered = false;
  h.options.adapter.apply = async (mutation) => {
    if (!entered) { entered = true; await gate; }
    await originalApply(mutation);
  };
  try {
    h.sync.enqueue({ kind: 'draft', value: { ...EMPTY_DRAFT, text: 'First draft' } });
    const running = h.sync.sync();
    while (!entered) await new Promise((resolve) => setTimeout(resolve, 1));
    h.sync.enqueue({ kind: 'draft', value: { ...EMPTY_DRAFT, text: 'Latest draft' } });
    release();
    await running;
    assert.equal(h.remote().box.draft.text, 'Latest draft');
    assert.equal(h.writes.length, 2);
    assert.equal(h.cache.getItem(cloudQueueKey('alice')), '[]');
  } finally { release(); h.sync.stop(); }
});

test('deletes survive offline reload and remove only the selected entry', async () => {
  const h = harness();
  const entry = { ...EMPTY_DRAFT, id: 'manifest-test', createdAt: '2026-10-07T09:00:00.000Z', fulfilled: false };
  try {
    h.sync.enqueue({ kind: 'manifestation', id: entry.id, value: entry });
    await h.sync.sync();
    h.setOnline(false);
    h.sync.enqueue({ kind: 'manifestation', id: entry.id, value: null });
    h.sync.stop();
    h.setOnline(true);
    const reloaded = new CloudSync(h.options);
    try { await reloaded.sync(); assert.equal(h.remote().box.entries.length, 0); } finally { reloaded.stop(); }
  } finally { h.sync.stop(); }
});

test('invalid journals and storage failures preserve existing pending data', () => {
  const cache = storage();
  cache.setItem(cloudQueueKey('alice'), '{invalid');
  const h = harness();
  try {
    assert.throws(() => new CloudSync({ ...h.options, storage: cache }));
    assert.equal(cache.getItem(cloudQueueKey('alice')), '{invalid');
    const blocked = new CloudSync({ ...h.options, storage: { getItem: () => null, setItem: () => { throw new Error('Storage full'); } } });
    try { assert.throws(() => blocked.enqueue({ kind: 'saved', id: quote.id, value: quote }), /could not persist/); } finally { blocked.stop(); }
  } finally { h.sync.stop(); }
});

test('a batch validates every change before altering the durable journal', () => {
  const h = harness();
  try {
    h.sync.enqueue({ kind: 'saved', id: quote.id, value: quote });
    const before = h.cache.getItem(cloudQueueKey('alice'));
    assert.throws(() => h.sync.enqueueBatch([
      { kind: 'draft', value: { ...EMPTY_DRAFT, text: 'New writing' } },
      { kind: 'saved', id: 'wrong-id', value: quote },
    ]));
    assert.equal(h.cache.getItem(cloudQueueKey('alice')), before);
  } finally { h.sync.stop(); }
});

test('quota failures retain the latest draft in memory and recover without server hydration overwriting it', async () => {
  const h = harness();
  let blocked = true, reads = 0;
  const sync = new CloudSync({
    ...h.options,
    storage: {
      getItem: h.cache.getItem,
      setItem: (key, value) => { if (blocked) throw new Error('Storage full'); h.cache.setItem(key, value); },
    },
    adapter: { ...h.options.adapter, load: async () => { reads++; return h.options.adapter.load(); } },
  });
  try {
    assert.throws(() => sync.enqueue({ kind: 'draft', value: { ...EMPTY_DRAFT, text: 'Keep my latest writing' } }), /could not persist/);
    await sync.sync();
    assert.equal(reads, 0);
    assert.equal(h.statuses.at(-1)?.state, 'error');
    assert.equal(h.statuses.at(-1)?.pending, 1);
    h.setOnline(false);
    await sync.sync();
    assert.equal(h.statuses.at(-1)?.state, 'error');
    blocked = false;
    h.setOnline(true);
    await sync.sync();
    assert.equal(h.remote().box.draft.text, 'Keep my latest writing');
    assert.equal(h.statuses.at(-1)?.state, 'synced');
  } finally { sync.stop(); h.sync.stop(); }
});

test('all quote and preference writers propagate unavailable device storage', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    value: { setItem: () => { throw new Error('Storage full'); } }, configurable: true,
  });
  try {
    for (const write of [
      () => saveLocalPreferences(DEFAULT_PREFERENCES),
      () => saveSavedQuoteIds([quote.id]),
      () => saveLocalQuotes([quote]),
      () => saveLikedQuoteIds([quote.id]),
      () => saveLocalFeedbacks({}),
    ]) assert.throws(write, /Storage full/);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

test('cloud shapes normalize legacy profiles and reject mismatched or oversized writing', () => {
  const profile = parseCloudProfile({ uid: 'alice', displayName: 'Clara', ...DEFAULT_PREFERENCES, createdAt: '2026-10-07T09:00:00.000Z' });
  assert.equal(profile.profile.bio, '');
  assert.equal(profile.preferences.themeColor, 'lavender-pop');
  assert.deepEqual(parseCloudQuote({ ...quote, notes: '', vibeBadge: '', userLiked: true }), { ...quote, highlightWords: [] });
  assert.throws(() => validateMutation({ kind: 'saved', id: 'wrong', value: quote }));
  assert.throws(() => validateMutation({ kind: 'draft', value: { ...EMPTY_DRAFT, text: 'x'.repeat(100001) } }));
  assert.throws(() => validateMutation({ kind: 'profile', preferences: { darkMode: 'true' } }));
  const reopened = validateMutation({ kind: 'draft', value: {
    ...EMPTY_DRAFT, id: 'opened-entry', createdAt: '2026-10-07T09:00:00.000Z', fulfilled: true,
  } });
  assert.equal(reopened.kind, 'draft');
  if (reopened.kind === 'draft') {
    assert.equal(Object.keys(reopened.value).length, 8);
    assert.equal('id' in reopened.value, false);
  }
});

test('guest preferences and bookmarks are never inherited by a different account', () => {
  const cache = storage();
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { value: cache, configurable: true });
  try {
    saveLocalPreferences({ ...DEFAULT_PREFERENCES, themeColor: 'sunshine-club' });
    saveSavedQuoteIds(['guest-quote']);
    saveLocalPreferences({ ...DEFAULT_PREFERENCES, themeColor: 'ocean-daydream' }, 'alice');
    assert.deepEqual(loadSavedQuoteIds('alice'), []);
    assert.equal(loadLocalPreferences('alice').themeColor, 'ocean-daydream');
    assert.equal(loadLocalPreferences('bob').themeColor, 'lavender-pop');
    assert.equal(loadLocalPreferences().themeColor, 'sunshine-club');
    assert.notEqual(scopedStorageKey('scriber_saved_ids_v1', 'guest'), scopedStorageKey('scriber_saved_ids_v1', null));
    cache.setItem('scriber_saved_ids_v1', '{broken');
    assert.throws(() => loadSavedQuoteIds(null, true), /Guest bookmarks could not be restored/);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
