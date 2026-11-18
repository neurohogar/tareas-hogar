// Spec §5.4: the notice with Undo that appears on completing. There is only one:
// that of the last completion on this device (completing again replaces it).
import { taskStatus } from './task-status';
import { taskName } from './task-name';
import type { Completion, Task } from './task';
import { datePhrase } from './date-text';
import { returnInstant } from './date-text-instants';

export interface Notice {
	/** The task name when it was completed (§4.1): the notice names it even if it is deleted later. */
	name: string;
	/** The completion the notice offers to undo. */
	completion: Completion;
	/** When the task returns (§5.4, §6.1); without the field, it does not return (a one-off). */
	returns?: Date;
}

export const NOTICE_DURATION_MS = 5_000;

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

/** Spec §5.4: «Completaste «nombre»», with « · mínima» if the completion was the minimal version. */
export function noticeText({ name, completion }: Notice): string {
	return `Completaste «${name}»${completion.wasMinimal ? ' · mínima' : ''}`;
}

/** Spec §5.4: the line below «Completaste …», «Vuelve …» (§6.1) counted from now; none if the task does not return. */
export function noticeReturn(notice: Notice, now: Date): string | undefined {
	return notice.returns && datePhrase('Vuelve', notice.returns, now);
}

/** The notice, if visible now: while completedAt <= now < completedAt + 5 s. */
export function visibleNotice(notice: Notice | undefined, now: Date): Notice | undefined {
	if (!notice) return undefined;
	const from = notice.completion.completedAt.getTime();
	const visible = from <= now.getTime() && now.getTime() < from + NOTICE_DURATION_MS;
	return visible ? notice : undefined;
}

/** The ms left until the notice disappears on its own. */
export function msUntilDue(notice: Notice, now: Date): number {
	return notice.completion.completedAt.getTime() + NOTICE_DURATION_MS - now.getTime();
}

/**
 * Undo on the notice: the completion to delete (only the one the notice
 * names), or undefined if the notice is no longer visible. In both cases the notice
 * closes. If that completion no longer exists (another device deleted it, or deleted
 * its task), deleting it does nothing: there is no need to wait for it to arrive.
 */
export function completionToUndo(notice: Notice | undefined, now: Date): Completion | undefined {
	return visibleNotice(notice, now)?.completion;
}
