import { describe, expect, it } from 'vitest';
import { complete } from './completions';
import {
	doneAction,
	stepButtons,
	changeOnDeleteCompletion,
	changeOnComplete,
	previousStepChange,
	stepText
} from './current-step';
import { pendingRows } from './pending';
import type { Completion, RecurringTask, OneOffTask } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const NOW = new Date(2026, 6, 15, 8, 0, 0);
const THREE: OneOffTask = { id: 't1', title: 'Ropa', kind: 'puntual', createdAt: CREATED, firstStep: 'Separar', steps: ['Lavar', 'Tender'] };
const { steps: _, ...ONE_STEP } = THREE;
const atStep = (currentStep: number): OneOffTask => ({ ...THREE, currentStep });
const RELATIVE: RecurringTask = {
	id: 't2',
	title: 'Regar',
	kind: 'periodica',
	recurrence: { mode: 'relativo', every: 1, unit: 'dias' },
	createdAt: CREATED,
	firstStep: 'Llenar',
	steps: ['Regar']
};
const completionOf = (taskId: string, completedAt: Date, stepAtCompletion?: number): Completion => ({
	id: `c-${completedAt.getTime()}`,
	taskId,
	completedAt,
	...(stepAtCompletion !== undefined && { stepAtCompletion })
});

describe('stepText (spec §6.1)', () => {
	it('on step 1, «Primer paso: …»', () => {
		expect(stepText(THREE, { kind: 'pendiente' })).toBe('Primer paso: Separar');
	});

	it('on another step, «Paso: …» with the text of that step, without number or total', () => {
		expect(stepText(atStep(2), { kind: 'pendiente' })).toBe('Paso: Lavar');
		expect(stepText(atStep(3), { kind: 'atrasada' })).toBe('Paso: Tender');
	});

	it('with fewer steps than currentStep, the last one', () => {
		expect(stepText(atStep(9), { kind: 'pendiente' })).toBe('Paso: Tender');
	});

	it('a single-step task, «Primer paso: …» even if it has an old currentStep', () => {
		expect(stepText({ ...ONE_STEP, currentStep: 3 }, { kind: 'pendiente' })).toBe('Primer paso: Separar');
	});

	it.each(['en espera', 'completada', 'pausada'] as const)('a %s row does not show it', (kind) => {
		expect(stepText(atStep(2), { kind })).toBeUndefined();
	});

	it('without a first step, there is no line', () => {
		expect(stepText({ ...THREE, firstStep: undefined }, { kind: 'pendiente' })).toBeUndefined();
	});

	it('it does not cut it, even if it is long', () => {
		const tooLong = 'x'.repeat(500);

		expect(stepText({ ...atStep(2), steps: [tooLong] }, { kind: 'pendiente' })).toBe(`Paso: ${tooLong}`);
	});
});

describe('doneAction (spec §4.1 and §6.1)', () => {
	it('on a step that is not the last, it moves to the next', () => {
		expect(doneAction(THREE, [], NOW)).toStrictEqual({ kind: 'avanzar', change: { currentStep: 2 } });
		expect(doneAction(atStep(2), [], NOW)).toStrictEqual({ kind: 'avanzar', change: { currentStep: 3 } });
	});

	it('on the last step it completes the task', () => {
		expect(doneAction(atStep(3), [], NOW)).toStrictEqual({ kind: 'completar' });
	});

	it('with fewer steps than currentStep it acts on the last one: it completes', () => {
		expect(doneAction(atStep(8), [], NOW)).toStrictEqual({ kind: 'completar' });
	});

	it('a currentStep 0 from old data is step 1: it moves to 2', () => {
		expect(doneAction(atStep(0), [], NOW)).toStrictEqual({ kind: 'avanzar', change: { currentStep: 2 } });
	});

	it('on the last step, outside the schedule window, nothing (like the checkbox)', () => {
		const withSchedule = { ...atStep(3), schedule: [{ from: '18:00', to: '20:00' }] };

		expect(doneAction(withSchedule, [], NOW)).toStrictEqual({ kind: 'ninguna' });
		expect(doneAction(withSchedule, [], new Date(2026, 6, 15, 19, 0, 0))).toStrictEqual({ kind: 'completar' });
	});

	it('outside the window, on a step that is not the last, it moves on anyway', () => {
		const withSchedule = { ...THREE, schedule: [{ from: '18:00', to: '20:00' }] };

		expect(doneAction(withSchedule, [], NOW)).toStrictEqual({ kind: 'avanzar', change: { currentStep: 2 } });
	});

	it('on the last step of a completed one it does not complete again', () => {
		expect(doneAction(atStep(3), [completionOf('t1', CREATED)], NOW)).toStrictEqual({ kind: 'ninguna' });
	});

	it('a single-step task has no «Hecho»', () => {
		expect(doneAction(ONE_STEP, [], NOW)).toStrictEqual({ kind: 'ninguna' });
	});

	it('two «Hecho» from the same step write the same next step', () => {
		expect(doneAction(THREE, [], NOW)).toStrictEqual(doneAction(THREE, [], NOW));
	});
});

