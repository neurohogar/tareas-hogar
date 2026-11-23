// Spec §6.1: what tapping the checkbox of a Pendientes row does.
import { latestCompletion, completionsOfTask } from './completions';
import { isCompleted } from './completed';
import { startOfDay } from './days';
import { withinSchedule } from './schedule';
import { asJustCreated, isPaused } from './pause';
import type { Completion, Task } from './task';

/** "ninguna": the checkbox is disabled (it would complete outside the window, §5.5, or the task is paused, §5.8). */
export type CheckboxAction = { kind: 'complete' } | { kind: 'remove'; completion: Completion } | { kind: 'none' };

/** Spec §5.5: with a schedule, it is completed only inside one of its windows. */
function completeIfPossible({ schedule }: Task, now: Date): CheckboxAction {
	return !schedule || withinSchedule(schedule, now) ? { kind: 'complete' } : { kind: 'none' };
}

/**
 * A task that is not completed is completed. From a completed one the most recent
 * completion is deleted (like Deshacer, §5.4) if it is one-off, or if it is
 * recurring and that completion is from today or later (local day of completedAt);
 * a recurring task completed on an earlier day is completed again. Completing
 * outside the window of its schedule is not possible; deleting, at any hour.
 * From a paused one (also by the minimal mode), nothing; from a resumed one, only the completions since
 * resumedAt count (§5.8).
 */
export function checkboxAction(task: Task, completions: readonly Completion[], now: Date, minimalModeOn = false): CheckboxAction {
	if (isPaused(task, minimalModeOn)) return { kind: 'none' };
	const { owns } = asJustCreated(task, completionsOfTask(completions, task.id));
	if (!isCompleted(task, completions, now)) return completeIfPossible(task, now);
	const mostRecent = latestCompletion(owns);
	const ofTodayOrLater = mostRecent.completedAt.getTime() >= startOfDay(now).getTime();
	if (task.kind === 'puntual' || ofTodayOrLater) return { kind: 'remove', completion: mostRecent };
	return completeIfPossible(task, now);
}

/** Spec §6.1 and §5.8: disabled if tapping it would complete outside the window, or if the task is paused. */
export function checkboxEnabled(task: Task, completions: readonly Completion[], now: Date, minimalModeOn = false): boolean {
	return checkboxAction(task, completions, now, minimalModeOn).kind !== 'none';
}
