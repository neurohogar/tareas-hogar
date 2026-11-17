// Traduce entre el modelo del core y Firestore (spec §7):
// users/{uid}/tareas/{tareaId} y users/{uid}/completados/{completadoId} (las anotaciones,
// en annotations.ts). Los campos viejos `etiquetas` y `esfuerzo` de una tarea y la colección
// `etiquetas` ya no se leen, escriben ni borran (S36): quedan como estén.
// Los documentos tienen su propia forma: ningún tipo de Firestore sale de acá.
import {
	collection,
	deleteDoc,
	deleteField,
	doc,
	FirestoreError,
	getDocFromServer,
	onSnapshot,
	setDoc,
	Timestamp,
	updateDoc,
	writeBatch,
	type DocumentData,
	type QueryDocumentSnapshot
} from 'firebase/firestore';
import type { Deletion } from '#lib/core/deletion.ts';
import { textFields } from '#lib/core/text-fields.ts';
import { dayFromIso, isoDay } from '#lib/core/days.ts';
import { taskFromDocument, type TaskChange } from '#lib/core/task-document.ts';
import { occurrenceFromText, occurrenceInText } from '#lib/core/occurrence-in-text.ts';
import type { Completion, Weekday, Recurrence, Schedule, Task, Unit, TimeWindow } from '#lib/core/task.ts';
import { db } from './firebase';

type Unsubscribe = () => void;

type RecurrenceDoc =
	| { modo: 'relativo'; cada: number; unidad: Unit }
	| { modo: 'calendario'; diasSemana: Weekday[] }
	| { modo: 'calendario'; diasMes: number[] };

/**
 * Tras dos ediciones concurrentes puede quedar un campo que no corresponde al
 * tipo; el core lo ignora (tareaDesdeDocumento).
 */
interface TaskDoc {
	titulo: string;
	/** Sin el campo, la tarea no tiene emoji. */
	emoji?: string;
	/** Sin el campo, la tarea no tiene nota. */
	nota?: string;
	/** Sin el campo, la tarea no tiene primer paso. */
	primerPaso?: string;
	/** Campo independiente (§7); sin él, la tarea no tiene versión mínima. */
	versionMinima?: string;
	/** Un solo campo (§7), los pasos 2 en adelante; sin él, no hay más pasos. */
	pasos?: string[];
	/** Otro campo, independiente de pasos (§7); sin él, la tarea va en el paso 1. */
	pasoActual?: number;
	tipo: Task['kind'];
	/** Fecha AAAA-MM-DD; sin el campo, la puntual no tiene fecha límite. */
	fechaLimite?: string;
	recurrencia?: RecurrenceDoc;
	/**
	 * Un solo campo (§7): la lista de ventanas { desde, hasta } en "HH:MM" o, en
	 * el formato anterior, una sola ventana; sin el campo, la tarea no tiene horario.
	 */
	horario?: TimeWindowDoc[] | TimeWindowDoc;
	creadaEn: Timestamp;
	/** Sin el campo, no está pausada (§5.8). */
	pausada?: boolean;
	/** Última vez que se reanudó (§5.8). */
	reanudadaEn?: Timestamp;
	/** Un solo campo (§7); sin él, no está pospuesta (§5.9). */
	pospuesta?: { desde: Timestamp; hasta: Timestamp };
}

interface TimeWindowDoc {
	desde: string;
	hasta: string;
}

/** Traduce campo por campo: el documento guarda desde y hasta, el core from y to. */
const timeWindowToDoc = ({ from, to }: TimeWindow): TimeWindowDoc => ({ desde: from, hasta: to });

const timeWindowFromDoc = ({ desde: from, hasta: to }: TimeWindowDoc): TimeWindow => ({ from, to });

/** Se escribe siempre como lista; el core lee también el formato anterior (§4.1). */
const copySchedule = (schedule: Schedule): TimeWindowDoc[] => schedule.map(timeWindowToDoc);

const readScheduleDoc = (schedule: TimeWindowDoc[] | TimeWindowDoc) => (Array.isArray(schedule) ? schedule.map(timeWindowFromDoc) : timeWindowFromDoc(schedule));

interface CompletionDoc {
	tareaId: string;
	completadoEn: Timestamp;
	/** Fecha AAAA-MM-DD, o fecha y hora AAAA-MM-DDTHH:MM con horario (§4.4). */
	ocurrenciaCubierta?: string;
	/** Paso en que iba la tarea al completarla; solo en tareas de dos pasos o más (§4.4). */
	pasoAlCompletar?: number;
	/** Solo se escribe en true: sin el campo, el completado fue entero (§4.4). */
	fueMinima?: true;
}

const taskRef = (uid: string, taskId: string) => doc(db, 'users', uid, 'tareas', taskId);
const completionRef = (uid: string, completionId: string) => doc(db, 'users', uid, 'completados', completionId);

