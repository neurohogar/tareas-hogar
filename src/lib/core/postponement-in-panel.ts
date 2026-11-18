// Spec §6.2: what the edit panel shows of the postponement.
import { daysBetween } from './days';
import { taskStatus } from './task-status';
import { timeInText } from './dates-in-text';
import { isPaused } from './pause';
import { pendingOrOverdue, activePostponement } from './active-postponement';
import type { Completion, Task } from './task';

/**
 * Spec §6.2 and §5.9: the panel button. Postponed, Quitar posponer (in any
 * status); otherwise, Posponer only to a pending or overdue task that is not paused.
 */
export function postponeAction(task: Task, completions: readonly Completion[], now: Date): 'posponer' | 'quitar' | undefined {
	if (activePostponement(task, now)) return 'quitar';
	if (isPaused(task)) return undefined;
	return pendingOrOverdue(taskStatus(task, completions, now)) ? 'posponer' : undefined;
}

/** Spec §6.2: "Pospuesta hasta HH:MM" or, if to is tomorrow, "Pospuesta hasta mañana HH:MM"; without an active postponement, nothing. */
export function postponementText(task: Task, now: Date): string | undefined {
	const active = activePostponement(task, now);
	if (!active) return undefined;
	const day = daysBetween(now, active.to) === 1 ? 'mañana ' : '';
	return `Pospuesta hasta ${day}${timeInText(active.to)}`;
}
