import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

const env = import.meta.env as Record<string, string | undefined>;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
export const firebaseApp = firebaseConfigured
  ? (firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig))
  : (null as any);
export const firestore = firebaseConfigured && firebaseApp ? firebase.firestore(firebaseApp) : (null as any);
export type FirestoreDocument = Record<string, any> & { id: string };
