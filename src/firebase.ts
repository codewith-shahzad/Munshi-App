import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  persistentSingleTabManager,
  Firestore 
} from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Target provisioned database ID if provided, otherwise default
const databaseId = firebaseConfigJson.firestoreDatabaseId || '(default)';

let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    }),
    experimentalAutoDetectLongPolling: true
  }, databaseId);
} catch {
  try {
    firestoreInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager({})
      }),
      experimentalAutoDetectLongPolling: true
    }, databaseId);
  } catch {
    firestoreInstance = getFirestore(app, databaseId);
  }
}

export const db: Firestore = firestoreInstance;
export const auth = getAuth(app);

// Auto-sign-in anonymously to establish valid auth session
signInAnonymously(auth).catch((err) => {
  console.warn('Anonymous auth initialized in offline/anonymous mode:', err?.message || err);
});

export const currentProjectId = firebaseConfigJson.projectId;
export const currentDatabaseId = databaseId;


