// Spec §6.2 (Borrar tarea), §5.10 y §7 (Borrado de tareas).
import type { Annotation } from './annotation';
import { completionsOfTask } from './completions';
import type { Completion, Task } from './task';

/** Lo que se borra en un solo writeBatch. */
export interface Deletion {
	taskId: string;
	completionIds: string[];
	annotationIds: string[];
}

const ids = (of: readonly { id: string }[]) => of.map(({ id }) => id);

/**
 * Borrar una tarea borra también todos sus completados y todas sus
 * anotaciones, y solo los suyos.
 */
export function deletion(taskId: string, completions: readonly Completion[], annotations: readonly Annotation[]): Deletion {
	return {
		taskId,
		completionIds: ids(completionsOfTask(completions, taskId)),
		annotationIds: ids(annotations.filter((annotation) => annotation.taskId === taskId))
	};
}

/**
 * Spec §7, gana el borrado: si la tarea ya no existe (por ejemplo, la borró
 * otro dispositivo), su panel de edición se cierra y sus completados quedan
 * huérfanos.
 */
export function taskExists(tasks: readonly Task[], taskId: string): boolean {
	return tasks.some(({ id }) => id === taskId);
}

/**
 * Los completados cuya tarea no existe (otro dispositivo, sin conexión,
 * completó una tarea ya borrada): no cuentan para nada y se limpian.
 */
export function orphanCompletions(tasks: readonly Task[], completions: readonly Completion[]): Completion[] {
	return completions.filter(({ taskId }) => !taskExists(tasks, taskId));
}

/** Spec §4.5: una anotación sin tarea no es huérfana; con tarea, si la tarea existe. */
export function annotationWithExistingTask(tasks: readonly Task[], { taskId }: Annotation): boolean {
	return taskId === undefined || taskExists(tasks, taskId);
}

/**
 * Spec §7: las anotaciones cuya tarea no existe (otro dispositivo, sin
 * conexión, anotó sobre una tarea ya borrada): no se muestran ni se copian y
 * se limpian. Las anotaciones sin tarea no se ven afectadas.
 */
export function orphanAnnotations(tasks: readonly Task[], annotations: readonly Annotation[]): Annotation[] {
	return annotations.filter((annotation) => !annotationWithExistingTask(tasks, annotation));
}
