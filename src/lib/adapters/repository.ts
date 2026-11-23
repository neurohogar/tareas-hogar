// Translates between the core model and Firestore (spec §7):
// users/{uid}/tareas/{tareaId} and users/{uid}/completados/{completadoId} (the app does not touch
// `anotaciones`, S17). The old `etiquetas` and `esfuerzo` fields of a task and the `etiquetas`
// collection are no longer read, written or deleted (S36): they stay as they are.
// The documents have their own shape: no Firestore type leaves this file.
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
import type { MinimalModeDocument, TaskResume } from '#lib/core/minimal-mode.ts';
import { occurrenceFromText, occurrenceInText } from '#lib/core/occurrence-in-text.ts';
import type { Completion, Weekday, Recurrence, Schedule, Task, Unit, TimeWindow } from '#lib/core/task.ts';
import { db } from './firebase';

type Unsubscribe = () => void;

type RecurrenceDoc =
	| { modo: 'relativo'; cada: number; unidad: Unit }
	| { modo: 'calendario'; diasSemana: Weekday[] }
	| { modo: 'calendario'; diasMes: number[] };

/**
 * After two concurrent edits a field that does not match the type may remain;
 * the core ignores it (taskFromSnapshot).
 */
interface TaskDoc {
	titulo: string;
	/** Without the field, the task has no emoji. */
	emoji?: string;
	/** Without the field, the task has no note. */
	nota?: string;
	/** Without the field, the task has no first step. */
	primerPaso?: string;
	/** Independent field (§7); without it, the task has no minimal version. */
	versionMinima?: string;
	/** A single field (§7), steps 2 onward; without it, there are no more steps. */
	pasos?: string[];
	/** Another field, independent of pasos (§7); without it, the task is on step 1. */
	pasoActual?: number;
	tipo: Task['kind'];
	/** Date YYYY-MM-DD; without the field, the one-off task has no due date. */
	fechaLimite?: string;
	recurrencia?: RecurrenceDoc;
	/**
	 * A single field (§7): the list of windows { desde, hasta } as "HH:MM" or, in
	 * the old format, a single window; without the field, the task has no schedule.
	 */
	horario?: TimeWindowDoc[] | TimeWindowDoc;
	creadaEn: Timestamp;
	/** Only written as true; without the field, the task is not essential (§4.1). */
	essential?: true;
	/** Without the field, it is not paused (§5.8). */
	pausada?: boolean;
	/** Last time it was resumed (§5.8). */
	reanudadaEn?: Timestamp;
	/** A single field (§7); without it, it is not postponed (§5.9). */
	pospuesta?: { desde: Timestamp; hasta: Timestamp };
}

interface TimeWindowDoc {
	desde: string;
	hasta: string;
}

/** Translates field by field: the document stores desde and hasta, the core from and to. */
const timeWindowToDoc = ({ from, to }: TimeWindow): TimeWindowDoc => ({ desde: from, hasta: to });

const timeWindowFromDoc = ({ desde: from, hasta: to }: TimeWindowDoc): TimeWindow => ({ from, to });

/** Always written as a list; the core also reads the old format (§4.1). */
const copySchedule = (schedule: Schedule): TimeWindowDoc[] => schedule.map(timeWindowToDoc);

const readScheduleDoc = (schedule: TimeWindowDoc[] | TimeWindowDoc) => (Array.isArray(schedule) ? schedule.map(timeWindowFromDoc) : timeWindowFromDoc(schedule));

interface CompletionDoc {
	tareaId: string;
	completadoEn: Timestamp;
	/** Date YYYY-MM-DD, or date and time YYYY-MM-DDTHH:MM with a schedule (§4.4). */
	ocurrenciaCubierta?: string;
	/** Step the task was on when it was completed; only on tasks of two or more steps (§4.4). */
	pasoAlCompletar?: number;
	/** Only written as true: without the field, the completion was whole (§4.4). */
	fueMinima?: true;
}

const taskRef = (uid: string, taskId: string) => doc(db, 'users', uid, 'tareas', taskId);
const completionRef = (uid: string, completionId: string) => doc(db, 'users', uid, 'completados', completionId);

/** Translates field by field: the document stores modo, cada, unidad, diasSemana and diasMes. */
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
		...(task.essential === true && { essential: true as const }),
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
		...(data.essential === true && { essential: true }),
		...(data.pausada && { paused: data.pausada }),
		...(data.reanudadaEn && { resumedAt: data.reanudadaEn.toDate() }),
		...(data.pospuesta && { postponed: { from: data.pospuesta.desde.toDate(), to: data.pospuesta.hasta.toDate() } })
	});
}

