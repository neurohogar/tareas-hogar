import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

/** Lo único que la UI necesita del usuario de Firebase Auth. */
export interface User {
	uid: string;
}

export function observeUser(onChange: (user: User | null) => void): () => void {
	return onAuthStateChanged(auth, (user) => onChange(user && { uid: user.uid }));
}

export async function signInWithGoogle(): Promise<void> {
	await signInWithPopup(auth, new GoogleAuthProvider());
}
