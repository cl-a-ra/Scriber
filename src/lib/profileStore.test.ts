import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLocalProfile, profileStorageKey, saveLocalProfile, validateProfile, MAX_PROFILE_PHOTO_LENGTH } from './profileStore';
import { getGreeting, getGreetingName } from './greeting';

const profile = { displayName: 'Clara Muse', bio: 'Dreaming in color.', photoData: null, useAccountPhoto: false };
function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}

test('local profiles persist and trim name and bio', () => {
  const storage = memoryStorage();
  saveLocalProfile(null, { ...profile, displayName: ' Clara Muse ', bio: ' Dreaming in color. ' }, storage);
  assert.deepEqual(loadLocalProfile(null, 'Guest', storage), { profile, error: '' });
});

test('guest and account profiles never share storage', () => {
  const storage = memoryStorage();
  saveLocalProfile(null, profile, storage);
  saveLocalProfile('alice', { ...profile, displayName: 'Alice' }, storage);
  assert.equal(loadLocalProfile('alice', 'Google Alice', storage).profile.displayName, 'Alice');
  assert.equal(loadLocalProfile('bob', 'Google Bob', storage).profile.displayName, 'Google Bob');
  assert.equal(loadLocalProfile(null, 'Guest', storage).profile.displayName, 'Clara Muse');
  assert.notEqual(profileStorageKey(null), profileStorageKey('guest'));
});

test('corrupt stored profiles are reported and never overwritten on load', () => {
  const storage = memoryStorage();
  storage.setItem(profileStorageKey(null), '{invalid');
  const loaded = loadLocalProfile(null, 'Guest', storage);
  assert.match(loaded.error, /could not be loaded/);
  assert.equal(storage.getItem(profileStorageKey(null)), '{invalid');
});

test('profile validation enforces exact field and image limits', () => {
  assert.throws(() => validateProfile({ ...profile, displayName: '  ' }));
  assert.throws(() => validateProfile({ ...profile, displayName: 'x'.repeat(101) }));
  assert.throws(() => validateProfile({ ...profile, bio: 'x'.repeat(281) }));
  assert.throws(() => validateProfile({ ...profile, useAccountPhoto: 'true' }));
  assert.throws(() => validateProfile({ ...profile, photoData: 'https://example.com/photo' }));
  assert.throws(() => validateProfile({ ...profile, photoData: 'data:image/svg+xml;base64,AAAA' }));
  assert.throws(() => validateProfile({ ...profile, photoData: `data:image/jpeg;base64,${'A'.repeat(MAX_PROFILE_PHOTO_LENGTH)}` }));
  assert.doesNotThrow(() => validateProfile({ ...profile, displayName: 'x'.repeat(100), bio: 'x'.repeat(280), photoData: 'data:image/jpeg;base64,AAAA' }));
});

test('unavailable storage propagates save failure without reporting success', () => {
  const storage = { getItem: () => null, setItem: () => { throw new Error('Storage unavailable'); } };
  assert.throws(() => saveLocalProfile(null, profile, storage), /Storage unavailable/);
});

test('greetings use local time and change at noon and 5 pm', () => {
  for (const [hour, expected] of [[0, 'Good morning'], [11, 'Good morning'], [12, 'Good afternoon'], [16, 'Good afternoon'], [17, 'Good evening'], [23, 'Good evening']] as const) {
    assert.equal(getGreeting(new Date(2026, 0, 1, hour, 59)), expected);
  }
  assert.equal(getGreetingName('  Clara Muse '), 'Clara');
  assert.equal(getGreetingName('Scriber Muse'), 'dreamer');
  assert.equal(getGreetingName(''), 'dreamer');
});
