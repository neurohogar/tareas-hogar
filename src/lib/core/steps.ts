// Spec §4.1 (Steps): the list of steps of a task. The first step is
// step 1 and `steps` stores steps 2, 3… in the written order.
import { trimText } from './free-text';
import type { Task } from './task';

/** The fields of the steps list, as stored: without the field, there are none. */
export interface StepsFields {
	firstStep?: string;
	steps?: string[];
}

type WithSteps = Pick<Task, 'firstStep' | 'steps'>;

const withText = (step: string | undefined): step is string => step !== undefined;

/**
 * Spec §4.1 (Steps: Text): each step is trimmed; empty or whitespace-only ones
 * are discarded and the ones below move up, also into the place of the first
 * step. Without steps beyond the first, there is no steps field. Never invalid.
 */
export function normalizeSteps(firstStep = '', steps: readonly string[] = []): StepsFields {
	const [firstOne, ...rest] = [firstStep, ...steps].map(trimText).filter(withText);
	return { ...(firstOne && { firstStep: firstOne }), ...(rest.length > 0 && { steps: rest }) };
}

/** Spec §4.1: the steps of the task, the first step as step 1; without a first step, none. */
export function taskSteps({ firstStep, steps = [] }: WithSteps): string[] {
	return firstStep ? [firstStep, ...steps] : [];
}

/** Spec §4.1: the task has two steps or more (first step and at least one in steps). */
export function hasSeveralSteps(task: WithSteps): boolean {
	return taskSteps(task).length > 1;
}

/** Spec §4.1 (Steps: Progress): a step number capped at the last step, and never less than step 1. */
export function stepWithLimit(task: WithSteps, step: number): number {
	return Math.max(1, Math.min(step, taskSteps(task).length));
}

/** Spec §4.1 (Steps: Progress): the step the task is on; without currentStep, 1; if fewer steps remain, the last one. */
export function stepItIsOn(task: WithSteps & Pick<Task, 'currentStep'>): number {
	return task.currentStep === undefined ? 1 : stepWithLimit(task, task.currentStep);
}
