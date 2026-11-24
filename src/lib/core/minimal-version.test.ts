import { describe, expect, it } from 'vitest';
import { noticeOnComplete, noticeText } from './notice';
import { hasChanges } from './unsaved-changes';
import { checkboxAction } from './checkbox';
import { complete } from './completions';
import { createRecurringCalendar } from './create-recurring-calendar';
import { createRecurringRelative } from './create-recurring-relative';
import { createOneOff } from './create-one-off';
import { createFromData, taskData, type TaskData } from './task-data';
import { applyChange, taskFromDocument, type TaskDocument } from './task-document';
import { edit } from './editing';
import { taskStatus } from './task-status';
import { history } from './history';
import { changeOnDeleteCompletion, changeOnComplete } from './current-step';
import { pendingRows } from './pending';
import type { Completion, RecurringTask, OneOffTask } from './task';
import { doTheMinimal, minimalLine } from './minimal-version';

const CREATED = new Date(2026, 10, 1, 8, 0, 0);
const NOW = new Date(2026, 10, 13, 10, 0, 0);
const MINIMAL = 'Solo el inodoro';
const ONE_OFF: OneOffTask = { id: 't1', title: 'Baño', kind: 'puntual', createdAt: CREATED, minimalVersion: MINIMAL };
const RELATIVE: RecurringTask = {
	id: 't2',
	title: 'Regar',
	kind: 'periodica',
	recurrence: { mode: 'relativo', every: 2, unit: 'dias' },
	createdAt: CREATED,
	minimalVersion: MINIMAL
};
const WITH_STEPS: OneOffTask = { ...ONE_OFF, firstStep: 'Guantes', steps: ['Inodoro', 'Pileta'], currentStep: 2 };

describe('creating with a minimal version (spec §4.1)', () => {
	it('the three shapes store the trimmed minimal version', () => {
		const commons = { title: 'Baño', minimalVersion: `  ${MINIMAL} ` };

		expect(createOneOff(commons, 'p', CREATED)).toMatchObject({ ok: true, task: { minimalVersion: MINIMAL } });
		expect(createRecurringRelative({ ...commons, every: 2, unit: 'dias' }, 'r', CREATED)).toMatchObject({ ok: true, task: { minimalVersion: MINIMAL } });
		expect(createRecurringCalendar({ ...commons, weekdays: ['lunes'], monthDays: [] }, 'c', CREATED)).toMatchObject({
			ok: true,
			task: { minimalVersion: MINIMAL }
		});
	});

	it.each(['', '   ', ' \t '])('empty or whitespace-only (%j) means no minimal version: the field is not stored', (minimalVersion) => {
		expect(createOneOff({ title: 'Baño', minimalVersion }, 't1', CREATED)).toStrictEqual({
			ok: true,
			task: { id: 't1', title: 'Baño', kind: 'puntual', createdAt: CREATED }
		});
	});

	it('is never invalid and has no maximum length, and does not replace the note or the first step', () => {
		const long = 'x'.repeat(5000);
		const result = createOneOff({ title: 'Baño', note: 'Guantes', firstStep: 'Lavandina', minimalVersion: long }, 't1', CREATED);

		expect(result).toMatchObject({ ok: true, task: { note: 'Guantes', firstStep: 'Lavandina', minimalVersion: long } });
	});
});

describe('taskData and document with a minimal version (spec §6.2, §7)', () => {
	it('when editing, the panel loads it, and createFromData returns it unchanged', () => {
		const data = taskData(RELATIVE);

		expect(data).toMatchObject({ minimalVersion: MINIMAL });
		expect(createFromData(data, RELATIVE.id, CREATED)).toStrictEqual({ ok: true, task: RELATIVE });
	});

	it('a task without the field opens the panel without a minimal version', () => {
		const { minimalVersion: _, ...withoutMinimal } = ONE_OFF;

		expect(taskData(withoutMinimal)).not.toHaveProperty('minimalVersion');
	});

	it('the document keeps it; without the field, the task has none (no migration)', () => {
		const doc: TaskDocument = { id: 't1', title: 'Baño', kind: 'puntual', createdAt: CREATED };

		expect(taskFromDocument({ ...doc, minimalVersion: MINIMAL })).toMatchObject({ minimalVersion: MINIMAL });
		expect(taskFromDocument(doc)).not.toHaveProperty('minimalVersion');
	});
});

