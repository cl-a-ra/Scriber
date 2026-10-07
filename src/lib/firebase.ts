import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  getFirestore,
  persistentLocalCache, 
  persistentMultipleTabManager,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged, 
  connectAuthEmulator,
  type User 
} from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';
import { usingFirebaseEmulators } from './firebaseEnvironment';

export { usingFirebaseEmulators } from './firebaseEnvironment';
const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
  ...(usingFirebaseEmulators ? { projectId: 'demo-scriber', apiKey: 'demo-scriber-key', authDomain: 'demo-scriber.firebaseapp.com' } : {}),
};

const alreadyInitialized = getApps().length > 0;
const app = alreadyInitialized ? getApp() : initializeApp(firebaseConfig);
const databaseId = usingFirebaseEmulators ? '(default)' : firebaseConfigData.firestoreDatabaseId || '(default)';

// Initialize Firestore with offline persistence support and designated databaseId
export const db = alreadyInitialized ? getFirestore(app, databaseId) : initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, databaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
if (usingFirebaseEmulators) {
  if (!auth.emulatorConfig) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  if (!alreadyInitialized) connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

export { 
  signInWithPopup, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  type User 
};
