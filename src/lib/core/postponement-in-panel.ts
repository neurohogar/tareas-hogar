// Spec §6.2: lo que muestra de la posposición el panel de edición.
import { daysBetween } from './days';
import { taskStatus } from './task-status';
import { timeInText } from './dates-in-text';
import { isPaused } from './pause';
import { pendingOrOverdue, activePostponement } from './active-postponement';
import type { Completion, Task } from './task';

/**
 * Spec §6.2 y §5.9: el botón del panel. Pospuesta, Quitar posponer (en cualquier
 * estado); si no, Posponer solo a una pendiente o atrasada no pausada.
 */
export function postponeAction(task: Task, completions: readonly Completion[], now: Date): 'posponer' | 'quitar' | undefined {
	if (activePostponement(task, now)) return 'quitar';
	if (isPaused(task)) return undefined;
	return pendingOrOverdue(taskStatus(task, completions, now)) ? 'posponer' : undefined;
}

/** Spec §6.2: "Pospuesta hasta HH:MM" o, si hasta es de mañana, "Pospuesta hasta mañana HH:MM"; sin posposición vigente, nada. */
export function postponementText(task: Task, now: Date): string | undefined {
	const active = activePostponement(task, now);
	if (!active) return undefined;
	const day = daysBetween(now, active.to) === 1 ? 'mañana ' : '';
	return `Pospuesta hasta ${day}${timeInText(active.to)}`;
}