describe('editing the minimal version (spec §6.2, §7)', () => {
	const withMinimal = (minimalVersion: string): TaskData => ({ ...taskData(ONE_OFF), minimalVersion });

	it('only enters the change if it changed, trimmed', () => {
		expect(edit(ONE_OFF, withMinimal(` ${MINIMAL}  `))).toStrictEqual({ ok: true, change: {} });
		expect(edit(ONE_OFF, withMinimal(' Solo la pileta '))).toStrictEqual({ ok: true, change: { minimalVersion: 'Solo la pileta' } });
	});

	it('emptying it removes it with null, and applying the change leaves the document without the field', () => {
		const result = edit(ONE_OFF, withMinimal('  '));
		const doc: TaskDocument = { ...ONE_OFF };

		expect(result).toStrictEqual({ ok: true, change: { minimalVersion: null } });
		if (!result.ok) return;
		expect(applyChange([doc], ONE_OFF.id, result.change)[0]).not.toHaveProperty('minimalVersion');
	});

	it('changing the kind does not touch it', () => {
		const data: TaskData = { ...taskData(ONE_OFF), shape: 'relativa', every: 2, unit: 'dias' };
		const result = edit(ONE_OFF, data);

		expect(result.ok && result.change).not.toHaveProperty('minimalVersion');
	});
});

describe('Unsaved changes with a minimal version (spec §6.2)', () => {
	const values = (data: TaskData) => ({ data });
	const onOpen = values(taskData(ONE_OFF));
	const withMinimal = (minimalVersion: string | undefined) => values({ ...taskData(ONE_OFF), minimalVersion });

	it('writing another counts; going back to the original value or adding spaces does not', () => {
		expect(hasChanges(onOpen, withMinimal('Solo la pileta'))).toBe(true);
		expect(hasChanges(onOpen, withMinimal(MINIMAL))).toBe(false);
		expect(hasChanges(onOpen, withMinimal(`  ${MINIMAL} `))).toBe(false);
	});

	it('emptying an existing one counts; empty and missing are the same', () => {
		expect(hasChanges(onOpen, withMinimal(''))).toBe(true);
		const withoutMinimal = values({ shape: 'puntual', title: 'Baño' });
		expect(hasChanges(withoutMinimal, values({ shape: 'puntual', title: 'Baño', minimalVersion: '  ' }))).toBe(false);
	});

	it('with an invalid recurrence, an empty minimal version does not count as a change', () => {
		const invalid: TaskData = { shape: 'relativa', title: 'Regar', every: 0, unit: 'dias' };

		expect(hasChanges(values(invalid), values({ ...invalid, minimalVersion: '' }))).toBe(false);
	});
});

describe('minimalLine: the row offers the minimal version (spec §6.1)', () => {
	it('on a pending row, «Mínima: » and the full text, with the button enabled', () => {
		expect(minimalLine(ONE_OFF, { kind: 'pendiente' }, [], NOW)).toStrictEqual({ text: `Mínima: ${MINIMAL}`, enabled: true });
	});

	it('on an overdue row too, even if the task has no first step', () => {
		expect(minimalLine(ONE_OFF, { kind: 'atrasada' }, [], NOW)?.text).toBe(`Mínima: ${MINIMAL}`);
	});

	it.each([{ kind: 'en espera', progress: 0.5 }, { kind: 'completada' }, { kind: 'pausada' }] as const)('is not shown on a %o row', (status) => {
		expect(minimalLine(ONE_OFF, status, [], NOW)).toBeUndefined();
	});

	it('without a minimal version it is not shown', () => {
		const { minimalVersion: _, ...withoutMinimal } = ONE_OFF;

		expect(minimalLine(withoutMinimal, { kind: 'pendiente' }, [], NOW)).toBeUndefined();
	});

	it('outside the time window the button is disabled, like the checkbox (§5.5)', () => {
		const withSchedule: OneOffTask = { ...ONE_OFF, schedule: [{ from: '08:00', to: '09:00' }] };

		expect(minimalLine(withSchedule, { kind: 'atrasada' }, [], NOW)).toStrictEqual({ text: `Mínima: ${MINIMAL}`, enabled: false });
	});
});

