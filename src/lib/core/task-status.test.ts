import { describe, expect, it } from 'vitest';
import { waitForPostponement, taskStatus } from './task-status';
import type { Completion, RecurringTask, OneOffTask } from './task';

const TASK: RecurringTask = {
	id: 'tarea-1',
	title: 'Ventilar',
	kind: 'periodica',
	recurrence: { mode: 'relativo', every: 4, unit: 'horas' },
	createdAt: new Date(2026, 6, 1, 8, 0, 0)
};
const U = new Date(2026, 6, 15, 8, 0, 0);
const TWO_HOURS_LATER = new Date(2026, 6, 15, 10, 0, 0);

const completion = (id: string, taskId: string, completedAt: Date): Completion => ({ id, taskId, completedAt });

describe('taskStatus', () => {
	it('applies the rule of the relative recurring task to the completions of the task', () => {
		expect(taskStatus(TASK, [completion('c1', 'tarea-1', U)], TWO_HOURS_LATER)).toEqual({
			kind: 'en espera',
			progress: 0.5
		});
	});

	it('ignores the completions of other tasks', () => {
		const ofOther = completion('c2', 'tarea-2', TWO_HOURS_LATER);

		expect(taskStatus(TASK, [ofOther], TWO_HOURS_LATER)).toEqual({ kind: 'pendiente' });
	});

	it('applies the calendar rule to a weekly one, with P since createdAt if it was never completed', () => {
		const weekly: RecurringTask = {
			...TASK,
			recurrence: { mode: 'calendario', weekdays: ['martes'] },
			createdAt: new Date(2026, 6, 13, 8, 0, 0)
		};

		expect(taskStatus(weekly, [], new Date(2026, 6, 13, 16, 0, 0))).toEqual({ kind: 'en espera', progress: 0.5 });
		expect(taskStatus(weekly, [], new Date(2026, 6, 14, 9, 0, 0))).toEqual({ kind: 'pendiente' });
	});

	it('in calendar mode it only counts what the completions of the task cover', () => {
		const monthly: RecurringTask = {
			...TASK,
			recurrence: { mode: 'calendario', monthDays: [15] },
			createdAt: new Date(2026, 6, 1, 8, 0, 0)
		};
		const ofOther: Completion = { ...completion('c3', 'tarea-2', U), coveredOccurrence: new Date(2026, 6, 15) };

		expect(taskStatus(monthly, [ofOther], new Date(2026, 6, 16, 0, 0, 0))).toEqual({ kind: 'atrasada' });
	});

	it('applies the one-off rule with its due date and only the completions of the task', () => {
		const oneOff: OneOffTask = {
			id: 'tarea-3',
			title: 'Pagar la luz',
			kind: 'puntual',
			dueDate: new Date(2026, 6, 15),
			createdAt: new Date(2026, 6, 1, 8, 0, 0)
		};
		const afterLimit = new Date(2026, 6, 16, 0, 0, 0);

		expect(taskStatus(oneOff, [completion('c4', 'tarea-2', U)], afterLimit)).toEqual({ kind: 'atrasada' });
		expect(taskStatus(oneOff, [completion('c5', 'tarea-3', U)], afterLimit)).toEqual({ kind: 'completada' });
	});
});

