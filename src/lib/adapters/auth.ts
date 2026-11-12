import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { auth } from './firebase';

/** Lo único que la UI necesita del usuario de Firebase Auth. */
export interface Usuario {
	uid: string;
}

export function observarUsuario(alCambiar: (usuario: Usuario | null) => void): () => void {
	return onAuthStateChanged(auth, (usuario) => alCambiar(usuario && { uid: usuario.uid }));
}

export async function entrarConGoogle(): Promise<void> {
	await signInWithPopup(auth, new GoogleAuthProvider());
}
