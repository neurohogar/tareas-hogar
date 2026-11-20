// Spec §6.2 (Borrar tarea) and §7 (task deletion).
import { completionsOfTask } from './completions';
import type { Completion, Task } from './task';

/** What is deleted in a single writeBatch. */
export interface Deletion {
	taskId: string;
	completionIds: string[];
}

const ids = (of: readonly { id: string }[]) => of.map(({ id }) => id);

/** Spec §6.2 and §7: deleting a task also deletes all its completions, and only its own. */
export function deletion(taskId: string, completions: readonly Completion[]): Deletion {
	return { taskId, completionIds: ids(completionsOfTask(completions, taskId)) };
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
