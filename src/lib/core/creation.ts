import { readEmoji, type EmojiReading } from './emoji';
import { readSchedule, type ScheduleError, type TypedSchedule, type ScheduleReading } from './schedule';
import { textFields } from './text-fields';
import { trimText } from './free-text';
import { normalizeSteps } from './steps';
import { essentialField } from './essential';
import type { Recurrence, Task, RecurringTask } from './task';

/** One reason for rejection per validation rule (spec §4.1 and §4.2). */
export interface CreationErrors {
	title?: 'vacio';
	emoji?: 'invalido';
	every?: 'invalido';
	days?: 'faltan' | 'diaDelMesInvalido' | 'combinados';
	dueDate?: 'invalida';
	schedule?: ScheduleError;
}

/**
 * The reasons for rejection specific to the kind of task, besides the title. The one for the
 * schedule is the one that depends only on the kind (§4.1: several windows in a
 * relative one in hours); one from the schedule itself takes priority.
 */
type KindErrors = Omit<CreationErrors, 'title' | 'emoji'>;
export type RecurrenceErrors = Omit<KindErrors, 'dueDate'>;

const emojiFields = (reading: EmojiReading) => (reading.ok && reading.emoji !== undefined ? { emoji: reading.emoji } : {});

const scheduleFields = (reading: ScheduleReading) => (reading.ok && reading.schedule ? { schedule: reading.schedule } : {});

/** Spec §4.1: the note and the minimal version are trimmed; empty or only spaces means no field. */
const freeTextFields = (note: string, minimalVersion: string) => textFields({ note: trimText(note), minimalVersion: trimText(minimalVersion) });

/** What distinguishes a kind of task, without the common part (id, title, createdAt). */
type KindData<T extends Task> = Omit<T, 'id' | 'title' | 'emoji' | 'note' | 'firstStep' | 'steps' | 'minimalVersion' | 'essential' | 'schedule' | 'createdAt'>;

export type CreationResult<T extends Task = Task> =
	| { ok: true; task: T }
	| { ok: false; errors: CreationErrors };

/** What the panel writes in the fields common to every kind of task. */
export interface CommonData {
	title: string;
	/** As written: readEmoji validates it (§4.1). */
	emoji?: string;
	/** As written: trimText trims it (§4.1). */
	note?: string;
	/** As written: normalizeSteps trims it together with the further steps (§4.1). */
	firstStep?: string;
	/** Steps 2 onward, as written, empty ones included (§4.1, Pasos). */
	steps?: readonly string[];
	/** As written: trimText trims it (§4.1, Versión mínima). */
	minimalVersion?: string;
	/** The Esencial check (§4.1, §6.2); unchecked or absent, the task is not essential. */
	essential?: boolean;
	/** As written; without it, the task has no schedule. readSchedule validates it (§4.1). */
	schedule?: TypedSchedule;
}

interface High extends CommonData {
	id: string;
	now: Date;
}

/**
 * Spec §4.1: the title is saved without the spaces at the ends and cannot
 * end up empty; the emoji and the schedule, if present, have to be valid.
 * It joins those errors with the kind ones; if there are none, it creates the
 * task with what `kindData` builds.
 */
export function createTask<T extends Task>(
	{ title, emoji = '', note = '', firstStep, steps, minimalVersion = '', essential, schedule, id, now }: High,
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
	const fields = { ...emojiFields(reading), ...freeTextFields(note, minimalVersion), ...normalizeSteps(firstStep, steps), ...essentialField(essential), ...scheduleFields(scheduleRead) };
	// TypeScript does not rebuild T from Omit<T, …> and the omitted keys.
	return { ok: true, task: { id, title: savedValue, ...fields, ...kindData(), createdAt: now } as T };
}

export function createRecurring(
	high: High,
	recurrenceErrors: RecurrenceErrors,
	recurrence: () => Recurrence
): CreationResult<RecurringTask> {
	return createTask<RecurringTask>(high, recurrenceErrors, () => ({ kind: 'periodica', recurrence: recurrence() }));
}
