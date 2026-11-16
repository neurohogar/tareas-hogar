// Spec §4.1 (Pasos: Avance, Completar, Deshacer) y §6.1: el paso en que va la
// tarea, cómo lo muestra la fila y qué lo mueve. Solo «Hecho», «Paso
// anterior», completar y borrar un completado lo cambian.
import { checkboxAction } from './checkbox';
import { latestCompletion, completionsOfTask } from './completions';
import type { TaskChange } from './task-document';
import type { Status } from './status';
import { stepWithLimit, stepItIsOn, taskSteps, hasSeveralSteps } from './steps';
import type { Completion, Task } from './task';

/** Qué hace tocar «Hecho»: pasar al paso siguiente, completar la tarea como el checkbox, o nada (deshabilitado). */
export type DoneAction = { kind: 'avanzar'; change: TaskChange } | { kind: 'completar' } | { kind: 'ninguna' };

/** Los botones de la línea del paso: «Paso anterior» (si se ve) y si «Hecho» está habilitado. */
export interface StepButtons {
	previousStep: boolean;
	doneEnabled: boolean;
}

/** Spec §6.1: la línea del paso y la de la mínima solo se ven en las filas pendiente o atrasada. */
export const visibleLine = ({ kind }: Pick<Status, 'kind'>) => kind === 'pendiente' || kind === 'atrasada';

/** Sin el campo es el paso 1 (§4.1): ir al 1 lo quita; si ya va en ese paso guardado, no se escribe nada. */
function changeToStep({ currentStep }: Task, step: number): TaskChange {
	const toOne = step === 1;
	if (toOne ? currentStep === undefined : currentStep === step) return {};
	return { currentStep: toOne ? null : step };
}

/** Spec §6.1: «Primer paso: …» si va en el paso 1, «Paso: …» si va en otro, completo; solo en filas pendiente o atrasada. */
export function stepText(task: Task, status: Pick<Status, 'kind'>): string | undefined {
	const steps = taskSteps(task);
	if (steps.length === 0 || !visibleLine(status)) return undefined;
	const step = stepItIsOn(task);
	return (step === 1 ? 'Primer paso: ' : 'Paso: ') + steps[step - 1];
}

/**
 * Spec §4.1 y §6.1: en una tarea de dos pasos o más, «Hecho» pasa al paso
 * siguiente; en el último completa la tarea exactamente como el checkbox, y
 * si el checkbox está deshabilitado (§5.5), no hace nada.
 */
export function doneAction(task: Task, completions: readonly Completion[], now: Date): DoneAction {
	const amount = taskSteps(task).length;
	const step = stepItIsOn(task);
	if (amount < 2) return { kind: 'ninguna' };
	if (step < amount) return { kind: 'avanzar', change: changeToStep(task, step + 1) };
	return checkboxAction(task, completions, now).kind === 'completar' ? { kind: 'completar' } : { kind: 'ninguna' };
}

/** Spec §4.1 y §6.1: «Paso anterior» vuelve al paso de antes; no pasa del primero. */
export function previousStepChange(task: Task): TaskChange {
	return changeToStep(task, Math.max(1, stepItIsOn(task) - 1));
}

/** Spec §6.1: con dos pasos o más y la línea visible, «Paso anterior» (no en el paso 1) y «Hecho», habilitado según accionDeHecho. */
export function stepButtons(task: Task, status: Pick<Status, 'kind'>, completions: readonly Completion[], now: Date): StepButtons | undefined {
	if (!hasSeveralSteps(task) || !visibleLine(status)) return undefined;
	return { previousStep: stepItIsOn(task) > 1, doneEnabled: doneAction(task, completions, now).kind !== 'ninguna' };
}

/** Spec §4.1 (Pasos: Completar): completar la tarea, por el checkbox, por «Hecho» o por «Hice la mínima», la vuelve al paso 1. */
export function changeOnComplete(task: Task): TaskChange {
	return changeToStep(task, 1);
}

/**
 * Spec §4.1 (Pasos: Deshacer) y §5.4: borrar el completado más reciente de una
 * tarea de dos pasos o más (aviso, Historial o checkbox) devuelve pasoActual a
 * su pasoAlCompletar, con el tope del último paso. Borrar otro, o uno sin
 * pasoAlCompletar, no lo cambia. `completados` puede incluir o no al borrado.
 */
export function changeOnDeleteCompletion(task: Task, completions: readonly Completion[], deletion: Completion): TaskChange {
	const { stepAtCompletion } = deletion;
	if (stepAtCompletion === undefined || !hasSeveralSteps(task)) return {};
	const mostRecent = latestCompletion([deletion, ...completionsOfTask(completions, task.id)]);
	return mostRecent === deletion ? changeToStep(task, stepWithLimit(task, stepAtCompletion)) : {};
}