/** Traduce campo por campo: el documento guarda modo, cada, unidad, diasSemana y diasMes. */
function recurrenceToDoc(recurrence: Recurrence): RecurrenceDoc {
	if (recurrence.mode === 'relativo') return { modo: 'relativo', cada: recurrence.every, unidad: recurrence.unit };
	if ('weekdays' in recurrence) return { modo: 'calendario', diasSemana: [...recurrence.weekdays] };
	return { modo: 'calendario', diasMes: [...recurrence.monthDays] };
}

function recurrenceFromDoc(recurrence: RecurrenceDoc): Recurrence {
	if (recurrence.modo === 'relativo') return { mode: 'relativo', every: recurrence.cada, unit: recurrence.unidad };
	if ('diasSemana' in recurrence) return { mode: 'calendario', weekdays: [...recurrence.diasSemana] };
	return { mode: 'calendario', monthDays: [...recurrence.diasMes] };
}

function taskToDoc(task: Task): TaskDoc {
	const createdAt = Timestamp.fromDate(task.createdAt);
	const common = {
		titulo: task.title,
		...(task.emoji !== undefined && { emoji: task.emoji }),
		...(task.note !== undefined && { nota: task.note }),
		...(task.firstStep !== undefined && { primerPaso: task.firstStep }),
		...(task.minimalVersion !== undefined && { versionMinima: task.minimalVersion }),
		...(task.steps && { pasos: [...task.steps] }),
		...(task.currentStep !== undefined && { pasoActual: task.currentStep }),
		...(task.schedule && { horario: copySchedule(task.schedule) }),
		creadaEn: createdAt
	};
	if (task.kind === 'periodica') return { ...common, tipo: 'periodica', recurrencia: recurrenceToDoc(task.recurrence) };
	const docData: TaskDoc = { ...common, tipo: 'puntual' };
	if (task.dueDate) docData.fechaLimite = isoDay(task.dueDate);
	return docData;
}

function taskFromSnapshot(snapshot: QueryDocumentSnapshot<DocumentData>): Task {
	const data = snapshot.data() as TaskDoc;
	return taskFromDocument({
		id: snapshot.id,
		title: data.titulo,
		...textFields({ emoji: data.emoji, note: data.nota, firstStep: data.primerPaso, minimalVersion: data.versionMinima }),
		...(data.pasos && { steps: [...data.pasos] }),
		...(data.pasoActual !== undefined && { currentStep: data.pasoActual }),
		kind: data.tipo,
		createdAt: data.creadaEn.toDate(),
		...(data.fechaLimite && { dueDate: dayFromIso(data.fechaLimite) }),
		...(data.recurrencia && { recurrence: recurrenceFromDoc(data.recurrencia) }),
		...(data.horario && { schedule: readScheduleDoc(data.horario) }),
		...(data.pausada && { paused: data.pausada }),
		...(data.reanudadaEn && { resumedAt: data.reanudadaEn.toDate() }),
		...(data.pospuesta && { postponed: { from: data.pospuesta.desde.toDate(), to: data.pospuesta.hasta.toDate() } })
	});
}

/** Los campos del cambio como los escribe updateDoc: null quita el campo. */
function changeFields({ title, emoji, note, firstStep, minimalVersion, steps, currentStep, kind, dueDate, recurrence, schedule, paused, resumedAt, postponed }: TaskChange): DocumentData {
	const fields: DocumentData = {};
	if (title !== undefined) fields.titulo = title;
	if (emoji !== undefined) fields.emoji = emoji === null ? deleteField() : emoji;
	if (note !== undefined) fields.nota = note === null ? deleteField() : note;
	if (firstStep !== undefined) fields.primerPaso = firstStep === null ? deleteField() : firstStep;
	if (minimalVersion !== undefined) fields.versionMinima = minimalVersion === null ? deleteField() : minimalVersion;
	// pasos se reemplaza entero y pasoActual es otro campo (§7); null quita el campo.
	if (steps !== undefined) fields.pasos = steps === null ? deleteField() : [...steps];
	if (currentStep !== undefined) fields.pasoActual = currentStep === null ? deleteField() : currentStep;
	if (kind !== undefined) fields.tipo = kind;
	if (dueDate !== undefined) fields.fechaLimite = dueDate === null ? deleteField() : isoDay(dueDate);
	if (recurrence !== undefined) fields.recurrencia = recurrence === null ? deleteField() : recurrenceToDoc(recurrence);
	// update reemplaza el campo entero: las ventanas se escriben juntas (§7).
	if (schedule !== undefined) fields.horario = schedule === null ? deleteField() : copySchedule(schedule);
	// pausada y reanudadaEn viajan juntos en el mismo update (§7).
	if (paused !== undefined) fields.pausada = paused === null ? deleteField() : paused;
	if (resumedAt !== undefined) fields.reanudadaEn = Timestamp.fromDate(resumedAt);
	// pospuesta se escribe entera: desde y hasta juntos (§7).
	if (postponed !== undefined) {
		fields.pospuesta = postponed === null ? deleteField() : { desde: Timestamp.fromDate(postponed.from), hasta: Timestamp.fromDate(postponed.to) };
	}
	return fields;
}

