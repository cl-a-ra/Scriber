import { before, beforeEach, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, collection, getDoc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, getDocFromServer } from 'firebase/firestore';
import { createFirebaseCloud } from '../lib/firebaseCloud';
import { DEFAULT_PREFERENCES } from '../lib/preferences';
import { EMPTY_DRAFT } from '../lib/manifestationStore';
import type { QuoteItem } from '../types/quote';

let environment: RulesTestEnvironment;
const profile = {
  uid: 'alice', email: 'alice@example.test', displayName: 'Alice', bio: 'Growing with intention.',
  photoData: null, useAccountPhoto: true, preferences: DEFAULT_PREFERENCES,
  createdAt: '2026-10-07T09:00:00.000Z', updatedAt: '2026-10-07T09:00:00.000Z',
};
const quote: QuoteItem = {
  id: 'quote-test', userId: 'alice', text: 'Make room for a bright new chapter.', authorName: 'Alice',
  category: 'growth', visualStyle: 'Aurora Bloom', fontFamily: 'fraunces',
  backgroundStyle: 'aurora-bloom', accentColor: '#6940b5', likesCount: 0,
  createdAt: '2026-10-07T09:00:00.000Z', highlightWords: ['bright', 'chapter'], vibeBadge: 'New Beginnings',
  notes: 'Keep the spacious layout.', sixHourCycle: 'morning-cycle',
};
const entry = { ...EMPTY_DRAFT, text: 'I choose a kind and practical next step.', id: 'entry-test', createdAt: '2026-10-07T09:00:00.000Z', fulfilled: false };
before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-scriber',
    firestore: { host: '127.0.0.1', port: 8080, rules: await readFile('firestore.rules', 'utf8') },
  });
});
beforeEach(async () => { await environment.clearFirestore(); });
after(async () => { await environment?.cleanup(); });
const alice = () => environment.authenticatedContext('alice', { email: 'alice@example.test' }).firestore();
const bob = () => environment.authenticatedContext('bob', { email: 'bob@example.test' }).firestore();

test('owner can create, read and update a private profile without changing createdAt', async () => {
  const db = alice();
  const reference = doc(db, 'users', 'alice');
  await assertSucceeds(setDoc(reference, profile));
  await assertSucceeds(updateDoc(reference, { bio: 'A new chapter.', preferences: { ...DEFAULT_PREFERENCES, themeColor: 'sunshine-club' } }));
  assert.equal((await getDoc(reference)).data()?.bio, 'A new chapter.');
  await assertFails(updateDoc(reference, { createdAt: '2026-10-08T09:00:00.000Z' }));
  await assertFails(updateDoc(reference, { uid: 'bob' }));
  await assertFails(getDoc(doc(bob(), 'users', 'alice')));
  await assertFails(getDocs(collection(db, 'users')));
});

test('private quotes, bookmarks, drafts and manifestations deny other accounts and guests', async () => {
  for (const [path, value] of [['quotes', quote], ['saved_quotes', quote], ['manifestations', entry], ['manifestation_drafts', EMPTY_DRAFT]] as const) {
    const id = path === 'manifestation_drafts' ? 'current' : path === 'manifestations' ? entry.id : quote.id;
    const own = doc(alice(), 'users', 'alice', path, id);
    await assertSucceeds(setDoc(own, value));
    await assertSucceeds(getDoc(own));
    await assertSucceeds(getDocs(collection(alice(), 'users', 'alice', path)));
    await assertFails(getDoc(doc(bob(), 'users', 'alice', path, id)));
    await assertFails(getDocs(collection(bob(), 'users', 'alice', path)));
    await assertFails(setDoc(doc(bob(), 'users', 'alice', path, id), value));
    await assertFails(deleteDoc(doc(bob(), 'users', 'alice', path, id)));
    await assertFails(getDoc(doc(environment.unauthenticatedContext().firestore(), 'users', 'alice', path, id)));
  }
});

test('saved quote schema supports all fifteen metadata fields and enforces ownership and id', async () => {
  const reference = doc(alice(), 'users', 'alice', 'saved_quotes', quote.id);
  await assertSucceeds(setDoc(reference, quote));
  assert.equal(Object.keys((await getDoc(reference)).data() || {}).length, 15);
  await assertFails(setDoc(reference, { ...quote, userId: 'bob' }));
  await assertFails(setDoc(reference, { ...quote, id: 'another-quote' }));
  await assertFails(setDoc(reference, { ...quote, text: 'x'.repeat(1001) }));
});

test('draft and saved entry updates, fulfillment and deletion remain private', async () => {
  const reference = doc(alice(), 'users', 'alice', 'manifestations', entry.id);
  await assertSucceeds(setDoc(reference, entry));
  await assertSucceeds(updateDoc(reference, { fulfilled: true }));
  assert.equal((await getDoc(reference)).data()?.fulfilled, true);
  await assertFails(updateDoc(reference, { text: 'x'.repeat(100001) }));
  await assertFails(updateDoc(reference, { method: 'unknown' }));
  await assertFails(setDoc(doc(alice(), 'users', 'alice', 'manifestation_drafts', 'another-draft'), EMPTY_DRAFT));
  await assertSucceeds(deleteDoc(reference));
});

