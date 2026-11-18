import { describe, expect, it } from 'vitest';
import { hasChanges } from './unsaved-changes';
import { createRecurringCalendar } from './create-recurring-calendar';
import { createRecurringRelative } from './create-recurring-relative';
import { createOneOff } from './create-one-off';
import { createFromData, taskData, type TaskData } from './task-data';
import { applyChange, taskFromDocument, type TaskDocument } from './task-document';
import { edit } from './editing';
import { normalizeSteps, stepItIsOn, taskSteps, hasSeveralSteps } from './steps';
import type { RecurringTask, OneOffTask } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const ONE_OFF: OneOffTask = { id: 't1', title: 'Ropa', kind: 'puntual', createdAt: CREATED, firstStep: 'Separar', steps: ['Lavar', 'Tender'] };

describe('normalizeSteps (spec §4.1, Steps: Text)', () => {
	it('trims each step', () => {
		expect(normalizeSteps(' Separar ', ['  Lavar', 'Tender  '])).toStrictEqual({ firstStep: 'Separar', steps: ['Lavar', 'Tender'] });
	});

	it('discards the empty or whitespace-only ones and the ones below move up', () => {
		expect(normalizeSteps('Separar', ['', 'Lavar', ' \t ', 'Tender'])).toStrictEqual({ firstStep: 'Separar', steps: ['Lavar', 'Tender'] });
	});

	it('if the first step is left empty and step 2 is not, step 2 becomes the first step', () => {
		expect(normalizeSteps('  ', ['Lavar', 'Tender'])).toStrictEqual({ firstStep: 'Lavar', steps: ['Tender'] });
	});

	it('without steps beyond the first, there is no steps field', () => {
		expect(normalizeSteps('Separar', ['', '  '])).toStrictEqual({ firstStep: 'Separar' });
		expect(normalizeSteps('Separar')).toStrictEqual({ firstStep: 'Separar' });
	});

	it('everything empty means no first step and no steps', () => {
		expect(normalizeSteps(' ', [' '])).toStrictEqual({});
		expect(normalizeSteps()).toStrictEqual({});
	});

	it('there is no maximum of steps or length', () => {
		const many = Array.from({ length: 200 }, (_, i) => `Paso ${i + 2} ${'x'.repeat(1000)}`);

		expect(normalizeSteps('Separar', many)).toStrictEqual({ firstStep: 'Separar', steps: many });
	});
});

describe('taskSteps and hasSeveralSteps (spec §4.1)', () => {
	it('the first step is step 1 and those of steps follow, in order', () => {
		expect(taskSteps(ONE_OFF)).toStrictEqual(['Separar', 'Lavar', 'Tender']);
		expect(hasSeveralSteps(ONE_OFF)).toBe(true);
	});

	it('with a first step and without steps, a single step', () => {
		const { steps: _, ...aStep } = ONE_OFF;

		expect(taskSteps(aStep)).toStrictEqual(['Separar']);
		expect(hasSeveralSteps(aStep)).toBe(false);
	});

	it('without a first step, no steps', () => {
		expect(taskSteps({ steps: ['Lavar'] })).toStrictEqual([]);
		expect(hasSeveralSteps({ steps: ['Lavar'] })).toBe(false);
	});
});

describe('stepItIsOn (spec §4.1, Steps: Progress)', () => {
	it('without currentStep, step 1', () => {
		expect(stepItIsOn(ONE_OFF)).toBe(1);
	});

	it('the stored currentStep', () => {
		expect(stepItIsOn({ ...ONE_OFF, currentStep: 2 })).toBe(2);
		expect(stepItIsOn({ ...ONE_OFF, currentStep: 3 })).toBe(3);
	});

	it('with fewer steps than currentStep, the last one', () => {
		expect(stepItIsOn({ ...ONE_OFF, currentStep: 7 })).toBe(3);
	});

	it.each([0, -2])('a currentStep %i from old data is step 1', (currentStep) => {
		expect(stepItIsOn({ ...ONE_OFF, currentStep })).toBe(1);
	});

	it('without steps, step 1', () => {
		expect(stepItIsOn({ currentStep: 3 })).toBe(1);
	});
});

