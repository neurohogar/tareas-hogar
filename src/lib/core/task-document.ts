// Spec §7 (Conflictos): una tarea tal como queda guardada. Las ediciones son
// parciales y por campo, así que tras dos ediciones concurrentes el documento
// puede tener un campo que no corresponde a su tipo. Spec §7 (Datos que ya no
// se usan): un documento puede tener campos viejos que la app no lee ni escribe.
import { textFields } from './text-fields';
import { savedSchedule } from './schedule';
import type { Schedule, Postponement, Recurrence, Task, TimeWindow } from './task';

/** Los campos de la §4.1 que tiene la rebanada actual, sin exigir que correspondan al tipo. */
export interface TaskDocument {
	id: string;
	title: string;
	emoji?: string;
	note?: string;
	firstStep?: string;
	steps?: string[];
	currentStep?: number;
	minimalVersion?: string;
	kind: Task['kind'];
	createdAt: Date;
	dueDate?: Date;
	recurrence?: Recurrence;
	/** Una lista de ventanas o, en el formato anterior, una sola (§4.1). */
	schedule?: Schedule | TimeWindow;
	/** Spec §5.8: solo vale para las periódicas. */
	paused?: boolean;
	/** Spec §5.8: solo vale para las periódicas; una puntual lo ignora. */
	resumedAt?: Date;
	postponed?: Postponement;
}

/**
 * Un cambio parcial: solo los campos que cambiaron. Un campo en null se quita
 * del documento. La recurrencia es un campo: se reemplaza entera.
 */
export interface TaskChange {
	title?: string;
	emoji?: string | null;
	note?: string | null;
	firstStep?: string | null;
	/** Un solo campo: se reemplaza entero (§7). */
	steps?: string[] | null;
	/** Otro campo, independiente de pasos (§7); null es el paso 1. */
	currentStep?: number | null;
	minimalVersion?: string | null;
	kind?: Task['kind'];
	dueDate?: Date | null;
	recurrence?: Recurrence | null;
	/** Un solo campo: sus ventanas, con desde y hasta, se escriben juntas (§7). */
	schedule?: Schedule | null;
	/** Pausar y reanudar los escriben juntos (§7). */
	paused?: true | null;
	resumedAt?: Date;
	/** Un solo campo: desde y hasta se escriben juntos (§7). */
	postponed?: Postponement | null;
}

/** La tarea que describe el documento: un campo que no corresponde al tipo, o que ya no se usa (§7), se ignora. */
export function taskFromDocument(doc: TaskDocument): Task {
	const { id, title, emoji, note, firstStep, minimalVersion, kind, createdAt, dueDate, recurrence, schedule, postponed } = doc;
	const commons = { id, title, ...textFields({ emoji, note, firstStep, minimalVersion }), ...stepsFields(doc), ...(schedule && { schedule: savedSchedule(schedule) }), ...(postponed && { postponed }) };
	if (kind === 'puntual') return { ...commons, kind, ...(dueDate && { dueDate }), createdAt };
	if (!recurrence) throw new Error(`La tarea periódica ${id} no tiene recurrencia`);
	return { ...commons, kind, recurrence, createdAt, ...pauseFields(doc) };
}

/** Spec §4.1 (Pasos): pasos (si tiene alguno) y pasoActual, solo los que tiene el documento. */
function stepsFields({ steps, currentStep }: TaskDocument) {
	return { ...(steps && steps.length > 0 && { steps }), ...(currentStep !== undefined && { currentStep }) };
}

/** Spec §5.8: pausada y reanudadaEn, solo los que tiene el documento. */
function pauseFields({ paused, resumedAt }: TaskDocument) {
	return { ...(paused && { paused }), ...(resumedAt && { resumedAt }) };
}

function applyToDocument(doc: TaskDocument, change: TaskChange): TaskDocument {
	const editedDocument: Record<string, unknown> = { ...doc };
	for (const [field, value] of Object.entries(change)) {
		if (value === null) delete editedDocument[field];
		else editedDocument[field] = value;
	}
	return editedDocument as unknown as TaskDocument;
}

/**
 * Aplica un cambio al documento de esa tarea, como lo hace el servidor al
 * recibirlo: gana el último cambio por campo y, si la tarea ya no existe
 * (gana el borrado), el cambio se descarta. Los campos que el cambio no
 * nombra, también los que ya no se usan (§7), quedan como estaban.
 */
export function applyChange(docs: readonly TaskDocument[], taskId: string, change: TaskChange): TaskDocument[] {
	return docs.map((doc) => (doc.id === taskId ? applyToDocument(doc, change) : doc));
}
