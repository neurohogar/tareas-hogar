// Spec §5.8 (Pause): only recurring tasks can be paused. A paused task has no
// status; on resuming, it is evaluated as just created at resumedAt.
import type { TaskChange } from './task-document';
import type { Completion, Task } from './task';

/** Spec §5.8: only a recurring task can be paused. */
export function isPaused(task: Task): boolean {
	return task.kind === 'periodica' && task.paused === true;
}

/** Spec §6.2: the pause button when editing a recurring task; a one-off has none. */
export function pauseAction(task: Task): 'pausar' | 'reanudar' | undefined {
	if (task.kind === 'puntual') return undefined;
	return isPaused(task) ? 'reanudar' : 'pausar';
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
