// Spec §4.1, §6.2 and §7: the schedule on creating, on editing and in the stored document.
import { describe, expect, it } from 'vitest';
import { createFromData, taskData } from './task-data';
import { applyChange, taskFromDocument, type TaskDocument } from './task-document';
import { edit } from './editing';
import type { OneOffTask } from './task';

const NOW = new Date(2026, 6, 15, 8, 0, 0);
const MORNING = [{ from: '08:00', to: '11:00' }];

describe('creating with a schedule (spec §4.1)', () => {
	it.each([
		{ shape: 'puntual' as const, title: 'Regar' },
		{ shape: 'relativa' as const, title: 'Regar', every: 2, unit: 'dias' as const },
		{ shape: 'calendario' as const, title: 'Basura', weekdays: ['martes' as const], monthDays: [] }
	])('any kind of task stores the schedule as is ($shape)', (data) => {
		const result = createFromData({ ...data, schedule: MORNING }, 't1', NOW);
		expect(result.ok && result.task.schedule).toStrictEqual(MORNING);
	});

	it('without a schedule, the task does not have the field', () => {
		const result = createFromData({ shape: 'puntual', title: 'Regar' }, 't1', NOW);
		expect(result.ok && result.task).not.toHaveProperty('schedule');
	});

	it('with from ≥ to it is rejected whole, together with the other errors', () => {
		expect(createFromData({ shape: 'puntual', title: ' ', schedule: [{ from: '11:00', to: '08:00' }] }, 't1', NOW)).toStrictEqual({
			ok: false,
			errors: { title: 'vacio', schedule: 'finNoPosterior' }
		});
	});

	it('with only one of the two times it is rejected for an incomplete schedule', () => {
		expect(createFromData({ shape: 'relativa', title: 'Regar', every: 1, unit: 'dias', schedule: [{ from: '08:00' }] }, 't1', NOW)).toStrictEqual({
			ok: false,
			errors: { schedule: 'incompleto' }
		});
	});
});

const WITH_SCHEDULE: OneOffTask = { id: 't1', title: 'Regar', kind: 'puntual', schedule: MORNING, createdAt: NOW };

describe('editing the schedule (spec §6.2, §7)', () => {
	it('the panel loads the schedule of the task', () => {
		expect(taskData(WITH_SCHEDULE)).toStrictEqual({ shape: 'puntual', title: 'Regar', schedule: MORNING });
	});

	it('changing it writes the whole schedule, as a single field', () => {
		const result = edit(WITH_SCHEDULE, { ...taskData(WITH_SCHEDULE), schedule: [{ from: '07:00', to: '11:00' }] });
		expect(result).toStrictEqual({ ok: true, change: { schedule: [{ from: '07:00', to: '11:00' }] } });
	});

	it('removing it writes it as null', () => {
		const { schedule: _, ...withoutSchedule } = taskData(WITH_SCHEDULE);
		expect(edit(WITH_SCHEDULE, withoutSchedule)).toStrictEqual({ ok: true, change: { schedule: null } });
	});

	it('without changes to the schedule it does not write it, not even when changing the kind', () => {
		expect(edit(WITH_SCHEDULE, taskData(WITH_SCHEDULE))).toStrictEqual({ ok: true, change: {} });
		const result = edit(WITH_SCHEDULE, { shape: 'relativa', title: 'Regar', every: 2, unit: 'dias', schedule: MORNING });
		expect(result.ok && result.change).not.toHaveProperty('schedule');
	});

	it('an edit with an invalid schedule is rejected whole', () => {
		expect(edit(WITH_SCHEDULE, { shape: 'puntual', title: 'Barrer', schedule: [{ from: '10:00', to: '10:00' }] })).toStrictEqual({
			ok: false,
			errors: { schedule: 'finNoPosterior' }
		});
	});
});

describe('the schedule in the document (spec §7)', () => {
	const DOC: TaskDocument = { id: 't1', title: 'Regar', kind: 'puntual', createdAt: NOW };

	it('the task of the document keeps its schedule', () => {
		expect(taskFromDocument({ ...DOC, schedule: MORNING })).toStrictEqual({ ...DOC, schedule: MORNING });
		expect(taskFromDocument({ ...DOC, recurrence: { mode: 'relativo', every: 1, unit: 'dias' }, kind: 'periodica', schedule: MORNING }).schedule).toStrictEqual(MORNING);
	});

	it('a schedule change replaces the whole field, and null removes it', () => {
		const [changed] = applyChange([{ ...DOC, schedule: MORNING }], 't1', { schedule: [{ from: '07:00', to: '12:00' }] });
		expect(changed.schedule).toStrictEqual([{ from: '07:00', to: '12:00' }]);
		const [removed] = applyChange([changed], 't1', { schedule: null });
		expect(removed).not.toHaveProperty('schedule');
	});
});