describe('creating with steps (spec §4.1)', () => {
	const commons = { title: 'Ropa', firstStep: ' Separar', steps: ['Lavar ', '', 'Tender'] };

	it('the three shapes store the normalized steps', () => {
		const expected = { firstStep: 'Separar', steps: ['Lavar', 'Tender'] };

		expect(createOneOff(commons, 'p', CREATED)).toMatchObject({ ok: true, task: expected });
		expect(createRecurringRelative({ ...commons, every: 2, unit: 'dias' }, 'r', CREATED)).toMatchObject({ ok: true, task: expected });
		expect(createRecurringCalendar({ ...commons, weekdays: ['lunes'], monthDays: [] }, 'c', CREATED)).toMatchObject({ ok: true, task: expected });
	});

	it('a whitespace-only step does not reject the creation: it is created without it, without a steps field', () => {
		expect(createOneOff({ title: 'Ropa', firstStep: 'Separar', steps: ['   '] }, 't1', CREATED)).toStrictEqual({
			ok: true,
			task: { id: 't1', title: 'Ropa', kind: 'puntual', createdAt: CREATED, firstStep: 'Separar' }
		});
	});

	it('with the first step empty, step 2 becomes the first step', () => {
		expect(createOneOff({ title: 'Ropa', firstStep: '', steps: ['Lavar'] }, 't1', CREATED)).toMatchObject({
			ok: true,
			task: { firstStep: 'Lavar' }
		});
	});

	it('creating does not store currentStep', () => {
		const created = createOneOff(commons, 'p', CREATED);

		expect(created.ok && 'currentStep' in created.task).toBe(false);
	});
});

describe('taskData with steps (spec §6.2)', () => {
	it('loads the steps plus, and createFromData returns it unchanged', () => {
		const relative: RecurringTask = {
			id: 't2',
			title: 'Regar',
			kind: 'periodica',
			recurrence: { mode: 'relativo', every: 1, unit: 'dias' },
			createdAt: CREATED,
			firstStep: 'Llenar',
			steps: ['Regar']
		};
		const data = taskData(relative);

		expect(data).toMatchObject({ firstStep: 'Llenar', steps: ['Regar'] });
		expect(createFromData(data, relative.id, CREATED)).toStrictEqual({ ok: true, task: relative });
	});

	it('the loaded steps are a copy', () => {
		const data = taskData(ONE_OFF);

		expect(data.steps).not.toBe(ONE_OFF.steps);
	});

	it('without steps, the data has no field', () => {
		const { steps: _, ...aStep } = ONE_OFF;

		expect('steps' in taskData(aStep)).toBe(false);
	});
});

describe('taskFromDocument and applyChange with steps (spec §7)', () => {
	const DOC: TaskDocument = { id: 't1', title: 'Ropa', kind: 'puntual', createdAt: CREATED, firstStep: 'Separar' };

	it('the task keeps steps and currentStep from the document', () => {
		expect(taskFromDocument({ ...DOC, steps: ['Lavar'], currentStep: 2 })).toStrictEqual({ ...DOC, steps: ['Lavar'], currentStep: 2 });
	});

	it('a recurring task too', () => {
		const recurring: TaskDocument = { ...DOC, kind: 'periodica', recurrence: { mode: 'relativo', every: 1, unit: 'dias' } };

		expect(taskFromDocument({ ...recurring, steps: ['Lavar'], currentStep: 2 })).toMatchObject({ steps: ['Lavar'], currentStep: 2 });
	});

	it('without the fields, or with empty steps, it does not have them', () => {
		expect(taskFromDocument(DOC)).toStrictEqual(DOC);
		expect(taskFromDocument({ ...DOC, steps: [] })).toStrictEqual(DOC);
	});

	it('steps is replaced whole and currentStep is another field', () => {
		const [withSteps] = applyChange([{ ...DOC, steps: ['Lavar', 'Tender'], currentStep: 2 }], 't1', { steps: ['Planchar'] });

		expect(withSteps).toStrictEqual({ ...DOC, steps: ['Planchar'], currentStep: 2 });
		expect(applyChange([withSteps], 't1', { steps: null, currentStep: null })[0]).toStrictEqual(DOC);
	});
});

