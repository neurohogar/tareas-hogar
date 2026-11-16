// Spec §4.1 y §5.5: el horario de una tarea, una o más ventanas diarias
// [desde, hasta) en las que se puede completar. Horas locales "HH:MM" de 24 h,
// desde < hasta, ordenadas por desde y sin superponerse.
import { atTheMinute, addDays } from './days';
import type { Schedule, TimeWindow } from './task';

/** Lo que escribe el panel en una fila Desde/Hasta: cada hora puede faltar o venir vacía. */
export interface TypedWindow {
	from?: string;
	to?: string;
}

/** Las filas Desde/Hasta del panel, en el orden en que se escribieron. */
export type TypedSchedule = TypedWindow[];

/** variasEnHoras: más de una ventana en una relativa en horas (§4.1); lo detecta la relativa. */
export type ScheduleError = 'incompleto' | 'finNoPosterior' | 'superpuestos' | 'variasEnHoras';

export type ScheduleReading = { ok: true; schedule?: Schedule } | { ok: false; error: ScheduleError };

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Minutos desde las 00:00, o undefined si no es una hora HH:MM. */
function minutesOf(hour: string | undefined): number | undefined {
	const parts = hour === undefined ? null : TIME_RE.exec(hour);
	return parts ? Number(parts[1]) * 60 + Number(parts[2]) : undefined;
}

const isComplete = ({ from, to }: TypedWindow) => minutesOf(from) !== undefined && minutesOf(to) !== undefined;

/** Un horario guardado siempre es válido. */
const minutes = (hour: string) => minutesOf(hour) as number;

const laterEnd = ({ from, to }: TimeWindow) => minutes(from) < minutes(to);

/** Ya ordenadas por desde: se superponen si una empieza antes de que termine la anterior. */
const overlapping = (ordered: Schedule) => ordered.some((timeWindow, i) => i > 0 && minutes(timeWindow.from) < minutes(ordered[i - 1].to));

/**
 * Spec §4.1: sin ventanas escritas, la tarea no tiene horario. Con una hora
 * que falta (o que no es HH:MM), está incompleto; con desde ≥ hasta, la hora
 * de fin no es posterior a la de inicio; con ventanas que se pisan, se
 * superponen. Si es válido, las ventanas quedan ordenadas por desde.
 */
export function readSchedule(typedOne: TypedSchedule | undefined): ScheduleReading {
	if (typedOne === undefined || typedOne.length === 0) return { ok: true };
	if (!typedOne.every(isComplete)) return { ok: false, error: 'incompleto' };
	const timeWindows = (typedOne as Schedule).map(({ from, to }) => ({ from, to }));
	if (!timeWindows.every(laterEnd)) return { ok: false, error: 'finNoPosterior' };
	const ordered = timeWindows.sort((a, b) => minutes(a.from) - minutes(b.from));
	if (overlapping(ordered)) return { ok: false, error: 'superpuestos' };
	return { ok: true, schedule: ordered };
}

/** Spec §4.1: un documento con una sola ventana (el formato anterior) se lee como una lista de una. */
export function savedSchedule(savedValue: TimeWindow | Schedule): Schedule {
	return Array.isArray(savedValue) ? savedValue : [savedValue];
}

/** Una ventana en un día dado (§5.6: una ocurrencia), en ms: [inicio, cierre). */
export interface Occurrence {
	start: number;
	closing: number;
}

/** Las ventanas del día, en orden, en ms. */
export function occurrencesOfDay(schedule: Schedule, day: Date): Occurrence[] {
	return schedule.map(({ from, to }) => ({
		start: atTheMinute(day, minutes(from)).getTime(),
		closing: atTheMinute(day, minutes(to)).getTime()
	}));
}

/** Las ventanas de ayer, hoy y mañana respecto de `momento`, en orden. */
const windowsAround = (schedule: Schedule, moment: Date) =>
	[-1, 0, 1].flatMap((days) => occurrencesOfDay(schedule, addDays(moment, days)));

/** Spec §5.5: A (el primer instante ≥ desde que cae en una ventana) y C (el hasta de esa ventana), en ms. */
export function availableWindow(schedule: Schedule, from: Date): { available: number; closing: number } {
	const moment = from.getTime();
	const { start, closing } = windowsAround(schedule, from).find((timeWindow) => moment < timeWindow.closing) as Occurrence;
	return { available: Math.max(moment, start), closing };
}

export function withinSchedule(schedule: Schedule, now: Date): boolean {
	return availableWindow(schedule, now).available === now.getTime();
}

/** El hasta de la última ventana del día, en ms. */
export function endOfDay(schedule: Schedule, day: Date): number {
	return (occurrencesOfDay(schedule, day).at(-1) as Occurrence).closing;
}

/** El hasta de la última ventana que cerró hasta ahora (inclusive), en ms. */
export function lastClosing(schedule: Schedule, now: Date): number {
	const closed = windowsAround(schedule, now).filter(({ closing }) => closing <= now.getTime());
	return (closed.at(-1) as Occurrence).closing;
}

/** Spec §6.1: el horario en la fila, "08:00–11:00"; con varias ventanas, separadas por " · ". */
export function scheduleText(schedule: Schedule): string {
	return schedule.map(({ from, to }) => `${from}–${to}`).join(' · ');
}
