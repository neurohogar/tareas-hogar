// What is loaded into the panel of a task (spec §6.2), the same on creating and
// on editing: the title and the fields of the shape chosen in "Se repite".
import { textFields } from './text-fields';
import type { CreationResult } from './creation';
import { createRecurringCalendar, type RecurringCalendarData } from './create-recurring-calendar';
import { createRecurringRelative, type RecurringRelativeData } from './create-recurring-relative';
import { createOneOff, type OneOffData } from './create-one-off';
import { isoDay } from './days';
import type { Task } from './task';

export type TaskData =
	| ({ shape: 'puntual' } & OneOffData)
	| ({ shape: 'relativa' } & RecurringRelativeData)
	| ({ shape: 'calendario' } & RecurringCalendarData);

/** Spec §6.2: the values the panel opens with when creating; "Se repite" comes as No se repite (one-off). */
export const DATA_ON_CREATE: TaskData = { shape: 'puntual', title: '' };

/** Validates the data with the rules of its shape (§4.1–§4.2) and, if valid, builds the task. */
export function createFromData(data: TaskData, id: string, now: Date): CreationResult {
	if (data.shape === 'puntual') return createOneOff(data, id, now);
	if (data.shape === 'relativa') return createRecurringRelative(data, id, now);
	return createRecurringCalendar(data, id, now);
}

/** The current values of the task, as the panel loads them when editing: the inverse of createFromData. */
export function taskData(task: Task): TaskData {
	const { title, emoji, note, firstStep, steps, minimalVersion, schedule } = task;
	const commons = { title, ...textFields({ emoji, note, firstStep, minimalVersion }), ...(steps && { steps: [...steps] }), ...(schedule && { schedule: schedule.map((timeWindow) => ({ ...timeWindow })) }) };
	if (task.kind === 'puntual')
		return { shape: 'puntual', ...commons, ...(task.dueDate && { dueDate: isoDay(task.dueDate) }) };
	const { recurrence } = task;
	if (recurrence.mode === 'relativo') return { shape: 'relativa', ...commons, every: recurrence.every, unit: recurrence.unit };
	if ('weekdays' in recurrence) return { shape: 'calendario', ...commons, weekdays: [...recurrence.weekdays], monthDays: [] };
	return { shape: 'calendario', ...commons, weekdays: [], monthDays: [...recurrence.monthDays] };
}
