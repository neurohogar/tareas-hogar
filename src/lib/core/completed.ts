// Spec §6.1 (Mostrar completadas): which tasks count as completed.
import type { Status, PendingStatus, PausedStatus } from './status';
import { completionsOfTask } from './completions';
import { waitForPostponement, taskStatus } from './task-status';
import { asJustCreated } from './pause';
import type { Completion, Task } from './task';

/** A completed one, a non-completed one with the status that orders it by urgency, or a paused one (§5.8: it is not completed). */
export type InPending =
	| { completed: true; status: Status }
	| { completed: false; status: PendingStatus }
	| { completed: false; status: PausedStatus };

/**
 * Completed: one-off with at least one completion (§5.1), or recurring waiting
 * with at least one completion (§5.2, §5.3). A recurring task waiting without
 * completions (before its first occurrence) is not, nor is a paused one (§5.8),
 * nor one waiting because of a postponement (§5.9). The task owns all its
 * inputs: status, own completions and postponement are derived here.
 */
export function classifyInPending(task: Task, completions: readonly Completion[], now: Date): InPending {
	const status = taskStatus(task, completions, now);
	if (status.kind === 'pausada') return { completed: false, status };
	if (status.kind === 'completada') return { completed: true, status };
	const { owns } = asJustCreated(task, completionsOfTask(completions, task.id));
	const byPostponement = waitForPostponement(task, completions, now) !== undefined;
	if (status.kind === 'en espera' && !byPostponement && owns.length > 0) return { completed: true, status };
	return { completed: false, status };
}

export function isCompleted(task: Task, completions: readonly Completion[], now: Date): boolean {
	return classifyInPending(task, completions, now).completed;
}