describe('previousStepChange (spec §4.1 and §6.1)', () => {
	it('goes back to the previous step', () => {
		expect(previousStepChange(atStep(3))).toStrictEqual({ currentStep: 2 });
	});

	it('to step 1 it removes the field (without the field, step 1)', () => {
		expect(previousStepChange(atStep(2))).toStrictEqual({ currentStep: null });
	});

	it('on step 1 it does not go past the first: nothing changes', () => {
		expect(previousStepChange(THREE)).toStrictEqual({});
	});

	it('with fewer steps than currentStep, it goes back to the one before the last', () => {
		expect(previousStepChange(atStep(9))).toStrictEqual({ currentStep: 2 });
	});
});

describe('stepButtons (spec §6.1)', () => {
	it('on step 1: «Hecho» and not «Paso anterior»', () => {
		expect(stepButtons(THREE, { kind: 'pendiente' }, [], NOW)).toStrictEqual({ previousStep: false, doneEnabled: true });
	});

	it('on another step: «Paso anterior» and «Hecho»', () => {
		expect(stepButtons(atStep(2), { kind: 'atrasada' }, [], NOW)).toStrictEqual({ previousStep: true, doneEnabled: true });
	});

	it('«Hecho» of the last step, disabled if the checkbox is; that of another step, not', () => {
		const schedule = [{ from: '18:00', to: '20:00' }];

		expect(stepButtons({ ...atStep(3), schedule }, { kind: 'atrasada' }, [], NOW)).toStrictEqual({ previousStep: true, doneEnabled: false });
		expect(stepButtons({ ...atStep(2), schedule }, { kind: 'atrasada' }, [], NOW)).toStrictEqual({ previousStep: true, doneEnabled: true });
	});

	it('a single-step task has no buttons', () => {
		expect(stepButtons(ONE_STEP, { kind: 'pendiente' }, [], NOW)).toBeUndefined();
	});

	it.each(['en espera', 'completada', 'pausada'] as const)('a %s row does not show them', (kind) => {
		expect(stepButtons(atStep(2), { kind }, [], NOW)).toBeUndefined();
	});
});

describe('complete and changeOnComplete (spec §4.1, Completar; §4.4)', () => {
	it('the completion of a task with two steps or more saves the step it was on', () => {
		expect(complete(atStep(2), [], 'c', NOW)).toStrictEqual({ id: 'c', taskId: 't1', completedAt: NOW, stepAtCompletion: 2 });
		expect(complete(THREE, [], 'c', NOW)).toMatchObject({ stepAtCompletion: 1 });
	});

	it('with fewer steps than currentStep, it saves the last one', () => {
		expect(complete(atStep(9), [], 'c', NOW)).toMatchObject({ stepAtCompletion: 3 });
	});

	it('a recurring task saves it too', () => {
		expect(complete({ ...RELATIVE, currentStep: 2 }, [], 'c', NOW)).toMatchObject({ stepAtCompletion: 2 });
	});

	it('on a single-step task the completion saves no step', () => {
		expect(complete({ ...ONE_STEP, currentStep: 2 }, [], 'c', NOW)).toStrictEqual({ id: 'c', taskId: 't1', completedAt: NOW });
	});

	it('completing goes back to step 1: removes currentStep', () => {
		expect(changeOnComplete(atStep(3))).toStrictEqual({ currentStep: null });
	});

	it('if it is already on step 1 without the field, nothing changes', () => {
		expect(changeOnComplete(THREE)).toStrictEqual({});
	});
});

