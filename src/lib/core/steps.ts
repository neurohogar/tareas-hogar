// Spec §4.1 (Pasos): la lista de pasos de una tarea. El primer paso es el
// paso 1 y `pasos` guarda los pasos 2, 3… en el orden escrito.
import { trimText } from './free-text';
import type { Task } from './task';

/** Los campos de la lista de pasos, como se guardan: sin el campo, no hay. */
export interface StepsFields {
	firstStep?: string;
	steps?: string[];
}

type WithSteps = Pick<Task, 'firstStep' | 'steps'>;

const withText = (step: string | undefined): step is string => step !== undefined;

/**
 * Spec §4.1 (Pasos: Texto): cada paso se recorta; los vacíos o de solo
 * espacios se descartan y los de abajo suben, también al lugar del primer
 * paso. Sin pasos más allá del primero, no hay campo pasos. Nunca inválido.
 */
export function normalizeSteps(firstStep = '', steps: readonly string[] = []): StepsFields {
	const [firstOne, ...rest] = [firstStep, ...steps].map(trimText).filter(withText);
	return { ...(firstOne && { firstStep: firstOne }), ...(rest.length > 0 && { steps: rest }) };
}

/** Spec §4.1: los pasos de la tarea, el primer paso como paso 1; sin primer paso, ninguno. */
export function taskSteps({ firstStep, steps = [] }: WithSteps): string[] {
	return firstStep ? [firstStep, ...steps] : [];
}

/** Spec §4.1: la tarea tiene dos pasos o más (primer paso y al menos un paso en pasos). */
export function hasSeveralSteps(task: WithSteps): boolean {
	return taskSteps(task).length > 1;
}

/** Spec §4.1 (Pasos: Avance): un número de paso con el tope del último paso, y nunca menos que el paso 1. */
export function stepWithLimit(task: WithSteps, step: number): number {
	return Math.max(1, Math.min(step, taskSteps(task).length));
}

/** Spec §4.1 (Pasos: Avance): el paso en que va la tarea; sin pasoActual, el 1; si quedan menos pasos, el último. */
export function stepItIsOn(task: WithSteps & Pick<Task, 'currentStep'>): number {
	return task.currentStep === undefined ? 1 : stepWithLimit(task, task.currentStep);
}
