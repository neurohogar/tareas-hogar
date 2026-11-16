// Traduce entre el modelo del core y Firestore (spec §7):
// users/{uid}/tareas/{tareaId}, users/{uid}/completados/{completadoId} y
// users/{uid}/etiquetas/{etiquetaId} (las anotaciones, en annotations.ts).
// Los documentos tienen su propia forma: ningún tipo de Firestore sale de acá.
import {
	arrayRemove,
	arrayUnion,
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
	type QueryDocumentSnapshot,
	type WriteBatch
} from 'firebase/firestore';
import type { Deletion } from '#lib/core/deletion.ts';
import type { LabelDeletion } from '#lib/core/label-deletion.ts';
import { textFields } from '#lib/core/text-fields.ts';
import { dayFromIso, isoDay } from '#lib/core/days.ts';
import { taskFromDocument, type TaskChange } from '#lib/core/task-document.ts';
import type { Color, Label } from '#lib/core/label.ts';
import type { LabelMerge } from '#lib/core/label-merge.ts';
import type { LabelChange } from '#lib/core/label-management.ts';
import { occurrenceFromText, occurrenceInText } from '#lib/core/occurrence-in-text.ts';
import type { ReferencesChange } from '#lib/core/label-references.ts';
import type { Completion, Weekday, Effort, Recurrence, Schedule, Task, Unit, TimeWindow } from '#lib/core/task.ts';
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
	/** Sin el campo, la tarea está sin estimar. */
	esfuerzo?: Effort;
	tipo: Task['kind'];
	/** Fecha AAAA-MM-DD; sin el campo, la puntual no tiene fecha límite. */
	fechaLimite?: string;
	recurrencia?: RecurrenceDoc;
	/**
	 * Un solo campo (§7): la lista de ventanas { desde, hasta } en "HH:MM" o, en
	 * el formato anterior, una sola ventana; sin el campo, la tarea no tiene horario.
	 */
	horario?: TimeWindowDoc[] | TimeWindowDoc;
	/** Ids de etiqueta; sin el campo, ninguna. */
	etiquetas?: string[];
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

interface LabelDoc {
	nombre: string;
	color: Color;
}

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
const labelRef = (uid: string, labelId: string) => doc(db, 'users', uid, 'etiquetas', labelId);

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
		...(task.effort && { esfuerzo: task.effort }),
		...(task.labels && { etiquetas: [...task.labels] }),
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
		...(data.esfuerzo && { effort: data.esfuerzo }),
		kind: data.tipo,
		createdAt: data.creadaEn.toDate(),
		...(data.fechaLimite && { dueDate: dayFromIso(data.fechaLimite) }),
		...(data.recurrencia && { recurrence: recurrenceFromDoc(data.recurrencia) }),
		...(data.horario && { schedule: readScheduleDoc(data.horario) }),
		...(data.etiquetas && { labels: [...data.etiquetas] }),
		...(data.pausada && { paused: data.pausada }),
		...(data.reanudadaEn && { resumedAt: data.reanudadaEn.toDate() }),
		...(data.pospuesta && { postponed: { from: data.pospuesta.desde.toDate(), to: data.pospuesta.hasta.toDate() } })
	});
}

function labelFromSnapshot(snapshot: QueryDocumentSnapshot<DocumentData>): Label {
	const { nombre: name, color } = snapshot.data() as LabelDoc;
	return { id: snapshot.id, name, color };
}