describe('changeOnDeleteCompletion (spec §4.1, Deshacer; §5.4)', () => {
	const previous = completionOf('t1', new Date(2026, 6, 10, 8, 0, 0), 1);
	const recent = completionOf('t1', new Date(2026, 6, 14, 8, 0, 0), 2);
	const ofOther = completionOf('t9', new Date(2026, 6, 14, 9, 0, 0), 3);
	const completions = [previous, recent, ofOther];

	it('deleting the most recent one returns currentStep to its stepAtCompletion', () => {
		expect(changeOnDeleteCompletion(THREE, completions, recent)).toStrictEqual({ currentStep: 2 });
	});

	it('it also holds if the completions no longer include it', () => {
		expect(changeOnDeleteCompletion(THREE, [previous], recent)).toStrictEqual({ currentStep: 2 });
	});

	it('deleting one that is not the most recent does not change the progress', () => {
		expect(changeOnDeleteCompletion(atStep(3), completions, previous)).toStrictEqual({});
	});

	it('to step 1 it removes the field', () => {
		expect(changeOnDeleteCompletion(atStep(3), [completionOf('t1', NOW, 1)], completionOf('t1', NOW, 1))).toStrictEqual({ currentStep: null });
	});

	it('with the cap of the last step', () => {
		const ofFifth = completionOf('t1', NOW, 5);

		expect(changeOnDeleteCompletion(THREE, [ofFifth], ofFifth)).toStrictEqual({ currentStep: 3 });
	});

	it('a stepAtCompletion 0 from old data is step 1', () => {
		const fromZero = completionOf('t1', NOW, 0);

		expect(changeOnDeleteCompletion(atStep(2), [fromZero], fromZero)).toStrictEqual({ currentStep: null });
	});

	it('a completion without stepAtCompletion does not change the progress', () => {
		const withoutStep = completionOf('t1', NOW);

		expect(changeOnDeleteCompletion(atStep(2), [withoutStep], withoutStep)).toStrictEqual({});
	});

	it('a task that now has a single step does not change', () => {
		expect(changeOnDeleteCompletion({ ...ONE_STEP, currentStep: 2 }, completions, recent)).toStrictEqual({});
	});

	it('if it is already on that step, nothing changes', () => {
		expect(changeOnDeleteCompletion(atStep(2), completions, recent)).toStrictEqual({});
	});
});

describe('pendingRows with steps (spec §6.1)', () => {
	it('the row carries the step line and its buttons', () => {
		expect(pendingRows([atStep(2)], [], NOW)[0]).toMatchObject({
			firstStepText: 'Paso: Lavar',
			stepButtons: { previousStep: true, doneEnabled: true }
		});
	});

	it('a single-step task carries the line and no buttons', () => {
		const [row] = pendingRows([ONE_STEP], [], NOW);

		expect(row).toMatchObject({ firstStepText: 'Primer paso: Separar' });
		expect('stepButtons' in row).toBe(false);
	});

	it('a completed one (with Mostrar completadas) and a paused one carry no line or buttons', () => {
		const rows = pendingRows([atStep(2), { ...RELATIVE, paused: true }], [completionOf('t1', CREATED)], NOW, true, true);

		for (const row of rows) {
			expect('firstStepText' in row).toBe(false);
			expect('stepButtons' in row).toBe(false);
		}
	});

	it('the progress does not change the order of the list', () => {
		const order = (tasks: (OneOffTask | RecurringTask)[]) => pendingRows(tasks, [], NOW).map(({ task }) => task.id);

		expect(order([atStep(3), RELATIVE])).toStrictEqual(order([THREE, { ...RELATIVE, currentStep: 2 }]));
	});
});
