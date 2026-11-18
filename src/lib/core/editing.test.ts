import { describe, expect, it } from 'vitest';
import { taskData } from './task-data';
import { edit } from './editing';
import type { RecurringTask, OneOffTask } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const ONE_OFF: OneOffTask = { id: 't1', title: 'Pagar', kind: 'puntual', dueDate: new Date(2026, 6, 14), createdAt: CREATED };
const RELATIVE: RecurringTask = {
	id: 't2',
	title: 'Regar',
	kind: 'periodica',
	recurrence: { mode: 'relativo', every: 2, unit: 'dias' },
	createdAt: CREATED
};
const WEEKLY: RecurringTask = {
	id: 't3',
	title: 'Basura',
	kind: 'periodica',
	recurrence: { mode: 'calendario', weekdays: ['martes', 'jueves'] },
	createdAt: CREATED
};
const MONTHLY: RecurringTask = { ...WEEKLY, recurrence: { mode: 'calendario', monthDays: [10, 31] } };

describe('taskData', () => {
	it('gives the current values of each shape, as the panel loads them', () => {
		expect(taskData(ONE_OFF)).toStrictEqual({ shape: 'puntual', title: 'Pagar', dueDate: '2026-07-14' });
		expect(taskData({ ...ONE_OFF, dueDate: undefined })).toStrictEqual({ shape: 'puntual', title: 'Pagar' });
		expect(taskData(RELATIVE)).toStrictEqual({ shape: 'relativa', title: 'Regar', every: 2, unit: 'dias' });
		expect(taskData(WEEKLY)).toStrictEqual({
			shape: 'calendario',
			title: 'Basura',
			weekdays: ['martes', 'jueves'],
			monthDays: []
		});
		expect(taskData(MONTHLY)).toStrictEqual({ shape: 'calendario', title: 'Basura', weekdays: [], monthDays: [10, 31] });
	});
});

describe('taskData with emoji and note', () => {
	it('includes them when the task has them', () => {
		expect(taskData({ ...ONE_OFF, emoji: '🌱', note: 'Usar guantes' })).toStrictEqual({
			shape: 'puntual',
			title: 'Pagar',
			emoji: '🌱',
			note: 'Usar guantes',
			dueDate: '2026-07-14'
		});
		expect(taskData({ ...RELATIVE, emoji: '🌱' })).toMatchObject({ shape: 'relativa', emoji: '🌱' });
		expect(taskData({ ...WEEKLY, note: 'x' })).toMatchObject({ shape: 'calendario', note: 'x' });
		expect(taskData({ ...MONTHLY, note: 'x' })).toMatchObject({ shape: 'calendario', note: 'x' });
	});
});

describe('edit emoji and note', () => {
	it('writes only the field that changed', () => {
		const withEmoji = { ...ONE_OFF, emoji: '🌱', note: 'Usar guantes' };

		expect(edit(withEmoji, { ...taskData(withEmoji), emoji: '🔥' })).toStrictEqual({ ok: true, change: { emoji: '🔥' } });
		expect(edit(withEmoji, { ...taskData(withEmoji), note: '  Ventilar ' })).toStrictEqual({ ok: true, change: { note: 'Ventilar' } });
	});

	it('saving the same emoji or note, even with spaces around, changes nothing', () => {
		const withEmoji = { ...ONE_OFF, emoji: '🌱', note: 'Usar guantes' };

		expect(edit(withEmoji, { ...taskData(withEmoji), emoji: ' 🌱 ', note: ' Usar guantes ' })).toStrictEqual({ ok: true, change: {} });
	});

	it('setting emoji and note on a task that did not have them writes them', () => {
		expect(edit(ONE_OFF, { ...taskData(ONE_OFF), emoji: '👍🏽', note: 'Hola' })).toStrictEqual({
			ok: true,
			change: { emoji: '👍🏽', note: 'Hola' }
		});
	});

	it('emptying them or leaving them as spaces removes them (null)', () => {
		const withEmoji = { ...ONE_OFF, emoji: '🌱', note: 'Usar guantes' };

		expect(edit(withEmoji, { ...taskData(withEmoji), emoji: '   ', note: '' })).toStrictEqual({
			ok: true,
			change: { emoji: null, note: null }
		});
	});

	it('an invalid emoji rejects the whole edit, the valid title too', () => {
		expect(edit(ONE_OFF, { ...taskData(ONE_OFF), title: 'Pagar la luz', emoji: '🌱🔥' })).toStrictEqual({
			ok: false,
			errors: { emoji: 'invalido' }
		});
	});
});

