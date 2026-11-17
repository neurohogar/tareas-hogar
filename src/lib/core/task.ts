// Modelo de dominio (spec §4). Solo lo que usa la rebanada actual.

export type Unit = 'horas' | 'dias';

export interface RelativeRecurrence {
	mode: 'relativo';
	every: number;
	unit: Unit;
}

/** De lunes a domingo, en el orden de la semana. */
export const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;

export type Weekday = (typeof WEEKDAYS)[number];

/** Spec §4.2: al menos un día de la semana, sin repetir, en el orden de la semana. */
export interface WeeklyRecurrence {
	mode: 'calendario';
	weekdays: Weekday[];
}

/** Los días del mes que se pueden elegir (spec §4.2), de menor a mayor. */
export const MONTH_DAYS: readonly number[] = Array.from({ length: 31 }, (_, index) => index + 1);

/** Spec §4.2: al menos un día del mes (1..31), sin repetir, de menor a mayor. */
export interface MonthlyRecurrence {
	mode: 'calendario';
	monthDays: number[];
}

export type CalendarRecurrence = WeeklyRecurrence | MonthlyRecurrence;

export type Recurrence = RelativeRecurrence | CalendarRecurrence;

/** Spec §4.1: una ventana diaria [desde, hasta) en la que se puede completar; horas locales "HH:MM", desde < hasta. */
export interface TimeWindow {
	from: string;
	to: string;
}

/** Spec §4.1: una o más ventanas, ordenadas por desde y sin superponerse. */
export type Schedule = TimeWindow[];

/** Spec §4.1 y §5.9: un solo campo; sin él, la tarea no está pospuesta. */
export interface Postponement {
	from: Date;
	to: Date;
}

export interface RecurringTask {
	id: string;
	title: string;
	/** Spec §4.1: un solo emoji; sin el campo, la tarea no tiene emoji. */
	emoji?: string;
	/** Spec §4.1: texto libre, ya recortado; sin el campo, la tarea no tiene nota. */
	note?: string;
	/** Spec §4.1: una línea, ya recortada; sin el campo, la tarea no tiene primer paso. */
	firstStep?: string;
	/** Spec §4.1 (Pasos): los pasos 2 en adelante, ya recortados y sin vacíos; sin el campo, no hay más pasos. */
	steps?: string[];
	/** Spec §4.1 (Pasos): el número del paso en que va la tarea; sin el campo, el paso 1. */
	currentStep?: number;
	/** Spec §4.1 (Versión mínima): una línea, ya recortada; sin el campo, la tarea no tiene versión mínima. */
	minimalVersion?: string;
	kind: 'periodica';
	recurrence: Recurrence;
	/** Spec §4.1 y §5.5: sin el campo, se puede completar a cualquier hora. */
	schedule?: Schedule;
	createdAt: Date;
	/** Spec §4.1 y §5.8: sin el campo (o en false), no está pausada. */
	paused?: boolean;
	/** Spec §4.1 y §5.8: la última vez que se reanudó; desde ahí se evalúa como recién creada. */
	resumedAt?: Date;
	postponed?: Postponement;
}

/** Spec §4.1: se hace una sola vez; la fecha límite es un día, a las 00:00 locales. */
export interface OneOffTask {
	id: string;
	title: string;
	/** Spec §4.1: un solo emoji; sin el campo, la tarea no tiene emoji. */
	emoji?: string;
	/** Spec §4.1: texto libre, ya recortado; sin el campo, la tarea no tiene nota. */
	note?: string;
	/** Spec §4.1: una línea, ya recortada; sin el campo, la tarea no tiene primer paso. */
	firstStep?: string;
	/** Spec §4.1 (Pasos): los pasos 2 en adelante, ya recortados y sin vacíos; sin el campo, no hay más pasos. */
	steps?: string[];
	/** Spec §4.1 (Pasos): el número del paso en que va la tarea; sin el campo, el paso 1. */
	currentStep?: number;
	/** Spec §4.1 (Versión mínima): una línea, ya recortada; sin el campo, la tarea no tiene versión mínima. */
	minimalVersion?: string;
	kind: 'puntual';
	dueDate?: Date;
	/** Spec §4.1 y §5.5: sin el campo, se puede completar a cualquier hora. */
	schedule?: Schedule;
	createdAt: Date;
	postponed?: Postponement;
}

export type Task = RecurringTask | OneOffTask;

/** Spec §4.4: una ocurrencia con horario, identificada por su inicio (el día a la hora desde de su ventana). */
export interface OccurrenceStart {
	start: Date;
}

/**
 * Spec §4.4: una fecha (a las 00:00 locales; sin horario, o de antes de los
 * varios horarios) o el inicio de una ocurrencia con horario. Son formatos
 * distintos: una ventana que empieza a las 00:00 no se confunde con una fecha.
 */
export type CoveredOccurrence = Date | OccurrenceStart;

export interface Completion {
	id: string;
	taskId: string;
	completedAt: Date;
	/** En modo calendario (§5.3, §5.6) y en relativas con varias ventanas (§5.7). */
	coveredOccurrence?: CoveredOccurrence;
	/** Spec §4.4: el paso en que iba la tarea al completarla; solo en tareas de dos pasos o más. */
	stepAtCompletion?: number;
	/** Spec §4.4: true si fue «Hice la mínima»; sin el campo, el completado fue entero. Se fija al completar. */
	wasMinimal?: boolean;
}
