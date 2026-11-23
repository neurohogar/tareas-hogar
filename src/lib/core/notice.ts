// Spec §5.4: the notice with Undo that appears on completing or on a block rescheduling
// (§5.11). There is only one slot: the last notice on this device replaces the other.
import { taskStatus } from './task-status';
import { taskName } from './task-name';
import type { Completion, Task } from './task';
import { datePhrase } from './date-text';
import { returnInstant } from './date-text-instants';
import type { TaskResume } from './minimal-mode';

export interface Notice {
	/** The task name when it was completed (§4.1): the notice names it even if it is deleted later. */
	name: string;
	/** The completion the notice offers to undo. */
	completion: Completion;
	/** When the task returns (§5.4, §6.1); without the field, it does not return (a one-off). */
	returns?: Date;
}

/** Spec §5.4 and §5.11: the notice of a block rescheduling, «Tareas reprogramadas». */
export interface RescheduleNotice {
	/** The moment of confirming: the notice lasts 5 s from it. */
	rescheduledAt: Date;
	/** What Deshacer writes back: per rescheduled task, its previous resumedAt or null to remove it. */
	undo: TaskResume[];
}

/** The single notice slot of §5.4: a completion notice or a rescheduling one. */
export type SlotNotice = Notice | RescheduleNotice;

export const NOTICE_DURATION_MS = 5_000;

function isRescheduleNotice(notice: SlotNotice): notice is RescheduleNotice {
	return 'rescheduledAt' in notice;
}

/** The instant the notice was opened: the completion or the confirmation of the rescheduling. */
function openedAt(notice: SlotNotice): number {
	return (isRescheduleNotice(notice) ? notice.rescheduledAt : notice.completion.completedAt).getTime();
}

/**
 * Spec §5.4: the completion notice. If the task returns (recurring), the instant
 * of «Vuelve …» from §6.1 computed after the completion, with the completions
 * the user already had.
 */
export function noticeOnComplete(task: Task, completion: Completion, completionsBefore: readonly Completion[] = []): Notice {
	const { completedAt } = completion;
	const everything = [...completionsBefore, completion];
	const status = taskStatus(task, everything, completedAt);
	const returns = status.kind === 'en espera' ? returnInstant(task, everything, status, completedAt) : undefined;
	return { name: taskName(task), completion, ...(returns && { returns }) };
}

/** Spec §5.4 and §5.11: the rescheduling notice, opened at the moment of confirming. */
export function noticeOnReschedule(rescheduledAt: Date, undo: TaskResume[]): RescheduleNotice {
	return { rescheduledAt, undo };
}

/**
 * Spec §5.4: «Completaste «nombre»», with « · mínima» if the completion was the minimal version;
 * of a rescheduling, «Tareas reprogramadas», with no count (§5.11).
 */
export function noticeText(notice: SlotNotice): string {
	if (isRescheduleNotice(notice)) return 'Tareas reprogramadas';
	return `Completaste «${notice.name}»${notice.completion.wasMinimal ? ' · mínima' : ''}`;
}

/** Spec §5.4: the line below «Completaste …», «Vuelve …» (§6.1) counted from now; none if the task does not return or for a rescheduling. */
export function noticeReturn(notice: SlotNotice, now: Date): string | undefined {
	if (isRescheduleNotice(notice)) return undefined;
	return notice.returns && datePhrase('Vuelve', notice.returns, now);
}

/** The notice, if visible now: while openedAt <= now < openedAt + 5 s (§5.4). */
export function visibleNotice<N extends SlotNotice>(notice: N | undefined, now: Date): N | undefined {
	if (!notice) return undefined;
	const from = openedAt(notice);
	const visible = from <= now.getTime() && now.getTime() < from + NOTICE_DURATION_MS;
	return visible ? notice : undefined;
}

/** The ms left until the notice disappears on its own. */
export function msUntilDue(notice: SlotNotice, now: Date): number {
	return openedAt(notice) + NOTICE_DURATION_MS - now.getTime();
}

/**
 * Undo on the notice: the completion to delete (only the one the notice
 * names), or undefined if the notice is no longer visible. In both cases the notice
 * closes. If that completion no longer exists (another device deleted it, or deleted
 * its task), deleting it does nothing: there is no need to wait for it to arrive.
 */
export function completionToUndo(notice: SlotNotice | undefined, now: Date): Completion | undefined {
	const visible = visibleNotice(notice, now);
	return visible && !isRescheduleNotice(visible) ? visible.completion : undefined;
}

/**
 * Spec §5.11 (Undo): Deshacer on a visible rescheduling notice writes back, in a single batch
 * (§7), the previous resumedAt of each rescheduled task that still exists in `tasks`; a deleted
 * task is not revived. Undefined if the notice is not a visible rescheduling one.
 */
export function rescheduleToUndo(notice: SlotNotice | undefined, now: Date, tasks: readonly Task[]): TaskResume[] | undefined {
	const visible = visibleNotice(notice, now);
	if (!visible || !isRescheduleNotice(visible)) return undefined;
	const existing = new Set(tasks.map(({ id }) => id));
	return visible.undo.filter(({ taskId }) => existing.has(taskId));
}