describe('pendingRows with the minimal version (spec §6.1)', () => {
	it('the pending row carries it, the completed one does not', () => {
		const completion: Completion = { id: 'c1', taskId: RELATIVE.id, completedAt: new Date(2026, 10, 13, 9, 0, 0) };
		const other: OneOffTask = { ...ONE_OFF, id: 't9', title: 'Cocina' };
		const rows = pendingRows([RELATIVE, other], [completion], NOW, true);

		expect(rows.map(({ task, minimal }) => [task.id, minimal?.text])).toStrictEqual([
			['t9', `Mínima: ${MINIMAL}`],
			['t2', undefined]
		]);
	});

	it('a postponed task does not offer it', () => {
		const postponed: OneOffTask = { ...ONE_OFF, postponed: { from: CREATED, to: new Date(2026, 10, 20) } };

		expect(pendingRows([postponed], [], NOW)[0]).not.toHaveProperty('minimal');
	});

	it('the order does not change because of having a minimal version', () => {
		const { minimalVersion: _, ...withoutMinimal } = ONE_OFF;
		const a: OneOffTask = { ...withoutMinimal, id: 'a', title: 'A' };
		const b: OneOffTask = { ...ONE_OFF, id: 'b', title: 'B' };

		expect(pendingRows([b, a], [], NOW).map(({ task }) => task.id)).toStrictEqual(['a', 'b']);
	});
});

describe('doTheMinimal (spec §6.1, §4.4)', () => {
	it('completes like the checkbox, with wasMinimal set to true', () => {
		expect(doTheMinimal(ONE_OFF, [], 'c1', NOW)).toStrictEqual({ id: 'c1', taskId: ONE_OFF.id, completedAt: NOW, wasMinimal: true });
	});

	it('on a calendar task it covers the same occurrence as a full completion', () => {
		const weekly: RecurringTask = { ...RELATIVE, recurrence: { mode: 'calendario', weekdays: ['jueves'] } };
		const { wasMinimal, ...rest } = doTheMinimal(weekly, [], 'c1', NOW) ?? {};

		expect(wasMinimal).toBe(true);
		expect(rest).toStrictEqual(complete(weekly, [], 'c1', NOW));
	});

	it('counts for the status like any completion: the relative one goes to waiting', () => {
		const completion = doTheMinimal(RELATIVE, [], 'c1', NOW);

		expect(completion && taskStatus(RELATIVE, [completion], NOW).kind).toBe('en espera');
	});

	it('at any step it stores stepAtCompletion and the task goes back to step 1; deleting it returns the step', () => {
		const completion = doTheMinimal(WITH_STEPS, [], 'c1', NOW);

		expect(completion).toMatchObject({ stepAtCompletion: 2, wasMinimal: true });
		expect(changeOnComplete(WITH_STEPS)).toStrictEqual({ currentStep: null });
		if (!completion) return;
		expect(changeOnDeleteCompletion({ ...WITH_STEPS, currentStep: undefined }, [completion], completion)).toStrictEqual({ currentStep: 2 });
	});

	it('does not complete if there is no minimal version', () => {
		const { minimalVersion: _, ...withoutMinimal } = ONE_OFF;

		expect(doTheMinimal(withoutMinimal, [], 'c1', NOW)).toBeUndefined();
	});

	it('does not complete a completed, postponed or paused task, nor outside the time window', () => {
		const doneItem: Completion = { id: 'c0', taskId: ONE_OFF.id, completedAt: CREATED };
		const postponed: OneOffTask = { ...ONE_OFF, postponed: { from: CREATED, to: new Date(2026, 10, 20) } };
		const paused: RecurringTask = { ...RELATIVE, paused: true };
		const outsideSchedule: OneOffTask = { ...ONE_OFF, schedule: [{ from: '08:00', to: '09:00' }] };

		expect(doTheMinimal(ONE_OFF, [doneItem], 'c1', NOW)).toBeUndefined();
		expect(doTheMinimal(postponed, [], 'c1', NOW)).toBeUndefined();
		expect(doTheMinimal(paused, [], 'c1', NOW)).toBeUndefined();
		expect(doTheMinimal(outsideSchedule, [], 'c1', NOW)).toBeUndefined();
	});

	it('a full completion does not carry the field', () => {
		expect(complete(ONE_OFF, [], 'c1', NOW)).not.toHaveProperty('wasMinimal');
	});

	it('editing or emptying the minimal version does not touch the completions', () => {
		const result = edit(ONE_OFF, { ...taskData(ONE_OFF), minimalVersion: '' });

		expect(result.ok && Object.keys(result.change)).toStrictEqual(['minimalVersion']);
	});
});

