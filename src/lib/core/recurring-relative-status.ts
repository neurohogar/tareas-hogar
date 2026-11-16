import { lastCompletedAt } from './completions';
import type { PendingStatus } from './status';
import type { WaitMoments } from './status-with-schedule';
import type { Completion, RelativeRecurrence } from './task';

const MS_PER_HOUR = 3_600_000;
const HOURS_PER_UNIT = { horas: 1, dias: 24 } as const;

function intervalInMs(recurrence: RelativeRecurrence): number {
	return recurrence.every * HOURS_PER_UNIT[recurrence.unit] * MS_PER_HOUR;
}

/** Spec §5.2, en ms: U, V = U + intervalo y V + intervalo (desde ahí, atrasada). */
interface Deadlines {
	last: number;
	returnsToPending: number;
	overdueFrom: number;
}

/** Solo para una relativa con al menos un completado. */
function deadlines(recurrence: RelativeRecurrence, completions: readonly Completion[]): Deadlines {
	const last = lastCompletedAt(completions);
	const interval = intervalInMs(recurrence);
	return { last, returnsToPending: last + interval, overdueFrom: last + 2 * interval };
}

/**
 * Spec §5.2. U = completadoEn más reciente, V = U + intervalo.
 * Nunca completada → pendiente; ahora < V → en espera; V ≤ ahora < V + intervalo
 * → pendiente; ahora ≥ V + intervalo → atrasada.
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
 * Spec §6.1 para una relativa: nunca completada, pendiente desde creadaEn; si
 * no, atrasada desde V + intervalo, y pendiente desde V o en espera hasta V.
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
 * Spec §5.5 para una relativa: pasaría a pendiente en V (nunca completada,
 * creadaEn), espera desde U (o creadaEn) y, sin horario, se atrasa en V + intervalo.
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
