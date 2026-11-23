// Spec §4.1 (Essential): the mark that the minimal mode (§5.8) uses to decide which tasks stay in view.
import type { Task } from './task';

/** Spec §4.1: a task is essential only with essential = true; without the field, it is not. */
export function isEssential(task: Task): boolean {
	return task.essential === true;
}

/** Only the field with a value: a task that is not essential has no `essential` key (§4.1). */
export function essentialField(essential: boolean | undefined): { essential?: true } {
	return essential === true ? { essential: true } : {};
}
