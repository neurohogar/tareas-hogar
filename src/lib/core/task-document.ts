// Spec §7 (Conflictos): una tarea tal como queda guardada. Las ediciones son
// parciales y por campo, así que tras dos ediciones concurrentes el documento
// puede tener un campo que no corresponde a su tipo.
import { textFields } from './text-fields';
import { applyReferences, type ReferencesChange } from './label-references';
import { effortFields } from './effort';
import { savedSchedule } from './schedule';
import type { Effort, Schedule, Postponement, Recurrence, Task, TimeWindow } from './task';

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
	effort?: Effort;
	kind: Task['kind'];
	createdAt: Date;
	dueDate?: Date;
	recurrence?: Recurrence;
	/** Una lista de ventanas o, en el formato anterior, una sola (§4.1). */
	schedule?: Schedule | TimeWindow;
	labels?: string[];
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
	/** Un solo campo: se reemplaza entero, como etiquetas (§7). */
	steps?: string[] | null;
	/** Otro campo, independiente de pasos (§7); null es el paso 1. */
	currentStep?: number | null;
	minimalVersion?: string | null;
	effort?: Effort | null;
	kind?: Task['kind'];
	dueDate?: Date | null;
	recurrence?: Recurrence | null;
	/** Un solo campo: sus ventanas, con desde y hasta, se escriben juntas (§7). */
	schedule?: Schedule | null;
	/** Se reemplaza entero: gana el último cambio, no se unen los agregados (§7). */
	labels?: string[];
	/** Pausar y reanudar los escriben juntos (§7). */
	paused?: true | null;
	resumedAt?: Date;
	/** Un solo campo: desde y hasta se escriben juntos (§7). */
	postponed?: Postponement | null;
}

/** La tarea que describe el documento: un campo que no corresponde al tipo se ignora. */
export function taskFromDocument(doc: TaskDocument): Task {
	const { id, title, emoji, note, firstStep, minimalVersion, effort, kind, createdAt, dueDate, recurrence, schedule, labels, postponed } = doc;
	const commons = { id, title, ...textFields({ emoji, note, firstStep, minimalVersion }), ...stepsFields(doc), ...effortFields(effort), ...(labels && { labels }), ...(schedule && { schedule: savedSchedule(schedule) }), ...(postponed && { postponed }) };
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
 * (gana el borrado), el cambio se descarta.
 */
export function applyChange(docs: readonly TaskDocument[], taskId: string, change: TaskChange): TaskDocument[] {
	return docs.map((doc) => (doc.id === taskId ? applyToDocument(doc, change) : doc));
}

/**
 * Spec §4.3 y §7: los cambios de la app a las etiquetas de las tareas (borrar,
 * fusionar, limpiar), como los aplica el servidor con arrayRemove y
 * arrayUnion: tocan solo los ids que nombran. Una tarea que ya no existe se
 * saltea.
 */
export function applyReferenceChanges(
	docs: readonly TaskDocument[],
	changes: readonly ReferencesChange[]
): TaskDocument[] {
	return changes.reduce(
		(currentItems, change) =>
			currentItems.map((doc) =>
				doc.id === change.taskId ? { ...doc, labels: applyReferences(doc.labels, change) } : doc
			),
		[...docs]
	);
}
