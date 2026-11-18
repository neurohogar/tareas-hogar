import { describe, expect, it } from 'vitest';
import { taskStatus } from './task-status';
import type { Completion, Schedule, Task } from './task';
import { urgencyInstant } from './urgency';

const MORNING: Schedule = [{ from: '08:00', to: '11:00' }];
const at = (day: number, hour = 0, minute = 0, secondOne = 0) => new Date(2026, 6, day, hour, minute, secondOne);
const completion = (completedAt: Date, coveredOccurrence?: Date): Completion => ({
	id: `c-${completedAt.getTime()}`,
	taskId: 't',
	completedAt,
	...(coveredOccurrence && { coveredOccurrence })
});

const oneOff = (createdAt: Date, dueDate?: Date): Task => ({
	id: 't',
	title: 'Foco',
	kind: 'puntual',
	...(dueDate && { dueDate }),
	schedule: MORNING,
	createdAt
});
const relative = (every: number, unit: 'horas' | 'dias', createdAt = at(1)): Task => ({
	id: 't',
	title: 'Regar',
	kind: 'periodica',
	recurrence: { mode: 'relativo', every, unit },
	schedule: MORNING,
	createdAt
});
const tuesdayAndThursday = (createdAt = at(1)): Task => ({
	id: 't',
	title: 'Basura',
	kind: 'periodica',
	recurrence: { mode: 'calendario', weekdays: ['martes', 'jueves'] },
	schedule: MORNING,
	createdAt
});

describe('status of a one-off with a schedule (spec §5.5)', () => {
	it('before the first window it is waiting, with progress from createdAt to the from', () => {
		expect(taskStatus(oneOff(at(15, 6)), [], at(15, 7))).toEqual({ kind: 'en espera', progress: 0.5 });
	});

	it.each([at(15, 8), at(15, 10, 59, 59), at(17, 9)])('inside a window it is pending (%s)', (now) => {
		expect(taskStatus(oneOff(at(15, 6)), [], now)).toEqual({ kind: 'pendiente' });
	});

	it('after the close, outside the window, it is waiting with progress from the previous to', () => {
		expect(taskStatus(oneOff(at(15, 6)), [], at(15, 11))).toEqual({ kind: 'en espera', progress: 0 });
		expect(taskStatus(oneOff(at(15, 6)), [], at(15, 21, 30))).toEqual({ kind: 'en espera', progress: 0.5 });
		expect(taskStatus(oneOff(at(15, 6)), [], at(20, 2, 45))).toEqual({ kind: 'en espera', progress: 0.75 });
	});

	it('created after the window, it waits from createdAt to the from of the next day', () => {
		expect(taskStatus(oneOff(at(15, 12)), [], at(16, 2))).toEqual({ kind: 'en espera', progress: 0.7 });
	});

	it('with a due date, overdue from the to of the window of that day, also outside the windows', () => {
		const task = oneOff(at(15, 6), at(16));
		expect(taskStatus(task, [], at(16, 10, 59, 59))).toEqual({ kind: 'pendiente' });
		expect(taskStatus(task, [], at(16, 11))).toEqual({ kind: 'atrasada' });
		expect(taskStatus(task, [], at(17, 7))).toEqual({ kind: 'atrasada' });
	});

	it('with the lateness already reached on creating it, it is overdue even though the window did not open', () => {
		expect(taskStatus(oneOff(at(15, 12), at(15)), [], at(15, 12))).toEqual({ kind: 'atrasada' });
	});

	it('with a completion it is completed at any hour', () => {
		expect(taskStatus(oneOff(at(15, 6)), [completion(at(15, 9))], at(15, 20))).toEqual({ kind: 'completada' });
	});
});

