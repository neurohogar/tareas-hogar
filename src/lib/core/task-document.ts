// Spec §7 (Conflicts): a task as it is stored. Edits are
// partial and per field, so after two concurrent edits the document
// may have a field that does not match its kind. Spec §7 (Data no longer
// used): a document can have old fields that the app neither reads nor writes.
import { textFields } from './text-fields';
import { savedSchedule } from './schedule';
import { essentialField } from './essential';
import type { Schedule, Postponement, Recurrence, Task, TimeWindow } from './task';

/** The §4.1 fields that the current slice has, without requiring that they match the kind. */
export interface TaskDocument {
	id: string;
	title: string;
	emoji?: string;
	note?: string;
	firstStep?: string;
	steps?: string[];
	currentStep?: number;
	minimalVersion?: string;
	/** Spec §4.1 (Essential): any kind; stored only as true. */
	essential?: boolean;
	kind: Task['kind'];
	createdAt: Date;
	dueDate?: Date;
	recurrence?: Recurrence;
	/** A list of windows or, in the previous format, a single one (§4.1). */
	schedule?: Schedule | TimeWindow;
	/** Spec §5.8: only valid for recurring tasks. */
	paused?: boolean;
	/** Spec §5.8: only valid for recurring tasks; a one-off ignores it. */
	resumedAt?: Date;
	postponed?: Postponement;
}

/**
 * A partial change: only the fields that changed. A field set to null is removed
 * from the document. The recurrence is a field: it is replaced whole.
 */
export interface TaskChange {
	title?: string;
	emoji?: string | null;
	note?: string | null;
	firstStep?: string | null;
	/** A single field: it is replaced whole (§7). */
	steps?: string[] | null;
	/** Another field, independent of steps (§7); null is step 1. */
	currentStep?: number | null;
	minimalVersion?: string | null;
	/** Spec §4.1: checking writes true; unchecking removes the field. */
	essential?: true | null;
	kind?: Task['kind'];
	dueDate?: Date | null;
	recurrence?: Recurrence | null;
	/** A single field: its windows, with from and to, are written together (§7). */
	schedule?: Schedule | null;
	/** Pausing and resuming write them together (§7). */
	paused?: true | null;
	/** Undoing a block rescheduling (§5.11) removes it with null if the task had none. */
	resumedAt?: Date | null;
	/** A single field: from and to are written together (§7). */
	postponed?: Postponement | null;
}

/** The task the document describes: a field that does not match the kind, or that is no longer used (§7), is ignored. */
export function taskFromDocument(doc: TaskDocument): Task {
	const { id, title, emoji, note, firstStep, minimalVersion, essential, kind, createdAt, dueDate, recurrence, schedule, postponed } = doc;
	const commons = { id, title, ...textFields({ emoji, note, firstStep, minimalVersion }), ...essentialField(essential), ...stepsFields(doc), ...(schedule && { schedule: savedSchedule(schedule) }), ...(postponed && { postponed }) };
	if (kind === 'puntual') return { ...commons, kind, ...(dueDate && { dueDate }), createdAt };
	if (!recurrence) throw new Error(`The recurring task ${id} has no recurrence`);
	return { ...commons, kind, recurrence, createdAt, ...pauseFields(doc) };
}

/** Spec §4.1 (Steps): steps (if it has any) and currentStep, only those the document has. */
function stepsFields({ steps, currentStep }: TaskDocument) {
	return { ...(steps && steps.length > 0 && { steps }), ...(currentStep !== undefined && { currentStep }) };
}

/** Spec §5.8: paused and resumedAt, only those the document has. */
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
 * Applies a change to the document of that task, as the server does on
 * receiving it: the last change per field wins and, if the task no longer exists
 * (deletion wins), the change is discarded. The fields the change does not
 * name, also the ones no longer used (§7), are left as they were.
 */
export function applyChange(docs: readonly TaskDocument[], taskId: string, change: TaskChange): TaskDocument[] {
	return docs.map((doc) => (doc.id === taskId ? applyToDocument(doc, change) : doc));
}
