// Spec §5.11 (Block rescheduling) and §7: which tasks «Reprogramar vencidas» reschedules,
// whether the item is enabled, and what confirming writes.
import { pendingRows } from './pending';
import { resumeFromMinimalMode, type TaskResume } from './minimal-mode';
import { noticeOnReschedule, type RescheduleNotice } from './notice';
import type { Completion, RecurringTask, Task } from './task';

/**
 * Spec §5.11 (Which tasks) and §6.1: every recurring task overdue at `now` and in view
 * (with the minimal mode on, the essential ones), in the order of Pendientes. It is the preview.
 */
export function tasksToReschedule(tasks: readonly Task[], completions: readonly Completion[], now: Date, minimalModeOn: boolean): RecurringTask[] {
	return pendingRows(tasks, completions, now, undefined, undefined, minimalModeOn).flatMap(({ task, status }) =>
		task.kind === 'periodica' && status.kind === 'atrasada' ? [task] : []
	);
}

/** Spec §6.1: «Reprogramar vencidas» (and Reprogramar in the preview) is enabled only if there is a task to reschedule. */
export function rescheduleEnabled(tasks: readonly Task[], completions: readonly Completion[], now: Date, minimalModeOn: boolean): boolean {
	return tasksToReschedule(tasks, completions, now, minimalModeOn).length > 0;
}

/** What confirming writes, in a single batch (§7), and the notice that offers to undo it. */
export interface Reschedule {
	changes: TaskResume[];
	notice: RescheduleNotice;
}

/**
 * Spec §5.11 (What it does, Only reanudadaEn): Reprogramar at `now` is a Reanudar of each task of
 * the preview at that moment, writing only resumedAt = now; the notice keeps each previous value.
 */
export function confirmReschedule(tasks: readonly Task[], completions: readonly Completion[], now: Date, minimalModeOn: boolean): Reschedule {
	const rescheduled = tasksToReschedule(tasks, completions, now, minimalModeOn);
	return {
		changes: rescheduled.map((task) => ({ taskId: task.id, change: resumeFromMinimalMode(now) })),
		notice: noticeOnReschedule(
			now,
			rescheduled.map((task) => ({ taskId: task.id, change: { resumedAt: task.resumedAt === undefined ? null : task.resumedAt } }))
		)
	};
}
