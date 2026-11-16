import { waitStart } from './completions';
import { startOfDay } from './days';
import type { PendingStatus } from './status';
import { lastCoveredOccurrence } from './covered-occurrence';
import { firstLaterOccurrence } from './occurrences';
import type { Completion, CalendarRecurrence } from './task';

/** Spec §5.3: N, la primera ocurrencia posterior a P (la última ocurrencia cubierta). */
export function nextOccurrence(recurrence: CalendarRecurrence, createdAt: Date, completions: readonly Completion[]): Date {
	return firstLaterOccurrence(recurrence, lastCoveredOccurrence(createdAt, completions));
}

/**
 * Spec §5.3. P = última ocurrencia cubierta, N = la primera ocurrencia posterior a P.
 * hoy < N → en espera; hoy = N → pendiente; hoy > N → atrasada (una sola vez).
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
	// Un inicio de espera posterior a ahora (otro reloj) cuenta como ahora: el progreso queda entre 0 y 1.
	const start = Math.min(waitStart(createdAt, completions), now.getTime());
	return { kind: 'en espera', progress: (now.getTime() - start) / (n - start) };
}
