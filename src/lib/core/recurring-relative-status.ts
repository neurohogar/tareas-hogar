import { lastCompletedAt } from './completions';
import type { PendingStatus } from './status';
import type { WaitMoments } from './status-with-schedule';
import type { Completion, RelativeRecurrence } from './task';

const MS_PER_HOUR = 3_600_000;
const HOURS_PER_UNIT = { horas: 1, dias: 24 } as const;

function intervalInMs(recurrence: RelativeRecurrence): number {
	return recurrence.every * HOURS_PER_UNIT[recurrence.unit] * MS_PER_HOUR;
}

/** Spec §5.2, in ms: U, V = U + interval and V + interval (from there, overdue). */
interface Deadlines {
	last: number;
	returnsToPending: number;
	overdueFrom: number;
}

/** Only for a relative task with at least one completion. */
function deadlines(recurrence: RelativeRecurrence, completions: readonly Completion[]): Deadlines {
	const last = lastCompletedAt(completions);
	const interval = intervalInMs(recurrence);
	return { last, returnsToPending: last + interval, overdueFrom: last + 2 * interval };
}

/**
 * Spec §5.2. U = most recent completedAt, V = U + interval.
 * Never completed → pending; now < V → waiting; V ≤ now < V + interval
 * → pending; now ≥ V + interval → overdue.
 */
export function recurringRelativeStatus(
	recurrence: RelativeRecurrence,
	completions: readonly Completion[],
	now: Date
): PendingStatus {
	if (completions.length === 0) return { kind: 'pendiente' };

	const { last, returnsToPending, overdueFrom } = deadlines(recurrence, completions);
	const moment = now.getTime();

	if (moment < returnsToPending)
		return { kind: 'en espera', progress: Math.max(0, moment - last) / (returnsToPending - last) };
	if (moment < overdueFrom) return { kind: 'pendiente' };
	return { kind: 'atrasada' };
}

/**
 * Spec §6.1 for a relative task: never completed, pending since createdAt; otherwise,
 * overdue since V + interval, and pending since V or waiting until V.
 */
export function relativeUrgencyInstant(
	recurrence: RelativeRecurrence,
	createdAt: Date,
	completions: readonly Completion[],
	status: PendingStatus
): Date {
	if (completions.length === 0) return createdAt;
	const { returnsToPending, overdueFrom } = deadlines(recurrence, completions);
	return new Date(status.kind === 'atrasada' ? overdueFrom : returnsToPending);
}

/**
 * Spec §5.5 for a relative task: it would become pending at V (never completed,
 * createdAt), waits since U (or createdAt) and, without a schedule, becomes overdue at V + interval.
 */
export function relativeMoments(
	recurrence: RelativeRecurrence,
	createdAt: Date,
	completions: readonly Completion[]
): WaitMoments {
	if (completions.length === 0) return { becomesPending: createdAt.getTime(), waitStart: createdAt.getTime() };
	const { last, returnsToPending, overdueFrom } = deadlines(recurrence, completions);
	return { becomesPending: returnsToPending, waitStart: last, overdueWithoutSchedule: overdueFrom };
}
