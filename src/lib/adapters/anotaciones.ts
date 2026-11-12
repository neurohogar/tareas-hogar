// Traduce entre la anotación del core y Firestore (spec §7):
// users/{uid}/anotaciones/{anotacionId}.
import { collection, deleteDoc, deleteField, doc, FirestoreError, getDocFromServer, onSnapshot, setDoc, Timestamp, updateDoc, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import type { Anotacion, PantallaDeAnotacion, Sentido } from '#lib/core/anotacion.ts';
import { normalizarTextoDeAnotacion } from '#lib/core/anotacion.ts';
import { db } from './firebase';

interface AnotacionDoc {
	sentido: Sentido;
	anotadaEn: Timestamp;
	pantalla: PantallaDeAnotacion;
	/** Sin el campo, la anotación no tiene tarea. */
	tareaId?: string;
	/** Sin el campo, la anotación no tiene texto. */
	texto?: string;
}

const anotacionRef = (uid: string, anotacionId: string) => doc(db, 'users', uid, 'anotaciones', anotacionId);
const tareaRef = (uid: string, tareaId: string) => doc(db, 'users', uid, 'tareas', tareaId);

function anotacionADoc({ sentido, anotadaEn, pantalla, tareaId, texto }: Anotacion): AnotacionDoc {
	return {
		sentido,
		anotadaEn: Timestamp.fromDate(anotadaEn),
		pantalla,
		...(tareaId !== undefined && { tareaId }),
		...(texto !== undefined && { texto })
	};
}

function anotacionDesde(snapshot: QueryDocumentSnapshot<DocumentData>): Anotacion {
	const datos = snapshot.data() as AnotacionDoc;
	return {
		id: snapshot.id,
		sentido: datos.sentido,
		anotadaEn: datos.anotadaEn.toDate(),
		pantalla: datos.pantalla,
		...(datos.tareaId !== undefined && { tareaId: datos.tareaId }),
		...(typeof datos.texto === 'string' && { texto: datos.texto })
	};
}

export function observarAnotaciones(uid: string, alCambiar: (anotaciones: Anotacion[]) => void): () => void {
	return onSnapshot(collection(db, 'users', uid, 'anotaciones'), (consulta) => alCambiar(consulta.docs.map(anotacionDesde)));
}

export async function guardarAnotacion(uid: string, anotacion: Anotacion): Promise<void> {
	await setDoc(anotacionRef(uid, anotacion.id), anotacionADoc(anotacion));
}

/**
 * Spec §6.7 y §7: cambia solo el texto (vacío lo quita). update falla si la
 * anotación ya no existe: gana el borrado, la edición se descarta.
 */
export async function cambiarTextoDeAnotacion(uid: string, anotacionId: string, texto: string): Promise<void> {
	const normalizado = normalizarTextoDeAnotacion(texto);
	try {
		await updateDoc(anotacionRef(uid, anotacionId), { texto: normalizado === undefined ? deleteField() : normalizado });
	} catch (error) {
		if (!(error instanceof FirestoreError && error.code === 'not-found')) throw error;
	}
}

export async function borrarAnotacion(uid: string, anotacionId: string): Promise<void> {
	await deleteDoc(anotacionRef(uid, anotacionId));
}

/**
 * Spec §7: borra las anotaciones huérfanas. Antes de borrar una confirma con el
 * servidor que su tarea no existe; sin conexión no limpia nada.
 */
export async function limpiarAnotacionesHuerfanas(uid: string, huerfanas: readonly Anotacion[]): Promise<void> {
	for (const anotacion of huerfanas) {
		if (anotacion.tareaId === undefined) continue;
		try {
			const tarea = await getDocFromServer(tareaRef(uid, anotacion.tareaId));
			if (!tarea.exists()) await deleteDoc(anotacionRef(uid, anotacion.id));
		} catch {
			return;
		}
	}
}
