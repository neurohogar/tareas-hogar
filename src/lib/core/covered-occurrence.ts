// Spec §5.3 and §5.6: which occurrences the completions of a calendar recurring
// task (or relative by window) cover. This module is the only one that interprets
// coveredOccurrence.
import { startOfDay, addDays } from './days';
import { firstLaterOccurrence, lastOccurrenceBetween } from './occurrences';
import type { Completion, CalendarRecurrence } from './task';

/** The last instant of the day: any occurrence of that day starts before or at it. */
const dayEnd = (day: Date) => addDays(day, 1).getTime() - 1;

/**
 * How far a completion covers: an occurrence with a time, its start; a
 * date alone, the whole day; without coveredOccurrence (it was made when the task
 * was relative or one-off), the whole day of its completedAt.
 */
function coveredUntil({ coveredOccurrence, completedAt }: Completion): number {
	if (coveredOccurrence === undefined) return dayEnd(completedAt);
	if (coveredOccurrence instanceof Date) return dayEnd(coveredOccurrence);
	return coveredOccurrence.start.getTime();
}

/**
 * Spec §5.6, P in ms: the greatest covered occurrence. Values without a time
 * (date alone, completion without coveredOccurrence and, without completions, the day
 * before createdAt) cover the whole day.
 */
export function lastCovered(createdAt: Date, completions: readonly Completion[]): number {
	if (completions.length === 0) return dayEnd(addDays(createdAt, -1));
	return Math.max(...completions.map(coveredUntil));
}

/** Spec §5.3, P without schedule: the day of the last covered occurrence. */
export function lastCoveredOccurrence(createdAt: Date, completions: readonly Completion[]): Date {
	return startOfDay(new Date(lastCovered(createdAt, completions)));
}

/**
 * The occurrence that a new completion made `now` covers, given P: the most
 * recent uncovered one in (P, today] or, if there is none, N (the first after P).
 */
export function occurrenceThatCovers(recurrence: CalendarRecurrence, p: Date, now: Date): Date {
	const recent = lastOccurrenceBetween(recurrence, p, now);
	return recent === undefined ? firstLaterOccurrence(recurrence, p) : recent;
}
