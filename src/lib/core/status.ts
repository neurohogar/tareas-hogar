// Derived status of a task (spec §3): it is computed, never stored.

export type Status =
	| { kind: 'pendiente' }
	| { kind: 'atrasada' }
	/** progress: fraction between 0 and 1 of the waiting time elapsed. */
	| { kind: 'en espera'; progress: number }
	/** Spec §5.1: a one-off with at least one completion is completed. */
	| { kind: 'completada' }
	/** Spec §5.8: a paused recurring task has no status (it is not pending, overdue or waiting). */
	| PausedStatus;

export type PausedStatus = { kind: 'pausada' };

/** The status of a task ordered by urgency (§6.1): all except that of a completed one-off and that of a paused one. */
export type PendingStatus = Exclude<Status, { kind: 'completada' } | PausedStatus>;

/** Progress of the waiting bar, from 0 to 100 (aria-valuenow). */
export function progressPercentage(progress: number): number {
	return Math.round(progress * 100);
}
