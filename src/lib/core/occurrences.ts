// Occurrence days of a calendar recurrence (spec §4.2).
import { weekday, dayOfMonth, startOfDay, addDays, lastDayOfMonth } from './days';
import type { CalendarRecurrence } from './task';

/** A valid recurrence occurs at least once a month: there are never more than 31 days between two occurrences. */
const MAX_DAYS_BETWEEN_OCCURRENCES = 31;

/** A day of the month that does not exist in that month falls on its last day. */
export function isOccurrence(recurrence: CalendarRecurrence, day: Date): boolean {
	if ('weekdays' in recurrence) return recurrence.weekdays.includes(weekday(day));
	const last = lastDayOfMonth(day);
	return recurrence.monthDays.some((chosenOne) => Math.min(chosenOne, last) === dayOfMonth(day));
}

/**
 * The first occurrence strictly later than the day of `afterOf`. Only
 * throws if the recurrence violates §4.2 (for example, if it has no days).
 */
export function firstLaterOccurrence(recurrence: CalendarRecurrence, afterOf: Date): Date {
	const from = startOfDay(afterOf);
	for (let steps = 1; steps <= MAX_DAYS_BETWEEN_OCCURRENCES; steps++) {
		const day = addDays(from, steps);
		if (isOccurrence(recurrence, day)) return day;
	}
	throw new Error('The recurrence has no occurrence days');
}

/** The most recent occurrence in (from, to], or undefined if there is none. */
export function lastOccurrenceBetween(
	recurrence: CalendarRecurrence,
	from: Date,
	to: Date
): Date | undefined {
	for (let day = startOfDay(to); day > from; day = addDays(day, -1)) {
		if (isOccurrence(recurrence, day)) return day;
	}
	return undefined;
}
