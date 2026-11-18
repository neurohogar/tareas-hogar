import { waitStart } from './completions';
import { startOfDay } from './days';
import type { PendingStatus } from './status';
import { lastCoveredOccurrence } from './covered-occurrence';
import { firstLaterOccurrence } from './occurrences';
import type { Completion, CalendarRecurrence } from './task';

/** Spec §5.3: N, the first occurrence later than P (the last covered occurrence). */
export function nextOccurrence(recurrence: CalendarRecurrence, createdAt: Date, completions: readonly Completion[]): Date {
	return firstLaterOccurrence(recurrence, lastCoveredOccurrence(createdAt, completions));
}

/**
 * Spec §5.3. P = last covered occurrence, N = the first occurrence later than P.
 * today < N → waiting; today = N → pending; today > N → overdue (only once).
 */
export function recurringCalendarStatus(
	recurrence: CalendarRecurrence,
	createdAt: Date,
	completions: readonly Completion[],
	now: Date
): PendingStatus {
	const n = nextOccurrence(recurrence, createdAt, completions).getTime();
	const today = startOfDay(now).getTime();

	if (today > n) return { kind: 'atrasada' };
	if (today === n) return { kind: 'pendiente' };
	// A wait start later than now (another clock) counts as now: the progress stays between 0 and 1.
	const start = Math.min(waitStart(createdAt, completions), now.getTime());
	return { kind: 'en espera', progress: (now.getTime() - start) / (n - start) };
}
