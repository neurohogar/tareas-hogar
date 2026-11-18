// Spec §6.1: the order of the Pending list (by urgency and, at the end, the completed ones).
import { compareIds } from './compare-ids';
import type { Status, PendingStatus } from './status';
import { compareTitles } from './alphabetical-order';
import type { Task } from './task';

export interface RowToOrder {
	task: Task;
	status: PendingStatus;
	/** The urgency instant (urgency.ts); without it, the row goes to the end of its group. */
	instant: Date | undefined;
}

const GROUP_ORDER: Record<PendingStatus['kind'], number> = { atrasada: 0, pendiente: 1, 'en espera': 2 };

/** From oldest to most recent; those without an instant, at the end. */
function compareInstants(a: Date | undefined, b: Date | undefined): number {
	if (a === undefined || b === undefined) return Number(a === undefined) - Number(b === undefined);
	return a.getTime() - b.getTime();
}

/** The list tie-breaker: oldest createdAt, title in Spanish and, lastly, id. */
function breakTie(a: Task, b: Task): number {
	return a.createdAt.getTime() - b.createdAt.getTime() || compareTitles(a.title, b.title) || compareIds(a.id, b.id);
}

/** Group (overdue, pending, waiting), then the urgency instant; if they tie, the tie-breaker. */
export function compareByUrgency(a: RowToOrder, b: RowToOrder): number {
	return (
		GROUP_ORDER[a.status.kind] - GROUP_ORDER[b.status.kind] ||
		compareInstants(a.instant, b.instant) ||
		breakTie(a.task, b.task)
	);
}

export interface CompletedRow {
	task: Task;
	status: Status;
	/** The task's most recent completedAt, in ms. */
	lastCompletedAt: number;
}

/** Show paused (§6.1): by title in Spanish; if they tie, the tie-breaker. */
export function comparePaused(a: Task, b: Task): number {
	return compareTitles(a.title, b.title) || breakTie(a, b);
}

/** Show completed: from the one with the most recent completedAt to the oldest; if they tie, the tie-breaker. */
export function compareCompleted(a: CompletedRow, b: CompletedRow): number {
	return b.lastCompletedAt - a.lastCompletedAt || breakTie(a.task, b.task);
}
