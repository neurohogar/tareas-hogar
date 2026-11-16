// Spec §4.1 (Pasos): la lista se normaliza sin perder pasos con texto, y el avance nunca sale de la lista.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { complete } from './completions';
import { taskData } from './task-data';
import type { TaskChange } from './task-document';
import { edit } from './editing';
import { doneAction, changeOnDeleteCompletion, changeOnComplete, previousStepChange } from './current-step';
import { normalizeSteps, stepWithLimit, stepItIsOn, taskSteps, hasSeveralSteps } from './steps';
import type { Task, OneOffTask } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const text = fc.string({ maxLength: 8 });
const list = fc.array(text, { maxLength: 6 });

const taskWith = (firstStep: string, steps: string[], currentStep: number): OneOffTask => ({
	id: 't',
	title: 'Ropa',
	kind: 'puntual',
	createdAt: CREATED,
	...normalizeSteps(firstStep, steps),
	currentStep
});

/** Aplica el cambio parcial a la tarea: null quita pasoActual, ausente lo deja. */
const apply = (task: OneOffTask, change: TaskChange): OneOffTask => {
	if (!('currentStep' in change)) return task;
	const { currentStep: _before, ...rest } = task;
	return change.currentStep == null ? rest : { ...rest, currentStep: change.currentStep };
};

describe('pasos (propiedades)', () => {
	it('normalizar conserva en orden los pasos con texto, recortados, y es idempotente', () => {
		fc.assert(
			fc.property(text, list, (firstStep, steps) => {
				const normalizedValues = normalizeSteps(firstStep, steps);
				const withText = [firstStep, ...steps].map((step) => step.trim()).filter((step) => step !== '');
				expect(taskSteps(normalizedValues)).toStrictEqual(withText);
				expect(normalizeSteps(normalizedValues.firstStep, normalizedValues.steps)).toStrictEqual(normalizedValues);
				expect(normalizedValues.steps?.length).not.toBe(0);
			})
		);
	});

	it('el paso en que va, «Hecho» y «Paso anterior» nunca salen del primero ni del último', () => {
		fc.assert(
			fc.property(text, list, fc.integer({ min: -3, max: 10 }), (firstStep, steps, currentStep) => {
				const task = taskWith(firstStep, steps, currentStep);
				const amount = Math.max(1, taskSteps(task).length);
				const inRange = (step: number) => step >= 1 && step <= amount;
				expect(inRange(stepItIsOn(task))).toBe(true);
				const action = doneAction(task, [], CREATED);
				if (action.kind === 'avanzar') expect(inRange(stepItIsOn({ ...task, currentStep: action.change.currentStep ?? 1 }))).toBe(true);
				const previous = previousStepChange(task).currentStep;
				expect(inRange(previous ?? 1)).toBe(true);
			})
		);
	});

	it('pasoConTope siempre cae entre 1 y la cantidad de pasos (1 si no hay)', () => {
		fc.assert(
			fc.property(text, list, fc.integer({ min: -50, max: 50 }), (firstStep, steps, step) => {
				const task = taskWith(firstStep, steps, 1);
				const cap = stepWithLimit(task, step);
				expect(cap).toBeGreaterThanOrEqual(1);
				expect(cap).toBeLessThanOrEqual(Math.max(1, taskSteps(task).length));
				expect(stepWithLimit(task, cap)).toBe(cap);
			})
		);
	});

	it('completar y luego deshacer devuelve el mismo paso en que iba', () => {
		fc.assert(
			fc.property(text, list, fc.integer({ min: 1, max: 10 }), (firstStep, steps, currentStep) => {
				const task = taskWith(firstStep, steps, currentStep);
				fc.pre(hasSeveralSteps(task));
				const completion = complete(task, [], 'c', CREATED);
				const completed = apply(task, changeOnComplete(task));
				expect(stepItIsOn(completed)).toBe(1);
				const undone = apply(completed, changeOnDeleteCompletion(completed, [completion], completion));
				expect(stepItIsOn(undone)).toBe(stepItIsOn(task));
			})
		);
	});

	it('editar solo escribe pasos si cambiaron y nunca pasoActual', () => {
		fc.assert(
			fc.property(text, list, text, list, fc.integer({ min: 1, max: 10 }), (firstBefore, before, firstAfter, after, currentStep) => {
				const task: Task = taskWith(firstBefore, before, currentStep);
				const result = edit(task, { ...taskData(task), firstStep: firstAfter, steps: after });
				if (!result.ok) throw new Error('debía editarse');
				const newItems = normalizeSteps(firstAfter, after);
				const haveChanged = JSON.stringify(newItems.steps) !== JSON.stringify(task.steps);
				expect('steps' in result.change).toBe(haveChanged);
				expect('currentStep' in result.change).toBe(false);
			})
		);
	});
});
