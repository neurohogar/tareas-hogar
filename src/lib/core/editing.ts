// Spec §6.2 (Editar) y §7 (Conflictos): editar valida como crear y produce
// un cambio parcial, solo con los campos que cambiaron.
import type { CreationErrors } from './creation';
import { createFromData, type TaskData } from './task-data';
import type { TaskChange } from './task-document';
import { isPaused, resume } from './pause';
import type { Schedule, Recurrence, Task } from './task';

export type EditingResult = { ok: true; change: TaskChange } | { ok: false; errors: CreationErrors };

/** Una clave que identifica la recurrencia: dos recurrencias son la misma si tienen la misma clave. */
function recurrenceKey(recurrence: Recurrence): string {
	if (recurrence.mode === 'relativo') return `relativo ${recurrence.every} ${recurrence.unit}`;
	if ('weekdays' in recurrence) return `semanal ${recurrence.weekdays.join(' ')}`;
	return `mensual ${recurrence.monthDays.join(' ')}`;
}

const scheduleKey = (schedule: Schedule) => schedule.map(({ from, to }) => `${from}-${to}`).join(' ');

const stepsKey = (steps: readonly string[]) => JSON.stringify(steps);

const recurrenceOf = (task: Task) => (task.kind === 'periodica' ? task.recurrence : undefined);
const dueDateOf = (task: Task) => (task.kind === 'puntual' ? task.dueDate : undefined);

/** Quitar el campo se escribe como null; undefined es "sin el campo". */
const nullIfMissing = <T>(value: T | undefined): T | null => (value === undefined ? null : value);

/** El campo cambió de valor: undefined es "sin el campo" y se escribe como null (quitarlo). */
function fieldChange<T>(before: T | undefined, after: T | undefined, key: (value: T) => string | number) {
	const same = before === undefined || after === undefined ? before === after : key(before) === key(after);
	return same ? {} : { value: nullIfMissing(after) };
}

/**
 * Al cambiar de tipo se escriben los dos campos de tipo: el que deja de
 * corresponder se quita aunque el documento no lo tenga, y el nuevo se escribe
 * aunque quede vacío (una puntual sin fecha límite), así no reaparece un valor
 * que dejó una edición concurrente cuando ese campo no correspondía (§7).
 */
function kindChange(after: Task): TaskChange {
	return { kind: after.kind, dueDate: nullIfMissing(dueDateOf(after)), recurrence: nullIfMissing(recurrenceOf(after)) };
}

/** Del mismo tipo, los campos de tipo que cambiaron de valor. */
function fieldsChange(before: Task, after: Task): TaskChange {
	const change: TaskChange = {};
	const dueDate = fieldChange(dueDateOf(before), dueDateOf(after), (day) => day.getTime());
	if ('value' in dueDate) change.dueDate = dueDate.value;
	const recurrence = fieldChange(recurrenceOf(before), recurrenceOf(after), recurrenceKey);
	if ('value' in recurrence) change.recurrence = recurrence.value;
	return change;
}

/** Emoji, nota, primer paso y versión mínima: si cambiaron, el valor nuevo, o null si la tarea quedó sin el campo. */
function valueChange(field: 'emoji' | 'note' | 'firstStep' | 'minimalVersion', before: string | undefined, after: string | undefined) {
	return before === after ? {} : { [field]: nullIfMissing(after) };
}

/** Horario y pasos más son un solo campo cada uno: si cambió, se escribe entero, o null si la tarea quedó sin él (§7). */
function wholeFieldChange<T>(field: 'schedule' | 'steps', before: T | undefined, after: T | undefined, key: (value: T) => string | number): TaskChange {
	const change = fieldChange(before, after, key);
	return 'value' in change ? { [field]: change.value } : {};
}

/** Los campos en que difieren las dos tareas; pasoActual no se edita en el panel (§6.2). */
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
 * Spec §6.2: las mismas validaciones que al crear; si algún campo es
 * inválido, se rechaza entera. Nunca cambia id ni creadaEn.
 *
 * `tarea` es la tarea como estaba al abrir el panel (la que dio los datos
 * iniciales con datosDeTarea), no la que hay guardada al guardar: así un campo
 * que cambió otro dispositivo mientras el panel estaba abierto, y que yo no
 * toqué, no se pisa (§7, gana el último cambio por campo).
 *
 * Spec §5.8: pasar a puntual una periódica pausada la reanuda en `ahora` (el
 * momento de guardar); sin `ahora`, no la reanuda. Lo demás la deja pausada.
 */
export function edit(task: Task, data: TaskData, now?: Date): EditingResult {
	const result = createFromData(data, task.id, task.createdAt);
	if (!result.ok) return result;
	const change = changeBetween(task, result.task);
	const isResumed = now && isPaused(task) && result.task.kind === 'puntual';
	return { ok: true, change: isResumed ? { ...change, ...resume(now) } : change };
}
