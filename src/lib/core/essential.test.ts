import { describe, expect, it } from 'vitest';
import { isEssential } from './essential';
import { createOneOff } from './create-one-off';
import { createRecurringRelative } from './create-recurring-relative';
import { createRecurringCalendar } from './create-recurring-calendar';
import { createFromData, dataOnCreate, DATA_ON_CREATE, taskData } from './task-data';
import { taskFromDocument, applyChange, type TaskDocument } from './task-document';
import { edit } from './editing';
import { hasChanges } from './unsaved-changes';
import { taskStatus } from './task-status';
import { pendingRows } from './pending';
import type { Completion, OneOffTask, RecurringTask } from './task';

const NOW = new Date(2026, 6, 15, 12, 0, 0);
const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const RELATIVE: RecurringTask = { id: 'r', title: 'Regar', kind: 'periodica', recurrence: { mode: 'relativo', every: 2, unit: 'dias' }, createdAt: CREATED };
const ONE_OFF: OneOffTask = { id: 'p', title: 'Pagar', kind: 'puntual', createdAt: CREATED };

describe('isEssential (spec §4.1, Essential)', () => {
	it('only a task with essential = true is essential; without the field, it is not', () => {
		expect(isEssential({ ...ONE_OFF, essential: true })).toBe(true);
		expect(isEssential({ ...RELATIVE, essential: true })).toBe(true);
		expect(isEssential(ONE_OFF)).toBe(false);
		expect(isEssential({ ...ONE_OFF, essential: false })).toBe(false);
	});
});

describe('creating with the Esencial check (spec §4.1, §6.2)', () => {
	it('every creator stores essential = true only when checked', () => {
		const relative = { title: 'Regar', every: 2, unit: 'dias' as const };
		const calendar = { title: 'Basura', weekdays: ['martes' as const], monthDays: [] };
		const created = [
			createOneOff({ title: 'Foco', essential: true }, 'a', NOW),
			createRecurringRelative({ ...relative, essential: true }, 'b', NOW),
			createRecurringCalendar({ ...calendar, essential: true }, 'c', NOW)
		];
		for (const result of created) expect(result.ok && result.task.essential).toBe(true);
		const unchecked = [
			createOneOff({ title: 'Foco', essential: false }, 'a', NOW),
			createRecurringRelative({ ...relative, essential: false }, 'b', NOW),
			createRecurringCalendar(calendar, 'c', NOW)
		];
		for (const result of unchecked) expect(result.ok && 'essential' in result.task).toBe(false);
	});

	it('the create panel starts unchecked with the mode off and checked with it on', () => {
		expect(dataOnCreate(false)).toStrictEqual(DATA_ON_CREATE);
		expect(dataOnCreate(false).essential).toBeUndefined();
		expect(dataOnCreate(true)).toStrictEqual({ ...DATA_ON_CREATE, essential: true });
	});

	it('the edit panel loads the current value of the mark', () => {
		expect(taskData({ ...RELATIVE, essential: true }).essential).toBe(true);
		expect('essential' in taskData(RELATIVE)).toBe(false);
		const again = createFromData(taskData({ ...ONE_OFF, essential: true }), 'p', CREATED);
		expect(again.ok && again.task.essential).toBe(true);
	});
});

describe('the stored mark (spec §4.1, §7)', () => {
	const doc: TaskDocument = { id: 'p', title: 'Pagar', kind: 'puntual', createdAt: CREATED };

	it('a document with essential = true gives an essential task, of any kind; without it, not', () => {
		expect(taskFromDocument({ ...doc, essential: true }).essential).toBe(true);
		expect(taskFromDocument({ ...doc, kind: 'periodica', recurrence: RELATIVE.recurrence, essential: true }).essential).toBe(true);
		expect('essential' in taskFromDocument(doc)).toBe(false);
	});

	it('unchecking removes the field from the document', () => {
		expect(applyChange([{ ...doc, essential: true }], 'p', { essential: null })).toStrictEqual([doc]);
	});
});

describe('editing the mark (spec §4.1, §7)', () => {
	it('checking writes essential = true and unchecking writes null; nothing else', () => {
		expect(edit(ONE_OFF, { ...taskData(ONE_OFF), essential: true })).toStrictEqual({ ok: true, change: { essential: true } });
		const essential = { ...RELATIVE, essential: true };
		expect(edit(essential, { ...taskData(essential), essential: false })).toStrictEqual({ ok: true, change: { essential: null } });
	});

	it('an edit that does not change the mark does not write it', () => {
		const essential = { ...RELATIVE, essential: true };
		expect(edit(essential, { ...taskData(essential), title: 'Regar plantas' })).toStrictEqual({ ok: true, change: { title: 'Regar plantas' } });
	});

	it('changing the kind keeps the mark', () => {
		const essential = { ...RELATIVE, essential: true };
		const result = edit(essential, { shape: 'puntual', title: 'Regar', essential: true }, NOW);
		expect(result.ok && 'essential' in result.change).toBe(false);
	});
});

describe('unsaved changes of the Esencial check (spec §6.2)', () => {
	it('checking or unchecking is a change; going back to the starting value is not', () => {
		const data = taskData(ONE_OFF);
		expect(hasChanges({ data }, { data: { ...data, essential: true } })).toBe(true);
		expect(hasChanges({ data: { ...data, essential: true } }, { data: { ...data, essential: false } })).toBe(true);
		expect(hasChanges({ data }, { data: { ...data, essential: false } })).toBe(false);
	});

	it('creating with the mode on: the checked start is not a change; unchecking is', () => {
		const onOpen = { data: dataOnCreate(true) };
		expect(hasChanges(onOpen, { data: dataOnCreate(true) })).toBe(false);
		expect(hasChanges(onOpen, { data: { ...dataOnCreate(true), essential: false } })).toBe(true);
	});
});

describe('the mark changes neither status nor order (spec §4.1)', () => {
	const completions: Completion[] = [{ id: 'c', taskId: 'r', completedAt: new Date(2026, 6, 1, 9, 0, 0) }];

	it('the status of an essential task is that of the same task without the mark', () => {
		expect(taskStatus({ ...RELATIVE, essential: true }, completions, NOW)).toStrictEqual(taskStatus(RELATIVE, completions, NOW));
	});

	it('the order with the mode off does not depend on the mark', () => {
		const pay: OneOffTask = { ...ONE_OFF, dueDate: new Date(2026, 6, 14) };
		const focus: OneOffTask = { id: 'f', title: 'Foco', kind: 'puntual', createdAt: CREATED, essential: true };
		const titles = pendingRows([focus, pay], [], NOW).map(({ task }) => task.title);
		expect(titles).toStrictEqual(['Pagar', 'Foco']);
	});
});