function completionToDoc(completion: Completion): CompletionDoc {
	const docData: CompletionDoc = {
		tareaId: completion.taskId,
		completadoEn: Timestamp.fromDate(completion.completedAt)
	};
	if (completion.coveredOccurrence) docData.ocurrenciaCubierta = occurrenceInText(completion.coveredOccurrence);
	if (completion.stepAtCompletion !== undefined) docData.pasoAlCompletar = completion.stepAtCompletion;
	if (completion.wasMinimal) docData.fueMinima = true;
	return docData;
}

function completionFromSnapshot(snapshot: QueryDocumentSnapshot<DocumentData>): Completion {
	const data = snapshot.data() as CompletionDoc;
	const completion: Completion = { id: snapshot.id, taskId: data.tareaId, completedAt: data.completadoEn.toDate() };
	if (data.ocurrenciaCubierta) completion.coveredOccurrence = occurrenceFromText(data.ocurrenciaCubierta);
	if (data.pasoAlCompletar !== undefined) completion.stepAtCompletion = data.pasoAlCompletar;
	if (data.fueMinima === true) completion.wasMinimal = true;
	return completion;
}

export function observeTasks(uid: string, onChange: (tasks: Task[]) => void): Unsubscribe {
	return onSnapshot(collection(db, 'users', uid, 'tareas'), (query) =>
		onChange(query.docs.map(taskFromSnapshot))
	);
}

export function observeCompletions(uid: string, onChange: (completions: Completion[]) => void): Unsubscribe {
	return onSnapshot(collection(db, 'users', uid, 'completados'), (query) =>
		onChange(query.docs.map(completionFromSnapshot))
	);
}

/** Spec §7: la tarea nueva. */
export async function saveTask(uid: string, task: Task): Promise<void> {
	await setDoc(taskRef(uid, task.id), taskToDoc(task), { merge: true });
}

/** Ignora el rechazo de una escritura sobre un documento que ya no existe: gana el borrado (§7). */
async function exceptDeleted(write: Promise<void>): Promise<void> {
	try {
		await write;
	} catch (error) {
		if (!(error instanceof FirestoreError && error.code === 'not-found')) throw error;
	}
}

export async function saveCompletion(uid: string, completion: Completion): Promise<void> {
	await setDoc(completionRef(uid, completion.id), completionToDoc(completion));
}

/**
 * Spec §7: escribe solo los campos que cambiaron. update reemplaza cada campo
 * entero (la recurrencia no se mezcla, como haría set con merge), deja intactos
 * los campos viejos `etiquetas` y `esfuerzo` (S36) y falla si la tarea ya no
 * existe: gana el borrado y la edición se descarta.
 */
export async function saveChange(uid: string, taskId: string, change: TaskChange): Promise<void> {
	const fields = changeFields(change);
	if (Object.keys(fields).length === 0) return;
	await exceptDeleted(updateDoc(taskRef(uid, taskId), fields));
}

/** Spec §7: la tarea, sus completados y sus anotaciones se borran en un solo writeBatch. */
export async function deleteTask(uid: string, { taskId, completionIds, annotationIds }: Deletion): Promise<void> {
	const batch = writeBatch(db);
	batch.delete(taskRef(uid, taskId));
	for (const completionId of completionIds) batch.delete(completionRef(uid, completionId));
	for (const annotationId of annotationIds) batch.delete(doc(db, 'users', uid, 'anotaciones', annotationId));
	await batch.commit();
}

/**
 * Spec §7: borra los completados huérfanos. Antes de borrar uno confirma con
 * el servidor que su tarea no existe (las dos colecciones se sincronizan por
 * separado); sin conexión no limpia nada.
 */
export async function cleanOrphanCompletions(uid: string, orphans: readonly Completion[]): Promise<string[]> {
	const failed: string[] = [];
	for (const completion of orphans) {
		try {
			const task = await getDocFromServer(taskRef(uid, completion.taskId));
			if (!task.exists()) await deleteDoc(completionRef(uid, completion.id));
		} catch {
			failed.push(completion.id);
		}
	}
	return failed;
}

/**
 * Spec §5.4: borra un completado (deshacer). Si ya no existe (otro dispositivo
 * lo borró, o borró su tarea), no hace nada: deleteDoc no falla ni crea nada.
 */
export async function deleteCompletion(uid: string, completionId: string): Promise<void> {
	await deleteDoc(completionRef(uid, completionId));
}