test('invalid profile photos, preferences and oversized bios are rejected', async () => {
  const reference = doc(alice(), 'users', 'alice');
  await assertFails(setDoc(reference, { ...profile, bio: 'x'.repeat(281) }));
  await assertFails(setDoc(reference, { ...profile, photoData: 'https://example.test/photo' }));
  await assertFails(setDoc(reference, { ...profile, photoData: 'data:image/svg+xml;base64,AAAA' }));
  await assertFails(setDoc(reference, { ...profile, preferences: { ...DEFAULT_PREFERENCES, notificationTime: '25:99' } }));
  await assertSucceeds(setDoc(reference, { ...profile, photoData: 'data:image/jpeg;base64,AAAA' }));
});

test('legacy profile migration preserves immutable creation metadata', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users', 'alice'), {
      uid: 'alice', displayName: 'Alice', email: profile.email, themeColor: 'lavender-pop',
      fontChoice: 'fraunces', darkMode: false, createdAt: profile.createdAt, updatedAt: profile.updatedAt,
    });
  });
  await assertSucceeds(setDoc(doc(alice(), 'users', 'alice'), profile));
  assert.equal((await getDoc(doc(alice(), 'users', 'alice'))).data()?.createdAt, profile.createdAt);
});

test('Google emulator sign-in and the real cloud adapter round-trip data across devices', async () => {
      const apps: ReturnType<typeof initializeApp>[] = [];
      const connect = async (subject: string, instance: string) => {
        const app = initializeApp({ apiKey: 'demo-scriber-key', projectId: 'demo-scriber', authDomain: 'demo-scriber.firebaseapp.com' }, instance);
        apps.push(app);
        const auth = getAuth(app);
        const db = getFirestore(app);
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
        const now = Math.floor(Date.now() / 1000);
        const token = `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({
          iss: 'https://accounts.google.com', aud: 'demo-scriber-key', sub: subject, iat: now, exp: now + 3600,
          email: `${subject}@example.test`, email_verified: true, name: subject,
        })).toString('base64url')}.`;
        const result = await signInWithCredential(auth, GoogleAuthProvider.credential(token));
        assert.ok(result.user.providerData.some((provider) => provider.providerId === 'google.com'));
        const cloud = createFirebaseCloud(result.user, { displayName: subject, bio: '', photoData: null, useAccountPhoto: true }, { auth, db });
        return { auth, db, user: result.user, cloud };
      };
      try {
        const first = await connect('google-alice', 'first-device');
        const ownProfile = { displayName: 'Alice Muse', bio: 'A private new chapter.', photoData: 'data:image/jpeg;base64,AAAA', useAccountPhoto: false };
        await first.cloud.apply({ kind: 'profile', profile: ownProfile, preferences: { themeColor: 'ocean-daydream', fontChoice: 'hand' } });
        const createdAt = (await getDocFromServer(doc(first.db, 'users', first.user.uid))).data()?.createdAt;
        await first.cloud.apply({ kind: 'profile', preferences: { darkMode: true } });
        assert.equal((await getDocFromServer(doc(first.db, 'users', first.user.uid))).data()?.createdAt, createdAt);
        await first.cloud.apply({ kind: 'quote', id: quote.id, value: quote });
        await first.cloud.apply({ kind: 'saved', id: quote.id, value: quote });
        await first.cloud.apply({ kind: 'draft', value: { ...EMPTY_DRAFT, intention: 'Creative work', text: 'A grounded next step.' } });
        await first.cloud.apply({ kind: 'manifestation', id: entry.id, value: entry });
        const second = await connect('google-alice', 'second-device');
        assert.equal(second.user.uid, first.user.uid);
        const restored = await second.cloud.load();
        assert.deepEqual(restored.profile, ownProfile);
        assert.equal(restored.preferences.darkMode, true);
        assert.equal(restored.preferences.fontChoice, 'hand');
        assert.deepEqual(restored.savedIds, [quote.id]);
        assert.equal(restored.quotes[0].notes, quote.notes);
        assert.equal(restored.box.draft.text, 'A grounded next step.');
        assert.equal(restored.box.entries.length, 1);
        await second.cloud.apply({ kind: 'manifestation', id: entry.id, value: { ...entry, fulfilled: true } });
        assert.equal((await first.cloud.load()).box.entries[0].fulfilled, true);
        const other = await connect('google-bob', 'other-account');
        await assertFails(getDocFromServer(doc(other.db, 'users', first.user.uid)));
        assert.equal((await other.cloud.load()).quotes.length, 0);
        await second.cloud.apply({ kind: 'saved', id: quote.id, value: null });
        await second.cloud.apply({ kind: 'manifestation', id: entry.id, value: null });
        assert.equal((await first.cloud.load()).savedIds.length, 0);
        assert.equal((await first.cloud.load()).box.entries.length, 0);
        await signOut(first.auth);
        await assert.rejects(first.cloud.load(), /account changed/);
      } finally { await Promise.all(apps.map((app) => deleteApp(app))); }
});