describe('edit', () => {
	it('saving without changes changes no field', () => {
		for (const task of [ONE_OFF, RELATIVE, WEEKLY, MONTHLY])
			expect(edit(task, taskData(task))).toStrictEqual({ ok: true, change: {} });
	});

	it('changing the title changes only the title, without the spaces at the ends', () => {
		expect(edit(RELATIVE, { ...taskData(RELATIVE), title: '  Regar plantas ' })).toStrictEqual({
			ok: true,
			change: { title: 'Regar plantas' }
		});
	});

	it('changing the due date, removing it or adding it', () => {
		expect(edit(ONE_OFF, { shape: 'puntual', title: 'Pagar', dueDate: '2026-07-20' })).toStrictEqual({
			ok: true,
			change: { dueDate: new Date(2026, 6, 20) }
		});
		expect(edit(ONE_OFF, { shape: 'puntual', title: 'Pagar' })).toStrictEqual({ ok: true, change: { dueDate: null } });
		const withoutLimit: OneOffTask = { id: 't1', title: 'Pagar', kind: 'puntual', createdAt: CREATED };
		expect(edit(withoutLimit, { shape: 'puntual', title: 'Pagar' })).toStrictEqual({ ok: true, change: {} });
		expect(edit(withoutLimit, { shape: 'puntual', title: 'Pagar', dueDate: '2026-07-14' })).toStrictEqual({
			ok: true,
			change: { dueDate: new Date(2026, 6, 14) }
		});
	});

	it('the recurrence is changed whole, even if a single subfield changes', () => {
		expect(edit(RELATIVE, { shape: 'relativa', title: 'Regar', every: 2, unit: 'horas' })).toStrictEqual({
			ok: true,
			change: { recurrence: { mode: 'relativo', every: 2, unit: 'horas' } }
		});
		expect(edit(RELATIVE, { shape: 'relativa', title: 'Regar', every: 3, unit: 'dias' })).toStrictEqual({
			ok: true,
			change: { recurrence: { mode: 'relativo', every: 3, unit: 'dias' } }
		});
	});

	it('the days are compared as a set: the order in which they are chosen is not a change', () => {
		const data = { shape: 'calendario', title: 'Basura', weekdays: ['jueves', 'martes'], monthDays: [] } as const;

		expect(edit(WEEKLY, { ...data, weekdays: [...data.weekdays] })).toStrictEqual({ ok: true, change: {} });
		expect(edit(MONTHLY, { shape: 'calendario', title: 'Basura', weekdays: [], monthDays: [31, 10] })).toStrictEqual({
			ok: true,
			change: {}
		});
	});

	it('changing from weekly to monthly with the same numbers is not the same', () => {
		expect(edit(WEEKLY, { shape: 'calendario', title: 'Basura', weekdays: [], monthDays: [2, 4] })).toStrictEqual({
			ok: true,
			change: { recurrence: { mode: 'calendario', monthDays: [2, 4] } }
		});
		expect(edit(WEEKLY, { shape: 'calendario', title: 'Basura', weekdays: ['martes'], monthDays: [] })).toStrictEqual({
			ok: true,
			change: { recurrence: { mode: 'calendario', weekdays: ['martes'] } }
		});
	});

	it('turning into one-off removes the recurrence and writes the due date, even if it has none', () => {
		expect(edit(WEEKLY, { shape: 'puntual', title: 'Basura', dueDate: '2026-07-20' })).toStrictEqual({
			ok: true,
			change: { kind: 'puntual', dueDate: new Date(2026, 6, 20), recurrence: null }
		});
		expect(edit(WEEKLY, { shape: 'puntual', title: 'Basura' })).toStrictEqual({
			ok: true,
			change: { kind: 'puntual', dueDate: null, recurrence: null }
		});
	});

	it('turning into recurring removes the due date, whether it had one or not', () => {
		const relative = { mode: 'relativo', every: 2, unit: 'dias' } as const;

		expect(edit(ONE_OFF, { shape: 'relativa', title: 'Pagar', every: 2, unit: 'dias' })).toStrictEqual({
			ok: true,
			change: { kind: 'periodica', recurrence: relative, dueDate: null }
		});
		const withoutLimit: OneOffTask = { id: 't1', title: 'Pagar', kind: 'puntual', createdAt: CREATED };
		expect(edit(withoutLimit, { shape: 'relativa', title: 'Pagar', every: 2, unit: 'dias' })).toStrictEqual({
			ok: true,
			change: { kind: 'periodica', recurrence: relative, dueDate: null }
		});
	});

	it('with some invalid field the edit is rejected whole, with the same errors as when creating', () => {
		expect(edit(ONE_OFF, { shape: 'puntual', title: 'Pagar la luz', dueDate: '2026-04-31' })).toStrictEqual({
			ok: false,
			errors: { dueDate: 'invalida' }
		});
		expect(edit(RELATIVE, { shape: 'relativa', title: '   ', every: 0, unit: 'dias' })).toStrictEqual({
			ok: false,
			errors: { title: 'vacio', every: 'invalido' }
		});
		expect(edit(WEEKLY, { shape: 'calendario', title: 'Basura', weekdays: [], monthDays: [] })).toStrictEqual({
			ok: false,
			errors: { days: 'faltan' }
		});
	});
});

describe('edit a paused task (spec §5.8)', () => {
	const PAUSED: RecurringTask = { ...RELATIVE, paused: true };
	const NOW = new Date(2026, 6, 15, 10, 0, 0);

	it('turning it into one-off resumes it: removes paused and saves resumedAt = now', () => {
		const result = edit(PAUSED, { shape: 'puntual', title: 'Regar' }, NOW);

		expect(result).toStrictEqual({
			ok: true,
			change: { kind: 'puntual', dueDate: null, recurrence: null, paused: null, resumedAt: NOW }
		});
	});

	it('editing other fields, or the mode, leaves it paused', () => {
		expect(edit(PAUSED, { shape: 'calendario', title: 'Regar plantas', weekdays: ['jueves'], monthDays: [] }, NOW)).toStrictEqual({
			ok: true,
			change: { title: 'Regar plantas', recurrence: { mode: 'calendario', weekdays: ['jueves'] } }
		});
	});

	it('turning into one-off a task that is not paused does not resume it', () => {
		expect(edit(RELATIVE, { shape: 'puntual', title: 'Regar' }, NOW)).toStrictEqual({
			ok: true,
			change: { kind: 'puntual', dueDate: null, recurrence: null }
		});
	});
});

