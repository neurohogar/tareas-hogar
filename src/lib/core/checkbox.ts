// Spec §6.1: qué hace tocar el checkbox de una fila de Pendientes.
import { latestCompletion, completionsOfTask } from './completions';
import { isCompleted } from './completed';
import { startOfDay } from './days';
import { withinSchedule } from './schedule';
import { asJustCreated, isPaused } from './pause';
import type { Completion, Task } from './task';

/** "ninguna": el checkbox está deshabilitado (completaría fuera de la ventana, §5.5, o la tarea está pausada, §5.8). */
export type CheckboxAction = { kind: 'completar' } | { kind: 'borrar'; completion: Completion } | { kind: 'ninguna' };

/** Spec §5.5: con horario, solo se completa dentro de alguna de sus ventanas. */
function completeIfPossible({ schedule }: Task, now: Date): CheckboxAction {
	return !schedule || withinSchedule(schedule, now) ? { kind: 'completar' } : { kind: 'ninguna' };
}

/**
 * Una tarea no completada se completa. De una completada se borra el
 * completado más reciente (como Deshacer, §5.4) si es puntual, o si es
 * periódica y ese completado es de hoy o posterior (día local de completadoEn);
 * una periódica completada un día anterior se completa de nuevo. Completar
 * fuera de la ventana de su horario no es posible; borrar, a cualquier hora.
 * De una pausada, nada; de una reanudada, solo cuentan los completados desde
 * reanudadaEn (§5.8).
 */
export function checkboxAction(task: Task, completions: readonly Completion[], now: Date): CheckboxAction {
	if (isPaused(task)) return { kind: 'ninguna' };
	const { owns } = asJustCreated(task, completionsOfTask(completions, task.id));
	if (!isCompleted(task, completions, now)) return completeIfPossible(task, now);
	const mostRecent = latestCompletion(owns);
	const ofTodayOrLater = mostRecent.completedAt.getTime() >= startOfDay(now).getTime();
	if (task.kind === 'puntual' || ofTodayOrLater) return { kind: 'borrar', completion: mostRecent };
	return completeIfPossible(task, now);
}

/** Spec §6.1 y §5.8: deshabilitado si tocarlo completaría fuera de la ventana, o si la tarea está pausada. */
export function checkboxEnabled(task: Task, completions: readonly Completion[], now: Date): boolean {
	return checkboxAction(task, completions, now).kind !== 'ninguna';
}
