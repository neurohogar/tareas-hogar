import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

/** The only thing the UI needs from the Firebase Auth user. */
export interface User {
	uid: string;
}

export function observeUser(onChange: (user: User | null) => void): () => void {
	return onAuthStateChanged(auth, (user) => onChange(user && { uid: user.uid }));
}

export async function signInWithGoogle(): Promise<void> {
	await signInWithPopup(auth, new GoogleAuthProvider());
}
