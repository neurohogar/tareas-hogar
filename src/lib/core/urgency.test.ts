import { describe, expect, it } from 'vitest';
import type { PendingStatus } from './status';
import type { Completion, Task } from './task';
import { urgencyInstant } from './urgency';

const CREATED = new Date(2026, 6, 1, 9, 30, 0);
const PENDING: PendingStatus = { kind: 'pendiente' };
const OVERDUE: PendingStatus = { kind: 'atrasada' };
const WAITING: PendingStatus = { kind: 'en espera', progress: 0.5 };
/** Without a schedule, the instant does not depend on now. */
const NO_SCHEDULE_NOW_DOES_NOT_MATTER = new Date(2026, 6, 15, 12, 0, 0);

const oneOff = (dueDate?: Date): Task => ({ id: 'p', title: 'P', kind: 'puntual', createdAt: CREATED, ...(dueDate && { dueDate }) });
const relative: Task = { id: 'r', title: 'R', kind: 'periodica', recurrence: { mode: 'relativo', every: 6, unit: 'horas' }, createdAt: CREATED };
const weekly: Task = { id: 's', title: 'S', kind: 'periodica', recurrence: { mode: 'calendario', weekdays: ['martes', 'jueves'] }, createdAt: CREATED };
const completion = (taskId: string, completedAt: Date, coveredOccurrence?: Date): Completion => ({
	id: `c-${taskId}-${completedAt.getTime()}`,
	taskId,
	completedAt,
	...(coveredOccurrence && { coveredOccurrence })
});

describe('urgencyInstant (spec §6.1)', () => {
	describe('one-off', () => {
		it('pending: 00:00 of the due date', () => {
			expect(urgencyInstant(oneOff(new Date(2026, 6, 15)), [], PENDING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 6, 15));
		});

		it('overdue: 00:00 of the day after the due date', () => {
			expect(urgencyInstant(oneOff(new Date(2026, 6, 31)), [], OVERDUE, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 7, 1));
		});

		it('without a due date it has no instant', () => {
			expect(urgencyInstant(oneOff(), [], PENDING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toBeUndefined();
		});
	});

	describe('relative', () => {
		const completions = [
			completion('r', new Date(2026, 6, 14, 8, 0, 0)),
			completion('r', new Date(2026, 6, 15, 7, 0, 0)),
			completion('otra', new Date(2026, 6, 15, 11, 0, 0))
		];

		it('never completed: createdAt', () => {
			expect(urgencyInstant(relative, [completion('otra', new Date(2026, 6, 15))], PENDING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(CREATED);
		});

		it('pending and waiting: V, from the most recent completion of the task', () => {
			expect(urgencyInstant(relative, completions, PENDING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 6, 15, 13, 0, 0));
			expect(urgencyInstant(relative, completions, WAITING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 6, 15, 13, 0, 0));
		});

		it('overdue: V + interval', () => {
			expect(urgencyInstant(relative, completions, OVERDUE, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 6, 15, 19, 0, 0));
		});

		it('in days it counts 24 hours per day', () => {
			const ofDays: Task = { ...relative, recurrence: { mode: 'relativo', every: 2, unit: 'dias' } };
			expect(urgencyInstant(ofDays, completions, OVERDUE, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 6, 19, 7, 0, 0));
		});
	});

	describe('calendar', () => {
		// P = Tuesday 14, N = Thursday 16.
		const completions = [completion('s', new Date(2026, 6, 14, 9, 0, 0), new Date(2026, 6, 14)), completion('otra', new Date(2026, 6, 15), new Date(2026, 6, 21))];

		it('pending and waiting: 00:00 of N', () => {
			expect(urgencyInstant(weekly, completions, PENDING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 6, 16));
			expect(urgencyInstant(weekly, completions, WAITING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 6, 16));
		});

		it('overdue: 00:00 of the day after N', () => {
			expect(urgencyInstant(weekly, completions, OVERDUE, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 6, 17));
		});

		it('without completions, N is the first occurrence since createdAt', () => {
			// Created on Wednesday 1: N = Thursday 2.
			expect(urgencyInstant(weekly, [], PENDING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 6, 2));
		});
	});
});

describe('urgencyInstant of a resumed task (spec §5.8, §6.1)', () => {
	const RESUMED = new Date(2026, 6, 15, 10, 0, 0);

	it('calendar waiting: the next occurrence since resumedAt, without counting what was covered before', () => {
		const coveredOnThursday = completion('s', new Date(2026, 6, 14, 9, 0, 0), new Date(2026, 6, 16));

		expect(urgencyInstant({ ...weekly, resumedAt: RESUMED }, [coveredOnThursday], WAITING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(
			new Date(2026, 6, 16)
		);
	});

	it('relative never completed since the resumption: pending since resumedAt', () => {
		const ofBefore = completion('r', new Date(2026, 6, 14, 9, 0, 0));

		expect(urgencyInstant({ ...relative, resumedAt: RESUMED }, [ofBefore], PENDING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(RESUMED);
	});
});

describe('urgencyInstant of a postponed task (spec §5.9)', () => {
	it('waiting because of the postponement, it returns at to', () => {
		const to = new Date(2026, 6, 15, 13, 0, 0);
		const task = { ...oneOff(new Date(2026, 6, 20)), postponed: { from: new Date(2026, 6, 15, 10, 0, 0), to } };

		expect(urgencyInstant(task, [], WAITING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toBe(to);
	});

	it('on expiring, it goes back to its usual key', () => {
		const limit = new Date(2026, 6, 20);
		const postponed = { from: new Date(2026, 6, 15, 9, 0, 0), to: new Date(2026, 6, 15, 11, 0, 0) };

		expect(urgencyInstant({ ...oneOff(limit), postponed }, [], PENDING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toBe(limit);
	});
});