/** Los campos del cambio como los escribe updateDoc: null quita el campo. */
function changeFields({ title, emoji, note, firstStep, minimalVersion, steps, currentStep, effort, kind, dueDate, recurrence, schedule, labels, paused, resumedAt, postponed }: TaskChange): DocumentData {
	const fields: DocumentData = {};
	if (labels !== undefined) fields.etiquetas = [...labels];
	if (title !== undefined) fields.titulo = title;
	if (emoji !== undefined) fields.emoji = emoji === null ? deleteField() : emoji;
	if (note !== undefined) fields.nota = note === null ? deleteField() : note;
	if (firstStep !== undefined) fields.primerPaso = firstStep === null ? deleteField() : firstStep;
	if (minimalVersion !== undefined) fields.versionMinima = minimalVersion === null ? deleteField() : minimalVersion;
	// pasos se reemplaza entero y pasoActual es otro campo (§7); null quita el campo.
	if (steps !== undefined) fields.pasos = steps === null ? deleteField() : [...steps];
	if (currentStep !== undefined) fields.pasoActual = currentStep === null ? deleteField() : currentStep;
	if (effort !== undefined) fields.esfuerzo = effort === null ? deleteField() : effort;
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

export function observeLabels(uid: string, onChange: (labels: Label[]) => void): Unsubscribe {
	return onSnapshot(collection(db, 'users', uid, 'etiquetas'), (query) => onChange(query.docs.map(labelFromSnapshot)));
}

const labelToDoc = ({ name, color }: Label): LabelDoc => ({ nombre: name, color });

/** Un lote que empieza creando las etiquetas nuevas de un guardado del panel (§4.3). */
function batchWithLabels(uid: string, newLabels: readonly Label[]): WriteBatch {
	const batch = writeBatch(db);
	for (const label of newLabels) batch.set(labelRef(uid, label.id), labelToDoc(label));
	return batch;
}

/** Spec §4.3: la tarea nueva y las etiquetas que se crean al guardarla, en un solo writeBatch. */
export async function saveTask(uid: string, task: Task, newLabels: readonly Label[]): Promise<void> {
	const batch = batchWithLabels(uid, newLabels);
	batch.set(taskRef(uid, task.id), taskToDoc(task), { merge: true });
	await batch.commit();
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
 * Spec §7: escribe solo los campos que cambiaron, junto con las etiquetas que
 * se crean al guardar, en un solo writeBatch. update reemplaza cada campo
 * entero (la recurrencia y las etiquetas no se mezclan, como haría set con
 * merge) y falla si la tarea ya no existe: gana el borrado, la edición se
 * descarta y no se crea ninguna etiqueta.
 */
export async function saveChange(uid: string, taskId: string, change: TaskChange, newLabels: readonly Label[]): Promise<void> {
	const fields = changeFields(change);
	if (Object.keys(fields).length === 0) return;
	const batch = batchWithLabels(uid, newLabels);
	batch.update(taskRef(uid, taskId), fields);
	await exceptDeleted(batch.commit());
}

/** Spec §7: nombre y color son campos independientes; un cambio de una etiqueta borrada no la revive. */
export async function changeLabel(uid: string, labelId: string, change: LabelChange): Promise<void> {
	await exceptDeleted(updateDoc(labelRef(uid, labelId), { ...('name' in change && { nombre: change.name }), ...('color' in change && { color: change.color }) }));
}

/**
 * Traduce un CambioDeReferencias del core (§4.3, §7): arrayRemove y
 * arrayUnion tocan solo los ids nombrados, sin reemplazar el campo. Los dos en
 * un writeBatch, en el orden del core; una tarea que ya no existe se saltea.
 */
async function changeReferences(uid: string, { taskId, remove, put }: ReferencesChange): Promise<void> {
	const batch = writeBatch(db);
	if (remove.length > 0) batch.update(taskRef(uid, taskId), { etiquetas: arrayRemove(...remove) });
	if (put.length > 0) batch.update(taskRef(uid, taskId), { etiquetas: arrayUnion(...put) });
	await exceptDeleted(batch.commit());
}

/** Spec §4.3: borra la etiqueta y la quita de las tareas que la tienen. */
export async function deleteLabel(uid: string, { labelId, references }: LabelDeletion): Promise<void> {
	await deleteDoc(labelRef(uid, labelId));
	await Promise.all(references.map((change) => changeReferences(uid, change)));
}

/** Si la etiqueta no existe en el servidor; sin conexión, getDocFromServer falla con FirestoreError. */
async function deletedOnServer(uid: string, labelId: string): Promise<boolean> {
	return !(await getDocFromServer(labelRef(uid, labelId))).exists();
}

/**
 * Spec §7: quita las referencias a etiquetas borradas. Antes confirma con el
 * servidor que cada etiqueta no existe (las colecciones se sincronizan por
 * separado); sin conexión no limpia nada.
 */
export async function cleanReferences(uid: string, broken: readonly ReferencesChange[]): Promise<string[]> {
	const failed: string[] = [];
	for (const change of broken) {
		try {
			const deletedItems = await Promise.all(change.remove.map((id) => deletedOnServer(uid, id)));
			const remove = change.remove.filter((_, index) => deletedItems[index]);
			if (remove.length > 0) await changeReferences(uid, { ...change, remove });
		} catch (error) {
			if (!(error instanceof FirestoreError)) throw error;
			failed.push(change.taskId);
		}
	}
	return failed;
}

/**
 * Spec §7 (Etiquetas duplicadas): primero las tareas pasan a la sobreviviente,
 * después se borran las otras. Cada una se intenta por separado; una etiqueta
 * cuyas tareas no pasaron no se borra. Devuelve los ids de las que fallaron.
 */
export async function mergeLabels(uid: string, { deletedItems, references }: LabelMerge): Promise<string[]> {
	const notMoved = new Set<string>();
	for (const change of references) {
		try {
			await changeReferences(uid, change);
		} catch {
			change.remove.forEach((id) => notMoved.add(id));
		}
	}
	const failed = deletedItems.filter((id) => notMoved.has(id));
	for (const labelId of deletedItems.filter((id) => !notMoved.has(id))) {
		try {
			await deleteDoc(labelRef(uid, labelId));
		} catch {
			failed.push(labelId);
		}
	}
	return failed;
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