describe('checkbox of a task completed with the minimal version (spec §5.4, §6.1)', () => {
	it('of a recurring task it deletes the most recent completion, full or minimal', () => {
		const whole: Completion = { id: 'c1', taskId: RELATIVE.id, completedAt: new Date(2026, 10, 12, 9, 0, 0) };
		const minimum: Completion = { id: 'c2', taskId: RELATIVE.id, completedAt: new Date(2026, 10, 13, 9, 0, 0), wasMinimal: true };
		const wholeToday: Completion = { ...whole, completedAt: minimum.completedAt };
		const minimumBefore: Completion = { ...minimum, completedAt: whole.completedAt };

		expect(checkboxAction(RELATIVE, [whole, minimum], NOW)).toStrictEqual({ kind: 'remove', completion: minimum });
		expect(checkboxAction(RELATIVE, [wholeToday, minimumBefore], NOW)).toStrictEqual({ kind: 'remove', completion: wholeToday });
	});

	it('a recurring task completed with the minimal version a previous day is completed again, in full', () => {
		const minimum: Completion = { id: 'c1', taskId: RELATIVE.id, completedAt: new Date(2026, 10, 12, 9, 0, 0), wasMinimal: true };
		const daily: RecurringTask = { ...RELATIVE, recurrence: { mode: 'relativo', every: 2, unit: 'horas' } };

		expect(checkboxAction(daily, [minimum], NOW)).toStrictEqual({ kind: 'complete' });
		expect(complete(daily, [minimum], 'c2', NOW)).not.toHaveProperty('wasMinimal');
	});
});

describe('noticeText (spec §5.4)', () => {
	const task: OneOffTask = { ...ONE_OFF, title: 'Regar', emoji: '🌱' };

	it('a minimal-version completion adds « · mínima», without the minimal version text', () => {
		const completion: Completion = { id: 'c1', taskId: task.id, completedAt: NOW, wasMinimal: true };

		expect(noticeText(noticeOnComplete(task, completion))).toBe('Completaste «🌱 Regar» · mínima');
	});

	it('a full completion adds nothing', () => {
		const completion: Completion = { id: 'c1', taskId: task.id, completedAt: NOW };

		expect(noticeText(noticeOnComplete(task, completion))).toBe('Completaste «🌱 Regar»');
	});
});

describe('History with the minimal version (spec §6.3)', () => {
	it('the time of a minimal-version completion adds «Mínima», that of a full one does not', () => {
		const minimum: Completion = { id: 'c1', taskId: ONE_OFF.id, completedAt: new Date(2026, 10, 13, 8, 5), wasMinimal: true };
		const whole: Completion = { id: 'c2', taskId: ONE_OFF.id, completedAt: new Date(2026, 10, 13, 9, 0) };
		const [today] = history([ONE_OFF], [minimum, whole], NOW);

		expect(today?.entries.map(({ hour, timeText }) => [hour, timeText])).toStrictEqual([
			['09:00', '09:00'],
			['08:05', '08:05 Mínima']
		]);
	});
});