describe('taskStatus of a paused or resumed task (spec §5.8)', () => {
	const RESUMED = new Date(2026, 6, 15, 10, 0, 0);
	const relative: RecurringTask = { ...TASK, recurrence: { mode: 'relativo', every: 2, unit: 'dias' } };
	const weekly = (weekdays: RecurringTask['recurrence'] & { mode: 'calendario' }): RecurringTask => ({ ...TASK, recurrence: weekdays });
	const WEDNESDAY = weekly({ mode: 'calendario', weekdays: ['miércoles'] });
	const THURSDAY = weekly({ mode: 'calendario', weekdays: ['jueves'] });

	it('a paused one has no status, even though it would be overdue', () => {
		const oldOne = completion('c1', 'tarea-1', new Date(2026, 6, 1, 9, 0, 0));

		expect(taskStatus({ ...relative, paused: true }, [oldOne], RESUMED)).toEqual({ kind: 'pausada' });
		expect(taskStatus({ ...WEDNESDAY, paused: true }, [], new Date(2026, 7, 20))).toEqual({ kind: 'pausada' });
	});

	it('a resumed relative one stays pending: the completion from before resuming does not count', () => {
		const ofYesterday = completion('c1', 'tarea-1', new Date(2026, 6, 14, 9, 0, 0));

		expect(taskStatus({ ...relative, resumedAt: RESUMED }, [ofYesterday], RESUMED)).toEqual({ kind: 'pendiente' });
		expect(taskStatus({ ...relative, resumedAt: RESUMED }, [ofYesterday], new Date(2026, 6, 25))).toEqual({ kind: 'pendiente' });
	});

	it('a completion at the instant of the resumption counts', () => {
		const atTheInstant = completion('c1', 'tarea-1', RESUMED);

		expect(taskStatus({ ...relative, resumedAt: RESUMED }, [atTheInstant], RESUMED)).toEqual({ kind: 'en espera', progress: 0 });
	});

	it('a calendar one resumed on an occurrence day stays pending, even though the past occurrence is uncovered', () => {
		expect(taskStatus({ ...WEDNESDAY, resumedAt: RESUMED }, [], RESUMED)).toEqual({ kind: 'pendiente' });
	});

	it('a calendar one resumed on a day without an occurrence stays waiting, with progress since resumedAt', () => {
		// Thursday 16th at 00:00: 14 h after resuming, out of 14 h of waiting.
		expect(taskStatus({ ...THURSDAY, resumedAt: RESUMED }, [], new Date(2026, 6, 15, 17, 0, 0))).toEqual({
			kind: 'en espera',
			progress: 0.5
		});
	});

	it('with a schedule, a window that closed before resuming does not count as missed', () => {
		const withSchedule: RecurringTask = { ...WEDNESDAY, schedule: [{ from: '08:00', to: '10:00' }], resumedAt: RESUMED };
		const later = new Date(2026, 6, 15, 12, 0, 0);

		expect(taskStatus(withSchedule, [], later).kind).toBe('en espera');
		expect(taskStatus({ ...withSchedule, resumedAt: new Date(2026, 6, 15, 9, 0, 0) }, [], later)).toEqual({ kind: 'atrasada' });
	});

	it('with a schedule, the one resumed in the window stays pending and becomes overdue on closing', () => {
		const withSchedule: RecurringTask = { ...WEDNESDAY, schedule: [{ from: '08:00', to: '12:00' }], resumedAt: RESUMED };

		expect(taskStatus(withSchedule, [], new Date(2026, 6, 15, 11, 0, 0))).toEqual({ kind: 'pendiente' });
		expect(taskStatus(withSchedule, [], new Date(2026, 6, 15, 12, 0, 0))).toEqual({ kind: 'atrasada' });
	});

	it('with several schedules, waiting until the next window that closes after resuming', () => {
		const withSchedule: RecurringTask = {
			...WEDNESDAY,
			schedule: [
				{ from: '07:00', to: '09:00' },
				{ from: '18:00', to: '20:00' }
			],
			resumedAt: RESUMED
		};

		expect(taskStatus(withSchedule, [], new Date(2026, 6, 15, 14, 0, 0))).toEqual({ kind: 'en espera', progress: 0.5 });
	});
});

describe('taskStatus of a postponed task (spec §5.9)', () => {
	const FROM = new Date(2026, 6, 15, 10, 0, 0);
	const TO = new Date(2026, 6, 15, 13, 0, 0);
	const postponed = { from: FROM, to: TO };
	const HALFWAY = new Date(2026, 6, 15, 11, 30, 0);
	const ONE_OFF: OneOffTask = { id: 'p', title: 'Pagar', kind: 'puntual', createdAt: new Date(2026, 6, 1), postponed };

	it('a pending one-off is waiting until the edge of to, and then it returns', () => {
		expect(taskStatus(ONE_OFF, [], HALFWAY)).toStrictEqual({ kind: 'en espera', progress: 0.5 });
		expect(taskStatus(ONE_OFF, [], TO)).toStrictEqual({ kind: 'pendiente' });
	});

	it('the postponement does not move the due date: on expiring, it is overdue on the spot', () => {
		const task = { ...ONE_OFF, dueDate: new Date(2026, 6, 14) };

		expect(taskStatus(task, [], HALFWAY)).toStrictEqual({ kind: 'en espera', progress: 0.5 });
		expect(taskStatus(task, [], TO)).toStrictEqual({ kind: 'atrasada' });
	});

	it('waiting by its own rule, its progress counts', () => {
		const task = { ...TASK, postponed };
		const now = new Date(2026, 6, 15, 12, 0, 0);

		expect(taskStatus(task, [completion('c', 'tarea-1', new Date(2026, 6, 15, 11, 0, 0))], now)).toStrictEqual({ kind: 'en espera', progress: 0.25 });
	});

	it('a completed one-off stays completed', () => {
		expect(taskStatus(ONE_OFF, [completion('c', 'p', HALFWAY)], HALFWAY)).toStrictEqual({ kind: 'completada' });
	});

	it('waitForPostponement distinguishes the wait for the postponement from that of its own rule', () => {
		const relative = { ...TASK, postponed };
		const ofPostpone = completion('c', 'tarea-1', new Date(2026, 6, 15, 6, 0, 0));
		const ofItsRule = completion('c', 'tarea-1', new Date(2026, 6, 15, 11, 0, 0));

		expect(waitForPostponement(relative, [ofPostpone], HALFWAY)).toBe(postponed);
		expect(waitForPostponement(relative, [ofItsRule], HALFWAY)).toBeUndefined();
		expect(waitForPostponement(relative, [ofPostpone], TO)).toBeUndefined();
		expect(waitForPostponement(TASK, [], HALFWAY)).toBeUndefined();
	});

	it('a paused one has no status even though it is postponed', () => {
		expect(taskStatus({ ...TASK, postponed, paused: true }, [], HALFWAY)).toStrictEqual({ kind: 'pausada' });
	});

	it('a resumed one before to stays postponed', () => {
		const task = { ...TASK, postponed, resumedAt: new Date(2026, 6, 15, 11, 0, 0) };

		expect(taskStatus(task, [], HALFWAY)).toStrictEqual({ kind: 'en espera', progress: 0.5 });
	});
});
