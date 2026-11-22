// Spec §5.8 (Minimal mode) and §7: the state of the mode and what turning it off writes.
import { isPaused, pausedByMinimalMode } from './pause';
import type { TaskChange } from './task-document';
import type { Task } from './task';

/** Spec §7: `users/{uid}/settings/minimalMode`. */
export interface MinimalModeDocument {
	active: boolean;
}

/** Spec §7: without the document, the mode is off. */
export function minimalModeOn(doc: MinimalModeDocument | undefined): boolean {
	return doc?.active === true;
}

/** Spec §5.8: the Reanudar of the mode writes only resumedAt; it never writes or removes paused. */
export function resumeFromMinimalMode(now: Date): TaskChange {
	return { resumedAt: now };
}

/** One task change of a batch. */
export interface TaskResume {
	taskId: string;
	change: TaskChange;
}

/**
 * Spec §5.8 (Turning it off) and §7: a Reanudar at `now` of every recurring task that is
 * not essential and not paused by hand; to write together with active = false in one batch.
 */
export function resumesOnTurningOff(tasks: readonly Task[], now: Date): TaskResume[] {
	return tasks
		.filter((task) => pausedByMinimalMode(task, true) && !isPaused(task))
		.map((task) => ({ taskId: task.id, change: resumeFromMinimalMode(now) }));
}
