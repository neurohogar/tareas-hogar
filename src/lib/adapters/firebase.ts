// Firebase initialization. In development and in QA mode it connects to the
// Firebase Emulator Suite (project demo-tareas-hogar, no real project).
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import {
	connectFirestoreEmulator,
	initializeFirestore,
	persistentLocalCache,
	persistentMultipleTabManager
} from 'firebase/firestore';

const env = import.meta.env;

const app = initializeApp({
	apiKey: env.VITE_FIREBASE_API_KEY ?? 'demo-api-key',
	authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? 'demo-tareas-hogar.firebaseapp.com',
	projectId: env.VITE_FIREBASE_PROJECT_ID ?? 'demo-tareas-hogar',
	appId: env.VITE_FIREBASE_APP_ID ?? 'demo-app-id'
});

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
	localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

const usesEmulators = env.DEV || env.MODE === 'qa';
if (usesEmulators) {
	connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
	connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
