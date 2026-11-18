import { describe, expect, it } from 'vitest';
import { recurringCalendarStatus } from './recurring-calendar-status';
import type { Completion, CalendarRecurrence } from './task';

const TUESDAY_AND_THURSDAY: CalendarRecurrence = { mode: 'calendario', weekdays: ['martes', 'jueves'] };
const THE_31ST: CalendarRecurrence = { mode: 'calendario', monthDays: [31] };
const moment = (month: number, day: number, hour = 0, minute = 0, secondOne = 0) =>
	new Date(2026, month - 1, day, hour, minute, secondOne);
const covers = (id: string, completedAt: Date, coveredOccurrence: Date): Completion => ({
	id,
	taskId: 't1',
	completedAt,
	coveredOccurrence
});

describe('recurringCalendarStatus, never completed (P = the day before createdAt)', () => {
	const createdOnMonday = moment(7, 13, 8);

	it('is waiting before the first occurrence, with progress since createdAt', () => {
		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdOnMonday, [], moment(7, 13, 16))).toEqual({
			kind: 'en espera',
			progress: 0.5
		});
	});

	it('is pending on the day of the first occurrence, from 00:00:00 to 23:59:59', () => {
		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdOnMonday, [], moment(7, 14))).toEqual({ kind: 'pendiente' });
		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdOnMonday, [], moment(7, 14, 23, 59, 59))).toEqual({
			kind: 'pendiente'
		});
	});

	it('created on an occurrence day, it is already pending that day', () => {
		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, moment(7, 14, 8), [], moment(7, 14, 8))).toEqual({
			kind: 'pendiente'
		});
	});

	it('is overdue only once after the day of the first occurrence has passed', () => {
		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdOnMonday, [], moment(7, 15))).toEqual({ kind: 'atrasada' });
		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdOnMonday, [], moment(8, 20, 10))).toEqual({
			kind: 'atrasada'
		});
	});
});

describe('recurringCalendarStatus, completed (P = the greatest covered occurrence)', () => {
	const createdAt = moment(1, 1);

	it('uses the covered occurrence, not the day of the completion', () => {
		// Completed on Monday covering Tuesday: Tuesday is no longer pending.
		const completions = [covers('c1', moment(7, 13, 12), moment(7, 14))];

		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdAt, completions, moment(7, 14, 18))).toEqual({
			kind: 'en espera',
			progress: 0.5
		});
	});

	it('takes the greatest covered occurrence even if it was registered earlier', () => {
		const completions = [covers('c1', moment(7, 16, 10), moment(7, 16)), covers('c2', moment(7, 14, 10), moment(7, 14))];

		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdAt, completions, moment(7, 17, 10)).kind).toBe('en espera');
	});

	it('measures the wait from the most recent completedAt, even if it was registered earlier', () => {
		const completions = [covers('c1', moment(7, 14, 12), moment(7, 14)), covers('c2', moment(7, 13, 12), moment(7, 14))];

		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdAt, completions, moment(7, 14, 21))).toEqual({
			kind: 'en espera',
			progress: 0.25
		});
	});

	it('pending on the day of N and overdue the next day, with the 31st on the last day of the month', () => {
		const completions = [covers('c1', moment(5, 31), moment(5, 31))];

		expect(recurringCalendarStatus(THE_31ST, createdAt, completions, moment(6, 29, 23, 59, 59)).kind).toBe('en espera');
		expect(recurringCalendarStatus(THE_31ST, createdAt, completions, moment(6, 30))).toEqual({ kind: 'pendiente' });
		expect(recurringCalendarStatus(THE_31ST, createdAt, completions, moment(7, 1))).toEqual({ kind: 'atrasada' });
	});

	it('ignores the completions without a covered occurrence for P, but not for the wait start', () => {
		const completions = [
			covers('c1', moment(7, 14, 0), moment(7, 14)),
			{ id: 'c2', taskId: 't1', completedAt: moment(7, 15, 0) }
		];

		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdAt, completions, moment(7, 15, 12))).toEqual({
			kind: 'en espera',
			progress: 0.5
		});
	});

	it('with P later than today, the task is waiting with progress between 0 and 1', () => {
		const completions = [covers('c1', moment(7, 20, 12), moment(7, 21))];

		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdAt, completions, moment(7, 18, 0))).toEqual({
			kind: 'en espera',
			progress: 0
		});
	});
});