const MORNING_AND_AFTERNOON = [
	{ from: '07:00', to: '10:00' },
	{ from: '18:00', to: '21:00' }
];

describe('several schedules (spec §4.1, §6.2, §7)', () => {
	it.each([
		{ shape: 'puntual' as const, title: 'Perros' },
		{ shape: 'relativa' as const, title: 'Perros', every: 1, unit: 'dias' as const },
		{ shape: 'calendario' as const, title: 'Perros', weekdays: ['miércoles' as const], monthDays: [] }
	])('any kind of task stores several windows, ordered by from ($shape)', (data) => {
		const result = createFromData({ ...data, schedule: [MORNING_AND_AFTERNOON[1], MORNING_AND_AFTERNOON[0]] }, 't1', NOW);
		expect(result.ok && result.task.schedule).toStrictEqual(MORNING_AND_AFTERNOON);
	});

	it('a relative task in hours with more than one window is rejected whole', () => {
		expect(createFromData({ shape: 'relativa', title: ' ', every: 8, unit: 'horas', schedule: MORNING_AND_AFTERNOON }, 't1', NOW)).toStrictEqual({
			ok: false,
			errors: { title: 'vacio', schedule: 'variasEnHoras' }
		});
	});

	it('a relative task in hours with a single window is valid', () => {
		const result = createFromData({ shape: 'relativa', title: 'Remedio', every: 8, unit: 'horas', schedule: [MORNING_AND_AFTERNOON[0]] }, 't1', NOW);
		expect(result.ok).toBe(true);
	});

	it('an error of the schedule itself takes priority over that of the relative task in hours', () => {
		const overlapping = [MORNING_AND_AFTERNOON[0], { from: '09:00', to: '12:00' }];
		expect(createFromData({ shape: 'relativa', title: 'Remedio', every: 8, unit: 'horas', schedule: overlapping }, 't1', NOW)).toStrictEqual({
			ok: false,
			errors: { schedule: 'superpuestos' }
		});
	});

	it('turning a task with two windows into a relative one in hours is rejected', () => {
		const task: OneOffTask = { ...WITH_SCHEDULE, schedule: MORNING_AND_AFTERNOON };
		expect(edit(task, { shape: 'relativa', title: 'Regar', every: 8, unit: 'horas', schedule: MORNING_AND_AFTERNOON })).toStrictEqual({
			ok: false,
			errors: { schedule: 'variasEnHoras' }
		});
	});

	it('adding a window writes the whole list; leaving it the same writes nothing', () => {
		expect(edit(WITH_SCHEDULE, { ...taskData(WITH_SCHEDULE), schedule: [...MORNING, MORNING_AND_AFTERNOON[1]] })).toStrictEqual({
			ok: true,
			change: { schedule: [...MORNING, MORNING_AND_AFTERNOON[1]] }
		});
		const task: OneOffTask = { ...WITH_SCHEDULE, schedule: MORNING_AND_AFTERNOON };
		expect(edit(task, taskData(task))).toStrictEqual({ ok: true, change: {} });
		expect(edit(task, { ...taskData(task), schedule: [MORNING_AND_AFTERNOON[1]] })).toStrictEqual({ ok: true, change: { schedule: [MORNING_AND_AFTERNOON[1]] } });
	});

	it('the panel loads a copy of the windows', () => {
		const task: OneOffTask = { ...WITH_SCHEDULE, schedule: MORNING_AND_AFTERNOON };
		const data = taskData(task);
		expect(data.schedule).toStrictEqual(MORNING_AND_AFTERNOON);
		expect(data.schedule?.[0]).not.toBe(MORNING_AND_AFTERNOON[0]);
	});

	it('a document stored with a single window (previous format) is read as a list of one', () => {
		const doc: TaskDocument = { id: 't1', title: 'Regar', kind: 'puntual', createdAt: NOW, schedule: { from: '08:00', to: '11:00' } };
		expect(taskFromDocument(doc).schedule).toStrictEqual(MORNING);
	});
});
