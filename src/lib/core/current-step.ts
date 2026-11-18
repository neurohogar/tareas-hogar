// Spec §4.1 (Pasos: Avance, Completar, Deshacer) and §6.1: the step the
// task is on, how the row shows it and what moves it. Only «Hecho», «Paso
// anterior», completing and deleting a completion change it.
import { checkboxAction } from './checkbox';
import { latestCompletion, completionsOfTask } from './completions';
import type { TaskChange } from './task-document';
import type { Status } from './status';
import { stepWithLimit, stepItIsOn, taskSteps, hasSeveralSteps } from './steps';
import type { Completion, Task } from './task';

/** What tapping «Hecho» does: move to the next step, complete the task like the checkbox, or nothing (disabled). */
export type DoneAction = { kind: 'advance'; change: TaskChange } | { kind: 'complete' } | { kind: 'none' };

/** The buttons of the step line: «Paso anterior» (if shown) and whether «Hecho» is enabled. */
export interface StepButtons {
	previousStep: boolean;
	doneEnabled: boolean;
}

/** Spec §6.1: the step line and the minimal one are shown only on pending or overdue rows. */
export const visibleLine = ({ kind }: Pick<Status, 'kind'>) => kind === 'pendiente' || kind === 'atrasada';

/** Without the field it is step 1 (§4.1): going to 1 removes it; if it is already on that saved step, nothing is written. */
function changeToStep({ currentStep }: Task, step: number): TaskChange {
	const toOne = step === 1;
	if (toOne ? currentStep === undefined : currentStep === step) return {};
	return { currentStep: toOne ? null : step };
}

/** Spec §6.1: «Primer paso: …» if on step 1, «Paso: …» if on another, in full; only on pending or overdue rows. */
export function stepText(task: Task, status: Pick<Status, 'kind'>): string | undefined {
	const steps = taskSteps(task);
	if (steps.length === 0 || !visibleLine(status)) return undefined;
	const step = stepItIsOn(task);
	return (step === 1 ? 'Primer paso: ' : 'Paso: ') + steps[step - 1];
}

/**
 * Spec §4.1 and §6.1: in a task with two steps or more, «Hecho» moves to the next
 * step; on the last one it completes the task exactly like the checkbox, and
 * if the checkbox is disabled (§5.5), it does nothing.
 */
export function doneAction(task: Task, completions: readonly Completion[], now: Date): DoneAction {
	const amount = taskSteps(task).length;
	const step = stepItIsOn(task);
	if (amount < 2) return { kind: 'none' };
	if (step < amount) return { kind: 'advance', change: changeToStep(task, step + 1) };
	return checkboxAction(task, completions, now).kind === 'complete' ? { kind: 'complete' } : { kind: 'none' };
}

/** Spec §4.1 and §6.1: «Paso anterior» goes back to the previous step; it does not go past the first. */
export function previousStepChange(task: Task): TaskChange {
	return changeToStep(task, Math.max(1, stepItIsOn(task) - 1));
}

/** Spec §6.1: with two steps or more and the line visible, «Paso anterior» (not on step 1) and «Hecho», enabled according to doneAction. */
export function stepButtons(task: Task, status: Pick<Status, 'kind'>, completions: readonly Completion[], now: Date): StepButtons | undefined {
	if (!hasSeveralSteps(task) || !visibleLine(status)) return undefined;
	return { previousStep: stepItIsOn(task) > 1, doneEnabled: doneAction(task, completions, now).kind !== 'none' };
}

/** Spec §4.1 (Pasos: Completar): completing the task, by the checkbox, by «Hecho» or by «Hice la mínima», puts it back on step 1. */
export function changeOnComplete(task: Task): TaskChange {
	return changeToStep(task, 1);
}

/**
 * Spec §4.1 (Pasos: Deshacer) and §5.4: deleting the most recent completion of a
 * task with two steps or more (notice, Historial or checkbox) returns currentStep to
 * its stepAtCompletion, capped at the last step. Deleting another one, or one without
 * stepAtCompletion, does not change it. `completions` may or may not include the deleted one.
 */
export function changeOnDeleteCompletion(task: Task, completions: readonly Completion[], deletion: Completion): TaskChange {
	const { stepAtCompletion } = deletion;
	if (stepAtCompletion === undefined || !hasSeveralSteps(task)) return {};
	const mostRecent = latestCompletion([deletion, ...completionsOfTask(completions, task.id)]);
	return mostRecent === deletion ? changeToStep(task, stepWithLimit(task, stepAtCompletion)) : {};
}
