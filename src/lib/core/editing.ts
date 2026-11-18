// Spec §6.2 (Editar) and §7 (Conflictos): editing validates like creating and produces
// a partial change, with only the fields that changed.
import type { CreationErrors } from './creation';
import { createFromData, type TaskData } from './task-data';
import type { TaskChange } from './task-document';
import { isPaused, resume } from './pause';
import type { Schedule, Recurrence, Task } from './task';

export type EditingResult = { ok: true; change: TaskChange } | { ok: false; errors: CreationErrors };

/** A key that identifies the recurrence: two recurrences are the same if they have the same key. */
function recurrenceKey(recurrence: Recurrence): string {
	if (recurrence.mode === 'relativo') return `relativo ${recurrence.every} ${recurrence.unit}`;
	if ('weekdays' in recurrence) return `semanal ${recurrence.weekdays.join(' ')}`;
	return `mensual ${recurrence.monthDays.join(' ')}`;
}

const scheduleKey = (schedule: Schedule) => schedule.map(({ from, to }) => `${from}-${to}`).join(' ');

const stepsKey = (steps: readonly string[]) => JSON.stringify(steps);

const recurrenceOf = (task: Task) => (task.kind === 'periodica' ? task.recurrence : undefined);
const dueDateOf = (task: Task) => (task.kind === 'puntual' ? task.dueDate : undefined);

/** Removing the field is written as null; undefined is "without the field". */
const nullIfMissing = <T>(value: T | undefined): T | null => (value === undefined ? null : value);

/** The field changed value: undefined is "without the field" and is written as null (removing it). */
function fieldChange<T>(before: T | undefined, after: T | undefined, key: (value: T) => string | number) {
	const same = before === undefined || after === undefined ? before === after : key(before) === key(after);
	return same ? {} : { value: nullIfMissing(after) };
}

/**
 * When the kind changes, both kind fields are written: the one that stops
 * applying is removed even if the document does not have it, and the new one is written
 * even if it ends up empty (a one-off without a due date), so a value left behind
 * by a concurrent edit when that field did not apply does not reappear (§7).
 */
function kindChange(after: Task): TaskChange {
	return { kind: after.kind, dueDate: nullIfMissing(dueDateOf(after)), recurrence: nullIfMissing(recurrenceOf(after)) };
}

/** Of the same kind, the kind fields that changed value. */
function fieldsChange(before: Task, after: Task): TaskChange {
	const change: TaskChange = {};
	const dueDate = fieldChange(dueDateOf(before), dueDateOf(after), (day) => day.getTime());
	if ('value' in dueDate) change.dueDate = dueDate.value;
	const recurrence = fieldChange(recurrenceOf(before), recurrenceOf(after), recurrenceKey);
	if ('value' in recurrence) change.recurrence = recurrence.value;
	return change;
}

/** Emoji, note, first step and minimal version: if they changed, the new value, or null if the task ended up without the field. */
function valueChange(field: 'emoji' | 'note' | 'firstStep' | 'minimalVersion', before: string | undefined, after: string | undefined) {
	return before === after ? {} : { [field]: nullIfMissing(after) };
}

/** Schedule and further steps are a single field each: if it changed, it is written whole, or null if the task ended up without it (§7). */
function wholeFieldChange<T>(field: 'schedule' | 'steps', before: T | undefined, after: T | undefined, key: (value: T) => string | number): TaskChange {
	const change = fieldChange(before, after, key);
	return 'value' in change ? { [field]: change.value } : {};
}

/** The fields in which the two tasks differ; currentStep is not edited in the panel (§6.2). */
function changeBetween(before: Task, after: Task): TaskChange {
	return {
		...wholeFieldChange('schedule', before.schedule, after.schedule, scheduleKey),
		...(before.title !== after.title && { title: after.title }),
		...valueChange('emoji', before.emoji, after.emoji),
		...valueChange('note', before.note, after.note),
		...valueChange('firstStep', before.firstStep, after.firstStep),
		...wholeFieldChange('steps', before.steps, after.steps, stepsKey),
		...valueChange('minimalVersion', before.minimalVersion, after.minimalVersion),
		...(before.kind === after.kind ? fieldsChange(before, after) : kindChange(after))
	};
}

/**
 * Spec §6.2: the same validations as when creating; if any field is
 * invalid, it is rejected whole. It never changes id or createdAt.
 *
 * `task` is the task as it was when the panel was opened (the one that gave the initial
 * data through taskData), not the one that is saved when saving: that way a field
 * that another device changed while the panel was open, and that I did not
 * touch, is not overwritten (§7, the last change per field wins).
 *
 * Spec §5.8: turning a paused recurring task into a one-off resumes it at `now` (the
 * moment of saving); without `now`, it does not resume it. Everything else leaves it paused.
 */
export function edit(task: Task, data: TaskData, now?: Date): EditingResult {
	const result = createFromData(data, task.id, task.createdAt);
	if (!result.ok) return result;
	const change = changeBetween(task, result.task);
	const isResumed = now && isPaused(task) && result.task.kind === 'puntual';
	return { ok: true, change: isResumed ? { ...change, ...resume(now) } : change };
}
