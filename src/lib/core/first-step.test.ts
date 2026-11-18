import { describe, expect, it } from 'vitest';
import { hasChanges } from './unsaved-changes';
import { createRecurringCalendar } from './create-recurring-calendar';
import { createRecurringRelative } from './create-recurring-relative';
import { createOneOff } from './create-one-off';
import { createFromData, taskData, type TaskData } from './task-data';
import { applyChange, taskFromDocument, type TaskDocument } from './task-document';
import { edit } from './editing';
import { pendingRows } from './pending';
import { stepText } from './current-step';
import type { Completion, RecurringTask, OneOffTask } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const NOW = new Date(2026, 6, 15, 8, 0, 0);
const STEP = 'Separar la ropa blanca';
const ONE_OFF: OneOffTask = { id: 't1', title: 'Ropa', kind: 'puntual', createdAt: CREATED, firstStep: STEP };
const RELATIVE: RecurringTask = {
	id: 't2',
	title: 'Regar',
	kind: 'periodica',
	recurrence: { mode: 'relativo', every: 1, unit: 'dias' },
	createdAt: CREATED,
	firstStep: STEP
};

describe('create with first step (spec §4.1)', () => {
	it('the three shapes save the trimmed first step', () => {
		const commons = { title: 'Ropa', firstStep: `  ${STEP} ` };

		expect(createOneOff(commons, 'p', CREATED)).toMatchObject({ ok: true, task: { firstStep: STEP } });
		expect(createRecurringRelative({ ...commons, every: 2, unit: 'dias' }, 'r', CREATED)).toMatchObject({ ok: true, task: { firstStep: STEP } });
		expect(createRecurringCalendar({ ...commons, weekdays: ['lunes'], monthDays: [] }, 'c', CREATED)).toMatchObject({
			ok: true,
			task: { firstStep: STEP }
		});
	});

	it.each(['', '   ', ' \t '])('empty or only spaces (%j) is no first step: the field is not saved', (firstStep) => {
		const result = createOneOff({ title: 'Ropa', firstStep }, 't1', CREATED);

		expect(result).toStrictEqual({ ok: true, task: { id: 't1', title: 'Ropa', kind: 'puntual', createdAt: CREATED } });
	});

	it('it is never invalid nor has a maximum length: it does not reject the creation', () => {
		const tooLong = 'x'.repeat(5000);

		expect(createOneOff({ title: 'Ropa', firstStep: tooLong }, 't1', CREATED)).toMatchObject({ ok: true, task: { firstStep: tooLong } });
	});

	it('it does not replace the note: they are different fields', () => {
		const result = createOneOff({ title: 'Ropa', note: 'Usar guantes', firstStep: STEP }, 't1', CREATED);

		expect(result).toMatchObject({ ok: true, task: { note: 'Usar guantes', firstStep: STEP } });
	});
});

describe('taskData with first step (spec §6.2)', () => {
	it('when editing, the panel loads the current first step, and createFromData returns it the same', () => {
		const data = taskData(RELATIVE);

		expect(data).toMatchObject({ shape: 'relativa', firstStep: STEP });
		expect(createFromData(data, RELATIVE.id, CREATED)).toStrictEqual({ ok: true, task: RELATIVE });
	});

	it('a task without a first step loads the data without the field', () => {
		const { firstStep: _, ...withoutStep } = ONE_OFF;

		expect(taskData(withoutStep)).toStrictEqual({ shape: 'puntual', title: 'Ropa' });
	});
});

describe('taskFromDocument and applyChange with first step (spec §7)', () => {
	const DOC: TaskDocument = { id: 't1', title: 'Ropa', kind: 'puntual', createdAt: CREATED };

	it('the task keeps the first step of the document; without the field, it has none', () => {
		expect(taskFromDocument({ ...DOC, firstStep: STEP })).toStrictEqual({ ...DOC, firstStep: STEP });
		expect(taskFromDocument(DOC)).toStrictEqual(DOC);
	});

	it('a change writes the first step, null removes it, and does not touch the note', () => {
		const withNote = { ...DOC, note: 'Usar guantes' };
		const [withStep] = applyChange([withNote], 't1', { firstStep: STEP });

		expect(withStep).toStrictEqual({ ...withNote, firstStep: STEP });
		expect(applyChange([withStep], 't1', { firstStep: null })[0]).toStrictEqual(withNote);
	});
});

