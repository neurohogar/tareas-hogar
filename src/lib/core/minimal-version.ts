// Spec §4.1 (Versión mínima) y §6.1: la línea «Mínima: …» de la fila y su
// botón «Hice la mínima», que completa la tarea como el checkbox.
import { checkboxAction } from './checkbox';
import { classifyInPending } from './completed';
import { complete } from './completions';
import type { Status } from './status';
import { visibleLine } from './current-step';
import type { Completion, Task } from './task';

/** Lo que la fila muestra de la mínima: la línea con su prefijo y si «Hice la mínima» está habilitado. */
export interface MinimalLine {
	text: string;
	enabled: boolean;
}

/**
 * Spec §6.1: con versión mínima y la fila pendiente o atrasada, «Mínima: »
 * y el texto completo; el botón está habilitado si el checkbox completaría
 * (§5.5). En cualquier otra fila, ninguna.
 */
export function minimalLine(task: Task, status: Pick<Status, 'kind'>, completions: readonly Completion[], now: Date): MinimalLine | undefined {
	if (task.minimalVersion === undefined || !visibleLine(status)) return undefined;
	return { text: `Mínima: ${task.minimalVersion}`, enabled: checkboxAction(task, completions, now).kind === 'completar' };
}

/**
 * Spec §6.1 y §4.4: tocar «Hice la mínima» agrega el completado de `completar`
 * con fueMinima en true; si la fila no la ofrece o el botón está deshabilitado,
 * no completa (undefined).
 */
export function doTheMinimal(task: Task, completions: readonly Completion[], id: string, now: Date): Completion | undefined {
	const { status } = classifyInPending(task, completions, now);
	const line = minimalLine(task, status, completions, now);
	return line?.enabled ? complete(task, completions, id, now, true) : undefined;
}
