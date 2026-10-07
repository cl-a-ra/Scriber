import { collection, deleteDoc, doc, getDocFromServer, getDocsFromServer, runTransaction, setDoc, type Firestore } from 'firebase/firestore';
import type { Auth, User } from 'firebase/auth';
import { emptyCloudSnapshot, parseCloudProfile, parseCloudQuote, parsePreferences, validateMutation, type CloudSnapshot } from './cloudContracts';
import type { CloudAdapter } from './cloudSync';
import { isManifestationDraft, isManifestationEntry } from './manifestationStore';
import type { LocalProfile } from './profileStore';

export function createFirebaseCloud(user: User, deviceProfile: LocalProfile, connection: { auth: Auth; db: Firestore }): CloudAdapter {
  const { auth, db } = connection;
  const root = doc(db, 'users', user.uid);
  const assertOwner = () => {
    if (auth.currentUser?.uid !== user.uid) throw new Error('Your account changed during cloud sync.');
  };
  return {
    async load() {
      assertOwner();
      const [profileDoc, quotesDocs, savedDocs, entriesDocs, draftDoc] = await Promise.all([
        getDocFromServer(root), getDocsFromServer(collection(root, 'quotes')), getDocsFromServer(collection(root, 'saved_quotes')),
        getDocsFromServer(collection(root, 'manifestations')), getDocFromServer(doc(root, 'manifestation_drafts', 'current')),
      ]);
      assertOwner();
      const snapshot: CloudSnapshot = emptyCloudSnapshot(user.displayName?.trim().slice(0, 100) || 'Scriber Muse');
      if (profileDoc.exists()) {
        if (profileDoc.data().uid !== user.uid) throw new Error('Invalid private profile owner.');
        Object.assign(snapshot, parseCloudProfile(profileDoc.data()));
      }
      snapshot.profileIsLegacy = !profileDoc.exists() || profileDoc.data().bio === undefined;
      if (snapshot.profileIsLegacy) snapshot.profile = deviceProfile;
      const quotes = new Map<string, ReturnType<typeof parseCloudQuote>>();
      for (const document of [...quotesDocs.docs, ...savedDocs.docs]) {
        const quote = parseCloudQuote(document.data());
        if (quote.id !== document.id || quote.userId !== user.uid) throw new Error('Invalid private quote document.');
        quotes.set(quote.id, quote);
      }
      snapshot.quotes = [...quotes.values()];
      snapshot.savedIds = savedDocs.docs.map((document) => document.id);
      snapshot.box.entries = entriesDocs.docs.map((document) => {
        const value: unknown = document.data();
        if (!isManifestationEntry(value) || value.id !== document.id) throw new Error('Invalid private manifestation.');
        return value;
      }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      if (draftDoc.exists()) {
        const value: unknown = draftDoc.data();
        if (!isManifestationDraft(value)) throw new Error('Invalid private draft.');
        snapshot.box.draft = value;
      }
      return snapshot;
    },
    async apply(value) {
      const mutation = validateMutation(value);
      assertOwner();
      if (mutation.kind === 'profile') {
        await runTransaction(db, async (transaction) => {
          const document = await transaction.get(root);
          assertOwner();
          const existing = document.exists() ? parseCloudProfile(document.data()) : emptyCloudSnapshot(user.displayName?.trim().slice(0, 100) || 'Scriber Muse');
          const preferences = parsePreferences({ ...existing.preferences, ...mutation.preferences });
          const now = new Date().toISOString();
          transaction.set(root, {
            uid: user.uid, email: user.email || '', ...(mutation.profile ?? existing.profile), preferences,
            createdAt: 'createdAt' in existing ? existing.createdAt : now, updatedAt: now,
          });
        });
      } else if (mutation.kind === 'draft') {
        await setDoc(doc(root, 'manifestation_drafts', 'current'), mutation.value);
      } else {
        const path = mutation.kind === 'quote' ? 'quotes' : mutation.kind === 'saved' ? 'saved_quotes' : 'manifestations';
        const reference = doc(root, path, mutation.id);
        if (mutation.value === null) await deleteDoc(reference);
        else await setDoc(reference, mutation.kind === 'manifestation' ? mutation.value : { ...mutation.value, userId: user.uid });
      }
    },
  };
}
