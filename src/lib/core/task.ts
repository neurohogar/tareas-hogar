// Domain model (spec §4). Only what the current slice uses.

export type Unit = 'horas' | 'dias';

export interface RelativeRecurrence {
	mode: 'relativo';
	every: number;
	unit: Unit;
}

/** From Monday to Sunday, in the order of the week. */
export const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;

export type Weekday = (typeof WEEKDAYS)[number];

/** Spec §4.2: at least one weekday, without repeating, in the order of the week. */
export interface WeeklyRecurrence {
	mode: 'calendario';
	weekdays: Weekday[];
}

/** The days of the month that can be chosen (spec §4.2), from lowest to highest. */
export const MONTH_DAYS: readonly number[] = Array.from({ length: 31 }, (_, index) => index + 1);

/** Spec §4.2: at least one day of the month (1..31), without repeating, from lowest to highest. */
export interface MonthlyRecurrence {
	mode: 'calendario';
	monthDays: number[];
}

export type CalendarRecurrence = WeeklyRecurrence | MonthlyRecurrence;

export type Recurrence = RelativeRecurrence | CalendarRecurrence;

/** Spec §4.1: a daily window [from, to) in which it can be completed; local "HH:MM" times, from < to. */
export interface TimeWindow {
	from: string;
	to: string;
}

/** Spec §4.1: one or more windows, ordered by from and non-overlapping. */
export type Schedule = TimeWindow[];

/** Spec §4.1 and §5.9: a single field; without it, the task is not postponed. */
export interface Postponement {
	from: Date;
	to: Date;
}

export interface RecurringTask {
	id: string;
	title: string;
	/** Spec §4.1: a single emoji; without the field, the task has no emoji. */
	emoji?: string;
	/** Spec §4.1: free text, already trimmed; without the field, the task has no note. */
	note?: string;
	/** Spec §4.1: a line, already trimmed; without the field, the task has no first step. */
	firstStep?: string;
	/** Spec §4.1 (Steps): steps 2 onward, already trimmed and without empties; without the field, there are no more steps. */
	steps?: string[];
	/** Spec §4.1 (Steps): the number of the step the task is on; without the field, step 1. */
	currentStep?: number;
	/** Spec §4.1 (Minimal version): a line, already trimmed; without the field, the task has no minimal version. */
	minimalVersion?: string;
	/** Spec §4.1 (Essential): stored only as true; without the field, the task is not essential. */
	essential?: boolean;
	kind: 'periodica';
	recurrence: Recurrence;
	/** Spec §4.1 and §5.5: without the field, it can be completed at any hour. */
	schedule?: Schedule;
	createdAt: Date;
	/** Spec §4.1 and §5.8: without the field (or false), it is not paused. */
	paused?: boolean;
	/** Spec §4.1 and §5.8: the last time it was resumed; from then on it is evaluated as just created. */
	resumedAt?: Date;
	postponed?: Postponement;
}

/** Spec §4.1: done only once; the due date is a day, at 00:00 local. */
export interface OneOffTask {
	id: string;
	title: string;
	/** Spec §4.1: a single emoji; without the field, the task has no emoji. */
	emoji?: string;
	/** Spec §4.1: free text, already trimmed; without the field, the task has no note. */
	note?: string;
	/** Spec §4.1: a line, already trimmed; without the field, the task has no first step. */
	firstStep?: string;
	/** Spec §4.1 (Steps): steps 2 onward, already trimmed and without empties; without the field, there are no more steps. */
	steps?: string[];
	/** Spec §4.1 (Steps): the number of the step the task is on; without the field, step 1. */
	currentStep?: number;
	/** Spec §4.1 (Minimal version): a line, already trimmed; without the field, the task has no minimal version. */
	minimalVersion?: string;
	/** Spec §4.1 (Essential): stored only as true; without the field, the task is not essential. */
	essential?: boolean;
	kind: 'puntual';
	dueDate?: Date;
	/** Spec §4.1 and §5.5: without the field, it can be completed at any hour. */
	schedule?: Schedule;
	createdAt: Date;
	postponed?: Postponement;
}

export type Task = RecurringTask | OneOffTask;

/** Spec §4.4: an occurrence with a schedule, identified by its start (the day at the from time of its window). */
export interface OccurrenceStart {
	start: Date;
}

/**
 * Spec §4.4: a date (at 00:00 local; without a schedule, or from before the
 * several schedules) or the start of an occurrence with a schedule. They are different
 * formats: a window that starts at 00:00 is not mistaken for a date.
 */
export type CoveredOccurrence = Date | OccurrenceStart;

export interface Completion {
	id: string;
	taskId: string;
	completedAt: Date;
	/** In calendar mode (§5.3, §5.6) and in relative tasks with several windows (§5.7). */
	coveredOccurrence?: CoveredOccurrence;
	/** Spec §4.4: the step the task was on when it was completed; only in tasks of two steps or more. */
	stepAtCompletion?: number;
	/** Spec §4.4: true if it was «Hice la mínima»; without the field, the completion was full. */
	wasMinimal?: boolean;
}
