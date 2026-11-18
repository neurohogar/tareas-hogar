// Spec §5.9 (Posponer): which postponement is active and how it changes the task status while it lasts.
import type { Status } from './status';
import type { Postponement, Task } from './task';

/** Spec §5.9: a task is postponed while now < to; from to on, the postponement has expired. */
export function activePostponement({ postponed }: Task, now: Date): Postponement | undefined {
	return postponed && now.getTime() < postponed.to.getTime() ? postponed : undefined;
}

/** Spec §5.9: the only statuses that postponing affects. */
export function pendingOrOverdue({ kind }: Status): boolean {
	return kind === 'pendiente' || kind === 'atrasada';
}

/**
 * Spec §5.9: while the postponement lasts, a task that per §5.1–§5.8 would be
 * pending or overdue is waiting, with the postponement's progress; any other
 * status does not change.
 */
export function withPostponement(status: Status, task: Task, now: Date): Status {
	const active = activePostponement(task, now);
	if (!active || !pendingOrOverdue(status)) return status;
	const { from, to } = active;
	// A from later than now (another clock) gives 0: progress stays between 0 and 1.
	const progress = Math.max(0, now.getTime() - from.getTime()) / (to.getTime() - from.getTime());
	return { kind: 'en espera', progress };
}