describe('edit the first step (spec §4.1, §7)', () => {
	const data = (changes: Partial<TaskData>) => ({ ...taskData(ONE_OFF), ...changes }) as TaskData;

	it('another first step enters the change, trimmed', () => {
		expect(edit(ONE_OFF, data({ firstStep: ' Lavar ' }))).toStrictEqual({ ok: true, change: { firstStep: 'Lavar' } });
	});

	it('the same one, even with spaces around, changes nothing', () => {
		expect(edit(ONE_OFF, data({ firstStep: `  ${STEP}  ` }))).toStrictEqual({ ok: true, change: {} });
	});

	it('empty or only spaces removes it (null)', () => {
		expect(edit(ONE_OFF, data({ firstStep: '   ' }))).toStrictEqual({ ok: true, change: { firstStep: null } });
	});

	it('changing the kind does not touch it', () => {
		const toRelative: TaskData = { shape: 'relativa', title: 'Ropa', firstStep: STEP, every: 1, unit: 'dias' };
		const result = edit(ONE_OFF, toRelative);

		expect(result.ok && 'firstStep' in result.change).toBe(false);
	});
});

describe('hasChanges with first step (spec §6.2)', () => {
	const OPEN: TaskData = { shape: 'puntual', title: 'Ropa', firstStep: STEP };
	const doesChange = (current: TaskData, onOpen: TaskData = OPEN) =>
		hasChanges({ data: onOpen }, { data: current });

	it('another first step is a change; the same with spaces around is not', () => {
		expect(doesChange({ ...OPEN, firstStep: 'Lavar' })).toBe(true);
		expect(doesChange({ ...OPEN, firstStep: `  ${STEP} ` })).toBe(false);
	});

	it('emptying an existing first step is a change', () => {
		expect(doesChange({ ...OPEN, firstStep: '' })).toBe(true);
	});

	it('without the field, empty and only spaces are the same', () => {
		const withoutStep: TaskData = { shape: 'puntual', title: 'Ropa' };

		expect(doesChange({ ...withoutStep, firstStep: '   ' }, withoutStep)).toBe(false);
		expect(doesChange({ ...withoutStep, firstStep: '' }, { ...withoutStep, firstStep: '  ' })).toBe(false);
	});

	it('with an invalid repetition, the spaces of the first step do not count either', () => {
		const invalid: TaskData = { shape: 'relativa', title: 'Ropa', every: 0, unit: 'dias' };

		expect(doesChange({ ...invalid, firstStep: '  ' }, invalid)).toBe(false);
	});
});

describe('stepText with a single step (spec §6.1)', () => {
	it.each(['pendiente', 'atrasada'] as const)('a %s row shows it with the prefix and the full text', (kind) => {
		expect(stepText(ONE_OFF, { kind })).toBe(`Primer paso: ${STEP}`);
	});

	it.each(['en espera', 'completada', 'pausada'] as const)('a %s row does not show it', (kind) => {
		expect(stepText(ONE_OFF, { kind })).toBeUndefined();
	});

	it('a task without a first step does not show it', () => {
		const { firstStep: _, ...withoutStep } = ONE_OFF;

		expect(stepText(withoutStep, { kind: 'pendiente' })).toBeUndefined();
	});

	it('it does not cut it, even if it is long', () => {
		const tooLong = 'x'.repeat(500);

		expect(stepText({ ...ONE_OFF, firstStep: tooLong }, { kind: 'pendiente' })).toBe(`Primer paso: ${tooLong}`);
	});
});

describe('pendingRows with first step (spec §6.1)', () => {
	const completion: Completion = { id: 'c', taskId: RELATIVE.id, completedAt: new Date(2026, 6, 15, 7, 0, 0) };
	const texts = (completions: Completion[], tasks = [ONE_OFF, RELATIVE]) =>
		pendingRows(tasks, completions, NOW, true, true).map(({ task, firstStepText }) => [task.id, firstStepText]);

	it('the pending and overdue rows carry it; a completed waiting one does not', () => {
		expect(texts([])).toStrictEqual([
			['t2', `Primer paso: ${STEP}`],
			['t1', `Primer paso: ${STEP}`]
		]);
		expect(texts([completion])).toStrictEqual([
			['t1', `Primer paso: ${STEP}`],
			['t2', undefined]
		]);
	});

	it('a paused one does not carry it', () => {
		expect(texts([], [{ ...RELATIVE, paused: true }])).toStrictEqual([['t2', undefined]]);
	});

	it('completing the task does not delete it: it returns when the recurring task is pending again', () => {
		const onNextDay = new Date(2026, 6, 16, 7, 30, 0);

		expect(pendingRows([RELATIVE], [completion], onNextDay)[0]).toMatchObject({ firstStepText: `Primer paso: ${STEP}` });
	});

	it('it does not reorder the list', () => {
		const { firstStep: _p, ...oneOffWithoutStep } = ONE_OFF;
		const { firstStep: _r, ...relativeWithoutStep } = RELATIVE;
		const order = (tasks: (OneOffTask | RecurringTask)[]) => pendingRows(tasks, [], NOW).map(({ task }) => task.id);

		expect(order([ONE_OFF, RELATIVE])).toStrictEqual(order([oneOffWithoutStep, relativeWithoutStep]));
	});
});
