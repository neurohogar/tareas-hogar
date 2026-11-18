// Spec §6.2 (Borrar tarea), §5.10 and §7 (task deletion).
import type { Annotation } from './annotation';
import { completionsOfTask } from './completions';
import type { Completion, Task } from './task';

/** What is deleted in a single writeBatch. */
export interface Deletion {
	taskId: string;
	completionIds: string[];
	annotationIds: string[];
}

const ids = (of: readonly { id: string }[]) => of.map(({ id }) => id);

/**
 * Deleting a task also deletes all its completions and all its
 * annotations, and only its own.
 */
export function deletion(taskId: string, completions: readonly Completion[], annotations: readonly Annotation[]): Deletion {
	return {
		taskId,
		completionIds: ids(completionsOfTask(completions, taskId)),
		annotationIds: ids(annotations.filter((annotation) => annotation.taskId === taskId))
	};
}

/**
 * Spec §7, deletion wins: if the task no longer exists (for example, another
 * device deleted it), its edit panel closes and its completions are left
 * orphaned.
 */
export function taskExists(tasks: readonly Task[], taskId: string): boolean {
	return tasks.some(({ id }) => id === taskId);
}

/**
 * The completions whose task does not exist (another device, offline,
 * completed an already deleted task): they count for nothing and are cleaned.
 */
export function orphanCompletions(tasks: readonly Task[], completions: readonly Completion[]): Completion[] {
	return completions.filter(({ taskId }) => !taskExists(tasks, taskId));
}

/** Spec §4.5: an annotation without a task is not an orphan; with a task, it is if the task exists. */
export function annotationWithExistingTask(tasks: readonly Task[], { taskId }: Annotation): boolean {
	return taskId === undefined || taskExists(tasks, taskId);
}

/**
 * Spec §7: the annotations whose task does not exist (another device, offline,
 * annotated on an already deleted task): they are not shown or copied and
 * are cleaned. Annotations without a task are not affected.
 */
export function orphanAnnotations(tasks: readonly Task[], annotations: readonly Annotation[]): Annotation[] {
	return annotations.filter((annotation) => !annotationWithExistingTask(tasks, annotation));
}