describe('status of a relative task with a schedule (spec §5.5)', () => {
	it('before A it is waiting with progress (now − U) / (A − U)', () => {
		expect(taskStatus(relative(1, 'dias'), [completion(at(15, 9))], at(15, 15))).toEqual({ kind: 'en espera', progress: 0.25 });
		expect(taskStatus(relative(1, 'dias'), [completion(at(15, 12))], at(16, 10))).toEqual({ kind: 'en espera', progress: 0.5 });
	});

	it('with skewed clocks (now < U) the progress is 0', () => {
		expect(taskStatus(relative(1, 'dias'), [completion(at(15, 9))], at(15, 8))).toEqual({ kind: 'en espera', progress: 0 });
	});

	it('past V but outside the window it stays waiting; from A, pending', () => {
		const completions = [completion(at(15, 12))];
		expect(taskStatus(relative(1, 'dias'), completions, at(17, 7, 59, 59)).kind).toBe('en espera');
		expect(taskStatus(relative(1, 'dias'), completions, at(17, 8))).toEqual({ kind: 'pendiente' });
	});

	it('overdue from the first one between C and V + interval', () => {
		expect(taskStatus(relative(1, 'dias'), [completion(at(15, 9))], at(16, 10, 59, 59))).toEqual({ kind: 'pendiente' });
		expect(taskStatus(relative(1, 'dias'), [completion(at(15, 9))], at(16, 11))).toEqual({ kind: 'atrasada' });
		expect(taskStatus(relative(1, 'horas'), [completion(at(15, 8, 30))], at(15, 10, 29, 59))).toEqual({ kind: 'pendiente' });
		expect(taskStatus(relative(1, 'horas'), [completion(at(15, 8, 30))], at(15, 10, 30))).toEqual({ kind: 'atrasada' });
	});

	it('overdue even though the window did not open if V + interval has already passed', () => {
		expect(taskStatus(relative(4, 'horas'), [completion(at(15, 10))], at(15, 18))).toEqual({ kind: 'atrasada' });
	});

	it('never completed: waiting from createdAt to the from; overdue if the first window passes', () => {
		const task = relative(1, 'dias', at(15, 12));
		expect(taskStatus(task, [], at(15, 20))).toEqual({ kind: 'en espera', progress: 0.4 });
		expect(taskStatus(task, [], at(16, 8))).toEqual({ kind: 'pendiente' });
		expect(taskStatus(task, [], at(16, 11))).toEqual({ kind: 'atrasada' });
	});
});

describe('status of a calendar task with a schedule (spec §5.5)', () => {
	const completions = [completion(at(14, 8), at(14))];

	it('before the from of day N it is waiting, with progress up to the from', () => {
		expect(taskStatus(tuesdayAndThursday(), completions, at(16, 2))).toEqual({ kind: 'en espera', progress: 0.875 });
		expect(taskStatus(tuesdayAndThursday(), completions, at(16, 7, 59, 59)).kind).toBe('en espera');
	});

	it('day N inside the window is pending; from its to, overdue', () => {
		expect(taskStatus(tuesdayAndThursday(), completions, at(16, 10, 59, 59))).toEqual({ kind: 'pendiente' });
		expect(taskStatus(tuesdayAndThursday(), completions, at(16, 11))).toEqual({ kind: 'atrasada' });
	});

	it('created on an occurrence day after the window it is overdue on the spot', () => {
		expect(taskStatus(tuesdayAndThursday(at(16, 12)), [], at(16, 12))).toEqual({ kind: 'atrasada' });
	});
});

describe('urgency instant with a schedule (spec §5.5, §6.1)', () => {
	function instant(task: Task, completions: Completion[], now: Date) {
		const status = taskStatus(task, completions, now);
		if (status.kind === 'completada' || status.kind === 'pausada') throw new Error('A completed task is not ordered by urgency');
		return urgencyInstant(task, completions, status, now);
	}

	it('a recurring task overdue, from the lateness (C, or V + interval if earlier)', () => {
		expect(instant(relative(1, 'dias'), [completion(at(15, 9))], at(16, 12))).toEqual(at(16, 11));
		expect(instant(relative(1, 'horas'), [completion(at(16, 8, 30))], at(16, 12))).toEqual(at(16, 10, 30));
	});

	it('a recurring task pending or waiting, A', () => {
		expect(instant(relative(1, 'dias'), [completion(at(14, 12))], at(16, 9))).toEqual(at(16, 8));
		expect(instant(relative(1, 'dias'), [completion(at(15, 12))], at(16, 14))).toEqual(at(17, 8));
	});

	it('an overdue one-off, from the to of the window of the due date', () => {
		expect(instant(oneOff(at(1), at(15)), [], at(16, 12))).toEqual(at(15, 11));
	});

	it('a pending one-off keeps the key from §6.1: its due date, or none', () => {
		expect(instant(oneOff(at(1), at(16)), [], at(16, 9))).toEqual(at(16));
		expect(instant(oneOff(at(1)), [], at(16, 9))).toBeUndefined();
	});

	it('a waiting one-off, when it returns: the from of the next window', () => {
		expect(instant(oneOff(at(15, 12)), [], at(15, 14))).toEqual(at(16, 8));
		expect(instant(oneOff(at(1)), [], at(15, 14))).toEqual(at(16, 8));
	});
});

