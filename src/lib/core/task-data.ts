// Lo que se carga en el panel de una tarea (spec §6.2), el mismo al crear y
// al editar: el título y los campos de la forma elegida en "Se repite".
import { textFields } from './text-fields';
import type { CreationResult } from './creation';
import { createRecurringCalendar, type RecurringCalendarData } from './create-recurring-calendar';
import { createRecurringRelative, type RecurringRelativeData } from './create-recurring-relative';
import { createOneOff, type OneOffData } from './create-one-off';
import { effortFields } from './effort';
import { isoDay } from './days';
import type { Task } from './task';

export type TaskData =
	| ({ shape: 'puntual' } & OneOffData)
	| ({ shape: 'relativa' } & RecurringRelativeData)
	| ({ shape: 'calendario' } & RecurringCalendarData);

/** Spec §6.2: los valores con que abre el panel al crear; "Se repite" viene en No se repite (puntual). */
export const DATA_ON_CREATE: TaskData = { shape: 'puntual', title: '' };

/** Valida los datos con las reglas de su forma (§4.1–§4.2) y, si son válidos, arma la tarea. */
export function createFromData(data: TaskData, id: string, now: Date): CreationResult {
	if (data.shape === 'puntual') return createOneOff(data, id, now);
	if (data.shape === 'relativa') return createRecurringRelative(data, id, now);
	return createRecurringCalendar(data, id, now);
}

/** Los valores actuales de la tarea, como los carga el panel al editar: la inversa de crearSegunDatos. */
export function taskData(task: Task): TaskData {
	const { title, emoji, note, firstStep, steps, minimalVersion, schedule, effort } = task;
	const commons = { title, ...textFields({ emoji, note, firstStep, minimalVersion }), ...(steps && { steps: [...steps] }), ...(schedule && { schedule: schedule.map((timeWindow) => ({ ...timeWindow })) }), ...effortFields(effort) };
	if (task.kind === 'puntual')
		return { shape: 'puntual', ...commons, ...(task.dueDate && { dueDate: isoDay(task.dueDate) }) };
	const { recurrence } = task;
	if (recurrence.mode === 'relativo') return { shape: 'relativa', ...commons, every: recurrence.every, unit: recurrence.unit };
	if ('weekdays' in recurrence) return { shape: 'calendario', ...commons, weekdays: [...recurrence.weekdays], monthDays: [] };
	return { shape: 'calendario', ...commons, weekdays: [], monthDays: [...recurrence.monthDays] };
}
