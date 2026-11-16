// Traduce entre la anotación del core y Firestore (spec §7):
// users/{uid}/anotaciones/{anotacionId}.
import { collection, deleteDoc, deleteField, doc, FirestoreError, getDocFromServer, onSnapshot, setDoc, Timestamp, updateDoc, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';
import type { Annotation, AnnotationScreen, Sense } from '#lib/core/annotation.ts';
import { db } from './firebase';

interface AnnotationDoc {
	sentido: Sense;
	anotadaEn: Timestamp;
	pantalla: AnnotationScreen;
	/** Sin el campo, la anotación no tiene tarea. */
	tareaId?: string;
	/** Sin el campo, la anotación no tiene texto. */
	texto?: string;
}

const annotationRef = (uid: string, annotationId: string) => doc(db, 'users', uid, 'anotaciones', annotationId);
const taskRef = (uid: string, taskId: string) => doc(db, 'users', uid, 'tareas', taskId);

function annotationToDoc({ sense, annotatedAt, screen, taskId, text }: Annotation): AnnotationDoc {
	return {
		sentido: sense,
		anotadaEn: Timestamp.fromDate(annotatedAt),
		pantalla: screen,
		...(taskId !== undefined && { tareaId: taskId }),
		...(text !== undefined && { texto: text })
	};
}

function annotationFromSnapshot(snapshot: QueryDocumentSnapshot<DocumentData>): Annotation {
	const data = snapshot.data() as AnnotationDoc;
	return {
		id: snapshot.id,
		sense: data.sentido,
		annotatedAt: data.anotadaEn.toDate(),
		screen: data.pantalla,
		...(data.tareaId !== undefined && { taskId: data.tareaId }),
		...(typeof data.texto === 'string' && { text: data.texto })
	};
}

export function observeAnnotations(uid: string, onChange: (annotations: Annotation[]) => void): () => void {
	return onSnapshot(collection(db, 'users', uid, 'anotaciones'), (query) => onChange(query.docs.map(annotationFromSnapshot)));
}

export async function saveAnnotation(uid: string, annotation: Annotation): Promise<void> {
	await setDoc(annotationRef(uid, annotation.id), annotationToDoc(annotation));
}

/**
 * Spec §6.7 y §7: cambia solo el texto, ya normalizado por el core (sin texto
 * lo quita). update falla si la anotación ya no existe: gana el borrado, la
 * edición se descarta.
 */
export async function changeAnnotationText(uid: string, annotationId: string, text: string | undefined): Promise<void> {
	try {
		await updateDoc(annotationRef(uid, annotationId), { texto: text === undefined ? deleteField() : text });
	} catch (error) {
		if (!(error instanceof FirestoreError && error.code === 'not-found')) throw error;
	}
}

export async function deleteAnnotation(uid: string, annotationId: string): Promise<void> {
	await deleteDoc(annotationRef(uid, annotationId));
}

/**
 * Spec §7: borra las anotaciones huérfanas, cada una por separado. Antes de
 * borrar una confirma con el servidor que su tarea no existe; sin conexión
 * falla. Devuelve los ids de las que fallaron.
 */
export async function cleanOrphanAnnotations(uid: string, orphans: readonly Annotation[]): Promise<string[]> {
	const failed: string[] = [];
	for (const annotation of orphans) {
		if (annotation.taskId === undefined) continue;
		try {
			const task = await getDocFromServer(taskRef(uid, annotation.taskId));
			if (!task.exists()) await deleteDoc(annotationRef(uid, annotation.id));
		} catch {
			failed.push(annotation.id);
		}
	}
	return failed;
}
