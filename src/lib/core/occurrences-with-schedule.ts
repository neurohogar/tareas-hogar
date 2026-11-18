// Spec §5.6 and §5.7: with a schedule, an occurrence is a (day, window) pair,
// identified by its start. P, N and the occurrence a completion covers are
// computed over occurrences instead of days.
import { startOfDay, addDays } from './days';
import { occurrencesOfDay, type Occurrence } from './schedule';
import { lastCovered } from './covered-occurrence';
import { isOccurrence, firstLaterOccurrence } from './occurrences';
import type { Completion, Schedule, CalendarRecurrence, RelativeRecurrence } from './task';

/** The first occurrence that meets the condition, walking the days from `day` with `following`. */
function first(schedule: Schedule, day: Date, following: (day: Date) => Date, meets: (occurrence: Occurrence) => boolean): Occurrence {
	for (; ; day = following(day)) {
		const found = occurrencesOfDay(schedule, day).find(meets);
		if (found) return found;
	}
}

/** The first occurrence day of the recurrence from the day of `from` inclusive. */
function firstDayOfOccurrence(recurrence: CalendarRecurrence, from: Date): Date {
	const day = startOfDay(from);
	return isOccurrence(recurrence, day) ? day : firstLaterOccurrence(recurrence, day);
}

/**
 * The occurrence a new completion made `now` covers, given N: before
 * its close, N; otherwise the occurrence with the most recent start ≤ now among
 * the days that count (from that of N).
 */
function whatCovers(schedule: Schedule, n: Occurrence, counts: (day: Date) => boolean, now: Date): Date {
	const moment = now.getTime();
	if (moment < n.closing) return new Date(n.start);
	for (let day = startOfDay(now); ; day = addDays(day, -1)) {
		const started = counts(day) ? occurrencesOfDay(schedule, day).filter(({ start }) => start <= moment) : [];
		const recent = started.at(-1);
		if (recent) return new Date(recent.start);
	}
}

/**
 * Spec §5.6: N, the first occurrence with a start later than P. Spec §5.8: of
 * a resumed task, an occurrence whose window closed up to resumedAt does not count.
 */
export function nextCalendarOccurrence(
	recurrence: CalendarRecurrence,
	schedule: Schedule,
	createdAt: Date,
	completions: readonly Completion[],
	resumedAt?: Date
): Occurrence {
	const p = lastCovered(createdAt, completions);
	const closed = resumedAt?.getTime() ?? Number.NEGATIVE_INFINITY;
	const following = (day: Date) => firstLaterOccurrence(recurrence, day);
	return first(schedule, firstDayOfOccurrence(recurrence, new Date(p)), following, ({ start, closing }) => start > p && closing > closed);
}

/**
 * Spec §5.6: the start of the occurrence a new completion covers: the most
 * recent uncovered one with a start in (P, now] or, if there is none, N.
 */
export function calendarOccurrenceThatCovers(
	recurrence: CalendarRecurrence,
	schedule: Schedule,
	createdAt: Date,
	completions: readonly Completion[],
	now: Date,
	resumedAt?: Date
): Date {
	const n = nextCalendarOccurrence(recurrence, schedule, createdAt, completions, resumedAt);
	return whatCovers(schedule, n, (day) => isOccurrence(recurrence, day), now);
}

/** Spec §5.7: a relative task with more than one window (and the interval in days) is completed once per window. */
export function completesByWindow(recurrence: RelativeRecurrence, schedule: Schedule): boolean {
	return recurrence.unit === 'dias' && schedule.length > 1;
}

/**
 * Spec §5.7, N of a relative task per window: never completed, the first
 * window whose to is later than createdAt; with P, the first window
 * later than P on the day of P or on one every `every` days from there.
 */
export function nextWindowOccurrence(
	recurrence: RelativeRecurrence,
	schedule: Schedule,
	createdAt: Date,
	completions: readonly Completion[]
): Occurrence {
	if (completions.length === 0) return first(schedule, startOfDay(createdAt), (day) => addDays(day, 1), ({ closing }) => closing > createdAt.getTime());
	const p = lastCovered(createdAt, completions);
	return first(schedule, startOfDay(new Date(p)), (day) => addDays(day, recurrence.every), ({ start }) => start > p);
}

/**
 * Spec §5.7: the start of the occurrence a new completion covers of a
 * relative task per window: N, or, if overdue, the window with the most
 * recent start ≤ now, of any day.
 */
export function windowOccurrenceThatCovers(
	recurrence: RelativeRecurrence,
	schedule: Schedule,
	createdAt: Date,
	completions: readonly Completion[],
	now: Date
): Date {
	const n = nextWindowOccurrence(recurrence, schedule, createdAt, completions);
	return whatCovers(schedule, n, () => true, now);
}
