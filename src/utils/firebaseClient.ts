import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { originalFirebaseConfig } from './firebaseConfig';

const env = import.meta.env as Record<string, string | undefined>;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || originalFirebaseConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || originalFirebaseConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || originalFirebaseConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || originalFirebaseConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || originalFirebaseConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || originalFirebaseConfig.appId
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
export const firebaseApp = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
export const firestore = firebase.firestore(firebaseApp);
export type FirestoreDocument = Record<string, any> & { id: string };