describe('status with several windows (spec §5.6, §5.7)', () => {
	const TWO: Schedule = [
		{ from: '07:00', to: '10:00' },
		{ from: '18:00', to: '21:00' }
	];
	const covers = (completedAt: Date, start: Date): Completion => ({ id: `c-${completedAt.getTime()}`, taskId: 't', completedAt, coveredOccurrence: { start } });
	const wednesday = (schedule = TWO): Task => ({
		id: 't',
		title: 'Perros',
		kind: 'periodica',
		recurrence: { mode: 'calendario', weekdays: ['miércoles', 'jueves'] },
		schedule,
		createdAt: at(1)
	});
	const every2Days = (createdAt = at(1)): Task => ({
		id: 't',
		title: 'Perros',
		kind: 'periodica',
		recurrence: { mode: 'relativo', every: 2, unit: 'dias' },
		schedule: TWO,
		createdAt
	});

	it('calendar with the morning covered: waiting until the afternoon, pending in it and overdue from its to', () => {
		const done = [covers(at(15, 8), at(15, 7))];
		expect(taskStatus(wednesday(), done, at(15, 13))).toEqual({ kind: 'en espera', progress: 0.5 });
		expect(taskStatus(wednesday(), done, at(15, 18))).toEqual({ kind: 'pendiente' });
		expect(taskStatus(wednesday(), done, at(15, 21))).toEqual({ kind: 'atrasada' });
	});

	it('calendar with the date alone covered: the whole day, waiting until the next morning', () => {
		expect(taskStatus(wednesday(), [completion(at(15, 8), at(15))], at(15, 19, 30))).toEqual({ kind: 'en espera', progress: 0.5 });
	});

	it('calendar: moving the only window later the same day reopens the done occurrence', () => {
		const done = [covers(at(15, 8, 30), at(15, 8))];
		expect(taskStatus(wednesday([{ from: '09:00', to: '12:00' }]), done, at(15, 9))).toEqual({ kind: 'pendiente' });
	});

	it('one-off: between windows waiting until the next one; overdue from the to of the last window of the due date', () => {
		const oneOffTwo: Task = { id: 't', title: 'Pan', kind: 'puntual', dueDate: at(15), schedule: TWO, createdAt: at(15, 6) };
		expect(taskStatus(oneOffTwo, [], at(15, 14))).toEqual({ kind: 'en espera', progress: 0.5 });
		expect(taskStatus(oneOffTwo, [], at(15, 18))).toEqual({ kind: 'pendiente' });
		expect(taskStatus(oneOffTwo, [], at(15, 21))).toEqual({ kind: 'atrasada' });
	});

	it('relative in days: the day round continues and then it waits every `every` days; the lateness is C', () => {
		expect(taskStatus(every2Days(), [covers(at(13, 8), at(13, 7))], at(13, 13))).toEqual({ kind: 'en espera', progress: 0.5 });
		expect(taskStatus(every2Days(), [covers(at(13, 8), at(13, 7))], at(13, 21))).toEqual({ kind: 'atrasada' });
		expect(taskStatus(every2Days(), [covers(at(13, 19), at(13, 18))], at(14, 13))).toEqual({ kind: 'en espera', progress: 0.5 });
		expect(taskStatus(every2Days(), [covers(at(13, 19), at(13, 18))], at(15, 7))).toEqual({ kind: 'pendiente' });
	});

	it('relative in days never completed: it waits from createdAt the first window that did not close', () => {
		expect(taskStatus(every2Days(at(13, 12)), [], at(13, 15))).toEqual({ kind: 'en espera', progress: 0.5 });
		expect(taskStatus(every2Days(at(13, 12)), [], at(14, 8))).toEqual({ kind: 'atrasada' });
	});

	it('the urgency instant is A of N (pending) or its C (overdue)', () => {
		const done = [covers(at(15, 8), at(15, 7))];
		expect(urgencyInstant(wednesday(), done, { kind: 'pendiente' }, at(15, 19))).toStrictEqual(at(15, 18));
		expect(urgencyInstant(wednesday(), done, { kind: 'atrasada' }, at(15, 22))).toStrictEqual(at(15, 21));
	});
});