describe('editing the steps (spec §4.1, §7)', () => {
	const data = (changes: Partial<TaskData>) => ({ ...taskData(ONE_OFF), ...changes }) as TaskData;

	it('changing a step writes the whole list, trimmed', () => {
		expect(edit(ONE_OFF, data({ steps: ['Lavar', ' Planchar '] }))).toStrictEqual({ ok: true, change: { steps: ['Lavar', 'Planchar'] } });
	});

	it('adding a step writes the whole list', () => {
		expect(edit(ONE_OFF, data({ steps: ['Lavar', 'Tender', 'Guardar'] }))).toStrictEqual({ ok: true, change: { steps: ['Lavar', 'Tender', 'Guardar'] } });
	});

	it('the same steps, with spaces or an empty one that is discarded, change nothing', () => {
		expect(edit(ONE_OFF, data({ steps: [' Lavar ', '', 'Tender'] }))).toStrictEqual({ ok: true, change: {} });
	});

	it('removing all the steps plus removes it (null)', () => {
		expect(edit(ONE_OFF, data({ steps: ['', ' '] }))).toStrictEqual({ ok: true, change: { steps: null } });
	});

	it('emptying the first step moves step 2 up: both fields change', () => {
		expect(edit(ONE_OFF, data({ firstStep: '' }))).toStrictEqual({ ok: true, change: { firstStep: 'Lavar', steps: ['Tender'] } });
	});

	it('never writes currentStep, even if fewer steps remain', () => {
		const result = edit({ ...ONE_OFF, currentStep: 3 }, data({ steps: [] }));

		expect(result).toStrictEqual({ ok: true, change: { steps: null } });
	});

	it('changing the kind does not touch the steps', () => {
		const toRelative: TaskData = { ...taskData(ONE_OFF), shape: 'relativa', every: 1, unit: 'dias' } as TaskData;
		const result = edit({ ...ONE_OFF, currentStep: 2 }, toRelative);

		expect(result.ok && ('steps' in result.change || 'currentStep' in result.change)).toBe(false);
	});
});

describe('hasChanges with steps (spec §6.2)', () => {
	const OPEN: TaskData = { shape: 'puntual', title: 'Ropa', firstStep: 'Separar', steps: ['Lavar'] };
	const doesChange = (current: TaskData, onOpen: TaskData = OPEN) =>
		hasChanges({ data: onOpen }, { data: current });

	it('changing a step counts; the same with spaces around it, no', () => {
		expect(doesChange({ ...OPEN, steps: ['Tender'] })).toBe(true);
		expect(doesChange({ ...OPEN, steps: ['  Lavar '] })).toBe(false);
	});

	it('emptying or leaving a step with only whitespace counts', () => {
		expect(doesChange({ ...OPEN, steps: [''] })).toBe(true);
		expect(doesChange({ ...OPEN, steps: ['   '] })).toBe(true);
	});

	it('adding an empty or whitespace-only step counts as not changing; written, yes', () => {
		expect(doesChange({ ...OPEN, steps: ['Lavar', ''] })).toBe(false);
		expect(doesChange({ ...OPEN, steps: ['Lavar', '  '] })).toBe(false);
		expect(doesChange({ ...OPEN, steps: ['Lavar', 'Tender'] })).toBe(true);
	});

	it('removing an existing step counts', () => {
		expect(doesChange({ ...OPEN, steps: [] })).toBe(true);
	});

	it('with an invalid recurrence, an empty step also does not count', () => {
		const onCreate: TaskData = { shape: 'puntual', title: '' };

		expect(doesChange({ ...onCreate, steps: [''] }, onCreate)).toBe(false);
		expect(doesChange({ ...onCreate, steps: ['Lavar'] }, onCreate)).toBe(true);
	});

	it('with an invalid recurrence, an empty step does not count either', () => {
		const invalid: TaskData = { shape: 'relativa', title: 'Ropa', every: 0, unit: 'dias' };

		expect(doesChange({ ...invalid, steps: [' '] }, invalid)).toBe(false);
	});
});
