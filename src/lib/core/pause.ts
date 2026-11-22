// Spec §5.8 (Pause): only recurring tasks can be paused, by hand (paused) or by
// the minimal mode. A paused task has no status; on resuming, it is evaluated as
// just created at resumedAt.
import type { TaskChange } from './task-document';
import { isEssential } from './essential';
import type { Completion, Task } from './task';

/** Spec §5.8 (Paused by the minimal mode): with the mode on, every recurring task that is not essential. */
export function pausedByMinimalMode(task: Task, minimalModeOn: boolean): boolean {
	return minimalModeOn && task.kind === 'periodica' && !isEssential(task);
}

/** Spec §5.8: only a recurring task can be paused, by hand or, with `minimalModeOn`, by the minimal mode. */
export function isPaused(task: Task, minimalModeOn = false): boolean {
	return pausedByHand(task) || pausedByMinimalMode(task, minimalModeOn);
}

function pausedByHand(task: Task): boolean {
	return task.kind === 'periodica' && task.paused === true;
}

/**
 * Spec §6.2: the pause button when editing a recurring task; a one-off has none. With the
 * minimal mode on, a task it pauses has no Pausar, and Reanudar only if it is also paused by hand.
 */
export function pauseAction(task: Task, minimalModeOn = false): 'pausar' | 'reanudar' | undefined {
	if (task.kind === 'puntual') return undefined;
	if (pausedByHand(task)) return 'reanudar';
	return pausedByMinimalMode(task, minimalModeOn) ? undefined : 'pausar';
}

/** Spec §6.2 (Tarea): «Pausada» if paused by hand, else «Pausada por el modo mínimo» if the mode pauses it. */
export function pauseText(task: Task, minimalModeOn = false): 'Pausada' | 'Pausada por el modo mínimo' | undefined {
	if (pausedByHand(task)) return 'Pausada';
	return pausedByMinimalMode(task, minimalModeOn) ? 'Pausada por el modo mínimo' : undefined;
}

/** Spec §5.8 and §7: pausing writes paused. */
export function pause(): TaskChange {
	return { paused: true };
}

/** Spec §5.8 and §7: resuming removes paused and stores resumedAt = now, in a single change. */
export function resume(now: Date): TaskChange {
	return { paused: null, resumedAt: now };
}

/**
 * Spec §5.8: a resumed recurring task is evaluated as just created at
 * resumedAt: with createdAt = resumedAt and without the completions (of the task)
 * with completedAt earlier than resumedAt. The others, as is.
 */
export function asJustCreated(task: Task, owns: readonly Completion[]): { task: Task; owns: Completion[] } {
	if (task.kind === 'puntual' || !task.resumedAt) return { task, owns: [...owns] };
	const from = task.resumedAt.getTime();
	return {
		task: { ...task, createdAt: task.resumedAt },
		owns: owns.filter(({ completedAt }) => completedAt.getTime() >= from)
	};
}
