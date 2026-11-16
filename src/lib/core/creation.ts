import { effortFields } from './effort';
import { readEmoji, type EmojiReading } from './emoji';
import type { NameError } from './label';
import { readSchedule, type ScheduleError, type TypedSchedule, type ScheduleReading } from './schedule';
import { textFields } from './text-fields';
import { trimText } from './free-text';
import { normalizeSteps } from './steps';
import type { Effort, Recurrence, Task, RecurringTask } from './task';

/** Un motivo de rechazo por regla de validación (spec §4.1 y §4.2). */
export interface CreationErrors {
	title?: 'vacio';
	emoji?: 'invalido';
	every?: 'invalido';
	days?: 'faltan' | 'diaDelMesInvalido' | 'combinados';
	dueDate?: 'invalida';
	schedule?: ScheduleError;
	/** Un nombre de etiqueta escrito en el panel (§4.3). */
	labels?: NameError;
}

/**
 * Los motivos de rechazo propios del tipo de tarea, además del título. El del
 * horario es el que solo depende del tipo (§4.1: varias ventanas en una
 * relativa en horas); uno del horario mismo tiene prioridad.
 */
type KindErrors = Omit<CreationErrors, 'title' | 'emoji' | 'labels'>;
export type RecurrenceErrors = Omit<KindErrors, 'dueDate'>;

const emojiFields = (reading: EmojiReading) => (reading.ok && reading.emoji !== undefined ? { emoji: reading.emoji } : {});

const scheduleFields = (reading: ScheduleReading) => (reading.ok && reading.schedule ? { schedule: reading.schedule } : {});

/** Spec §4.1: la nota y la versión mínima se recortan; vacías o solo espacios son sin el campo. */
const freeTextFields = (note: string, minimalVersion: string) => textFields({ note: trimText(note), minimalVersion: trimText(minimalVersion) });

/** Lo que distingue a un tipo de tarea, sin lo común (id, título, creadaEn). */
type KindData<T extends Task> = Omit<T, 'id' | 'title' | 'emoji' | 'note' | 'firstStep' | 'steps' | 'minimalVersion' | 'effort' | 'schedule' | 'createdAt' | 'labels'>;

export type CreationResult<T extends Task = Task> =
	| { ok: true; task: T }
	| { ok: false; errors: CreationErrors };

/** Lo que escribe el panel en los campos comunes a todo tipo de tarea. */
export interface CommonData {
	title: string;
	/** Tal como se escribió: leerEmoji lo valida (§4.1). */
	emoji?: string;
	/** Tal como se escribió: recortarTexto lo recorta (§4.1). */
	note?: string;
	/** Tal como se escribió: normalizarPasos lo recorta junto con los pasos más (§4.1). */
	firstStep?: string;
	/** Los pasos 2 en adelante, tal como se escribieron, vacíos incluidos (§4.1, Pasos). */
	steps?: readonly string[];
	/** Tal como se escribió: recortarTexto lo recorta (§4.1, Versión mínima). */
	minimalVersion?: string;
	/** Tal como se escribió; sin él, la tarea no tiene horario. leerHorario lo valida (§4.1). */
	schedule?: TypedSchedule;
	/** Sin él, la tarea queda sin estimar (§4.1). */
	effort?: Effort;
}

interface High extends CommonData {
	id: string;
	now: Date;
}

/**
 * Spec §4.1: el título se guarda sin los espacios de los extremos y no puede
 * quedar vacío; el emoji y el horario, si los hay, tienen que ser válidos.
 * Junta esos errores con los del tipo; si no hay ninguno, crea la
 * tarea con lo que arma `datosDelTipo`.
 */
export function createTask<T extends Task>(
	{ title, emoji = '', note = '', firstStep, steps, minimalVersion = '', schedule, effort, id, now }: High,
	kindErrors: KindErrors,
	kindData: () => KindData<T>
): CreationResult<T> {
	const savedValue = title.trim();
	const reading = readEmoji(emoji);
	const scheduleRead = readSchedule(schedule);
	const errors: CreationErrors = {
		...(savedValue === '' && { title: 'vacio' as const }),
		...(!reading.ok && { emoji: 'invalido' as const }),
		...kindErrors,
		...(!scheduleRead.ok && { schedule: scheduleRead.error })
	};
	if (Object.keys(errors).length > 0) return { ok: false, errors };
	const fields = { ...emojiFields(reading), ...freeTextFields(note, minimalVersion), ...normalizeSteps(firstStep, steps), ...scheduleFields(scheduleRead), ...effortFields(effort) };
	// TypeScript no reconstruye T a partir de Omit<T, …> y las claves omitidas.
	return { ok: true, task: { id, title: savedValue, ...fields, ...kindData(), createdAt: now } as T };
}

export function createRecurring(
	high: High,
	recurrenceErrors: RecurrenceErrors,
	recurrence: () => Recurrence
): CreationResult<RecurringTask> {
	return createTask<RecurringTask>(high, recurrenceErrors, () => ({ kind: 'periodica', recurrence: recurrence() }));
}
