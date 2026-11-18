// Spec §4.1 and §5.5: the schedule of a task, one or more daily windows
// [from, to) in which it can be completed. Local "HH:MM" times of 24 h,
// from < to, ordered by from and non-overlapping.
import { atTheMinute, addDays } from './days';
import type { Schedule, TimeWindow } from './task';

/** What the panel writes in a From/To row: each time may be missing or come empty. */
export interface TypedWindow {
	from?: string;
	to?: string;
}

/** The From/To rows of the panel, in the order they were written. */
export type TypedSchedule = TypedWindow[];

/** variasEnHoras: more than one window in a relative task in hours (§4.1); detected by the relative task. */
export type ScheduleError = 'incompleto' | 'finNoPosterior' | 'superpuestos' | 'variasEnHoras';

export type ScheduleReading = { ok: true; schedule?: Schedule } | { ok: false; error: ScheduleError };

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Minutes since 00:00, or undefined if it is not an HH:MM time. */
function minutesOf(hour: string | undefined): number | undefined {
	const parts = hour === undefined ? null : TIME_RE.exec(hour);
	return parts ? Number(parts[1]) * 60 + Number(parts[2]) : undefined;
}

const isComplete = ({ from, to }: TypedWindow) => minutesOf(from) !== undefined && minutesOf(to) !== undefined;

/** A stored schedule is always valid. */
const minutes = (hour: string) => minutesOf(hour) as number;

const laterEnd = ({ from, to }: TimeWindow) => minutes(from) < minutes(to);

/** Already ordered by from: they overlap if one starts before the previous one ends. */
const overlapping = (ordered: Schedule) => ordered.some((timeWindow, i) => i > 0 && minutes(timeWindow.from) < minutes(ordered[i - 1].to));

/**
 * Spec §4.1: without written windows, the task has no schedule. With a time
 * that is missing (or is not HH:MM), it is incomplete; with from ≥ to, the end
 * time is not later than the start one; with windows that overlap, they are
 * overlapping. If valid, the windows are ordered by from.
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

/** Spec §4.1: a document with a single window (the previous format) is read as a list of one. */
export function savedSchedule(savedValue: TimeWindow | Schedule): Schedule {
	return Array.isArray(savedValue) ? savedValue : [savedValue];
}

/** A window on a given day (§5.6: an occurrence), in ms: [start, close). */
export interface Occurrence {
	start: number;
	closing: number;
}

/** The windows of the day, in order, in ms. */
export function occurrencesOfDay(schedule: Schedule, day: Date): Occurrence[] {
	return schedule.map(({ from, to }) => ({
		start: atTheMinute(day, minutes(from)).getTime(),
		closing: atTheMinute(day, minutes(to)).getTime()
	}));
}

/** The windows of yesterday, today and tomorrow relative to `moment`, in order. */
const windowsAround = (schedule: Schedule, moment: Date) =>
	[-1, 0, 1].flatMap((days) => occurrencesOfDay(schedule, addDays(moment, days)));

/** Spec §5.5: A (the first instant ≥ from that falls in a window) and C (the to of that window), in ms. */
export function availableWindow(schedule: Schedule, from: Date): { available: number; closing: number } {
	const moment = from.getTime();
	const { start, closing } = windowsAround(schedule, from).find((timeWindow) => moment < timeWindow.closing) as Occurrence;
	return { available: Math.max(moment, start), closing };
}

export function withinSchedule(schedule: Schedule, now: Date): boolean {
	return availableWindow(schedule, now).available === now.getTime();
}

/** The to of the last window of the day, in ms. */
export function endOfDay(schedule: Schedule, day: Date): number {
	return (occurrencesOfDay(schedule, day).at(-1) as Occurrence).closing;
}

/** The to of the last window that closed up to now (inclusive), in ms. */
export function lastClosing(schedule: Schedule, now: Date): number {
	const closed = windowsAround(schedule, now).filter(({ closing }) => closing <= now.getTime());
	return (closed.at(-1) as Occurrence).closing;
}

/** Spec §6.1: the schedule on the row, "08:00–11:00"; with several windows, separated by " · ". */
export function scheduleText(schedule: Schedule): string {
	return schedule.map(({ from, to }) => `${from}–${to}`).join(' · ');
}