/** The fields of the change as updateDoc writes them: null removes the field. */
function changeFields({ title, emoji, note, firstStep, minimalVersion, steps, currentStep, kind, dueDate, recurrence, schedule, essential, paused, resumedAt, postponed }: TaskChange): DocumentData {
	const fields: DocumentData = {};
	if (title !== undefined) fields.titulo = title;
	if (emoji !== undefined) fields.emoji = emoji === null ? deleteField() : emoji;
	if (note !== undefined) fields.nota = note === null ? deleteField() : note;
	if (firstStep !== undefined) fields.primerPaso = firstStep === null ? deleteField() : firstStep;
	if (minimalVersion !== undefined) fields.versionMinima = minimalVersion === null ? deleteField() : minimalVersion;
	// pasos is replaced whole and pasoActual is another field (§7); null removes the field.
	if (steps !== undefined) fields.pasos = steps === null ? deleteField() : [...steps];
	if (currentStep !== undefined) fields.pasoActual = currentStep === null ? deleteField() : currentStep;
	if (kind !== undefined) fields.tipo = kind;
	if (dueDate !== undefined) fields.fechaLimite = dueDate === null ? deleteField() : isoDay(dueDate);
	if (recurrence !== undefined) fields.recurrencia = recurrence === null ? deleteField() : recurrenceToDoc(recurrence);
	// update replaces the whole field: the windows are written together (§7).
	if (schedule !== undefined) fields.horario = schedule === null ? deleteField() : copySchedule(schedule);
	if (essential !== undefined) fields.essential = essential === null ? deleteField() : essential;
	// pausada and reanudadaEn travel together in the same update (§7).
	if (paused !== undefined) fields.pausada = paused === null ? deleteField() : paused;
	if (resumedAt !== undefined) fields.reanudadaEn = resumedAt === null ? deleteField() : Timestamp.fromDate(resumedAt);
	// pospuesta is written whole: desde and hasta together (§7).
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

/** Spec §7: the new task. */
export async function saveTask(uid: string, task: Task): Promise<void> {
	await setDoc(taskRef(uid, task.id), taskToDoc(task), { merge: true });
}

/** Ignores the rejection of a write to a document that no longer exists: the deletion wins (§7). */
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
 * Spec §7: writes only the fields that changed. update replaces each whole field
 * (the recurrence is not merged, as set with merge would do), leaves the old `etiquetas`
 * and `esfuerzo` fields untouched (S36) and fails if the task no longer exists: the
 * deletion wins and the edit is discarded.
 */
export async function saveChange(uid: string, taskId: string, change: TaskChange): Promise<void> {
	const fields = changeFields(change);
	if (Object.keys(fields).length === 0) return;
	await exceptDeleted(updateDoc(taskRef(uid, taskId), fields));
}

/** Spec §7: the task and its completions are deleted in a single writeBatch. */
export async function deleteTask(uid: string, { taskId, completionIds }: Deletion): Promise<void> {
	const batch = writeBatch(db);
	batch.delete(taskRef(uid, taskId));
	for (const completionId of completionIds) batch.delete(completionRef(uid, completionId));
	await batch.commit();
}

/**
 * Spec §7: deletes orphan completions. Before deleting one it confirms with the
 * server that its task does not exist (the two collections sync separately);
 * offline it cleans nothing.
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
 * Spec §5.4: deletes a completion (undo). If it no longer exists (another device
 * deleted it, or deleted its task), it does nothing: deleteDoc neither fails nor creates anything.
 */
export async function deleteCompletion(uid: string, completionId: string): Promise<void> {
	await deleteDoc(completionRef(uid, completionId));
}

const minimalModeRef = (uid: string) => doc(db, 'users', uid, 'settings', 'minimalMode');

/** Spec §7: the state of the minimal mode; `undefined` while the document does not exist (the mode is off). */
export function observeMinimalMode(uid: string, onChange: (state: MinimalModeDocument | undefined) => void): Unsubscribe {
	return onSnapshot(minimalModeRef(uid), (snapshot) => {
		const data = snapshot.data();
		onChange(data ? { active: data.active === true } : undefined);
	});
}

/**
 * Spec §7: turns the mode on or off. Turning it off carries the resumes of the tasks that come back
 * (from the core), written together with `active` in a single writeBatch.
 */
export async function saveMinimalMode(uid: string, active: boolean, resumes: readonly TaskResume[] = []): Promise<void> {
	const batch = writeBatch(db);
	batch.set(minimalModeRef(uid), { active });
	for (const { taskId, change } of resumes) batch.update(taskRef(uid, taskId), changeFields(change));
	await batch.commit();
}

/**
 * Spec §7: the block rescheduling of overdue recurring tasks, and its undo, written in a single
 * writeBatch (the changes come from the core: only `reanudadaEn`).
 */
export async function saveResumes(uid: string, resumes: readonly TaskResume[]): Promise<void> {
	if (resumes.length === 0) return;
	const batch = writeBatch(db);
	for (const { taskId, change } of resumes) batch.update(taskRef(uid, taskId), changeFields(change));
	await batch.commit();
}
