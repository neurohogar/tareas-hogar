import { describe, expect, it } from 'vitest';
import { noticeOnComplete, visibleNotice, completionToUndo, msUntilDue, noticeReturn, noticeText, noticeOnReschedule, rescheduleToUndo } from './notice';
import { complete } from './completions';
import type { Completion, Task } from './task';

const water: Task = { id: 'regar', title: 'Regar', kind: 'puntual', createdAt: new Date(2026, 0, 1) };
const completedAt = new Date(2026, 6, 15, 8, 0, 0);
const completion: Completion = { id: 'c1', taskId: 'regar', completedAt };
const notice = noticeOnComplete(water, completion);
const plusMs = (ms: number) => new Date(completedAt.getTime() + ms);

describe('noticeOnComplete', () => {
	it('names the task by its title on completing and offers to undo that completion', () => {
		expect(notice).toStrictEqual({ name: 'Regar', completion });
	});

	it('with an emoji it names the task «emoji title»', () => {
		expect(noticeOnComplete({ ...water, emoji: '🌱' }, completion).name).toBe('🌱 Regar');
	});
});

describe('noticeReturn (spec §5.4: the notice says when the task returns)', () => {
	const COMPLETED_AT = new Date(2026, 10, 13, 10, 0, 0);
	const relative = (every: number, unit: 'horas' | 'dias'): Task => ({
		id: 'r',
		title: 'Regar',
		kind: 'periodica',
		recurrence: { mode: 'relativo', every, unit },
		createdAt: new Date(2026, 10, 1)
	});
	/** Completes the task with the completions it already had and queries the notice return. */
	const returnNotice = (task: Task, before: Completion[] = [], now = COMPLETED_AT) =>
		noticeReturn(noticeOnComplete(task, complete(task, before, 'nuevo', COMPLETED_AT), before), now);

	it('a recurring task says when it returns, with the instant computed after the completion', () => {
		expect(returnNotice(relative(8, 'horas'))).toBe('Vuelve hoy 18:00 · en 8 horas');
		expect(returnNotice(relative(6, 'dias'))).toBe('Vuelve el jueves 19 10:00 · en 6 días');
		const oldOne: Completion = { id: 'v', taskId: 'r', completedAt: new Date(2026, 10, 12, 8, 0) };
		expect(returnNotice(relative(1, 'dias'), [oldOne])).toBe('Vuelve mañana 10:00 · en 24 horas');
	});

	it('the distance is counted from now, while the notice is visible', () => {
		expect(returnNotice(relative(8, 'horas'), [], new Date(2026, 10, 13, 10, 0, 4))).toBe('Vuelve hoy 18:00 · en 8 horas');
		expect(returnNotice(relative(1, 'horas'), [], new Date(2026, 10, 13, 10, 0, 4))).toBe('Vuelve hoy 11:00 · en 1 hora');
	});

	it('a calendar one returns on its next occurrence, at 00:00', () => {
		const thursday: Task = { id: 's', title: 'Regar', kind: 'periodica', recurrence: { mode: 'calendario', weekdays: ['jueves'] }, createdAt: new Date(2026, 10, 1) };
		expect(returnNotice(thursday)).toBe('Vuelve el jueves 19 · en 6 días');
	});

	it('a one-off does not return: the notice carries no return', () => {
		const pay: Task = { id: 'p', title: 'Pagar', kind: 'puntual', createdAt: new Date(2026, 10, 1), dueDate: new Date(2026, 10, 20) };
		expect(returnNotice(pay)).toBeUndefined();
		expect(noticeOnComplete(pay, complete(pay, [], 'nuevo', COMPLETED_AT))).not.toHaveProperty('returns');
	});
});

describe('visibleNotice', () => {
	it('is visible while completedAt <= now < completedAt + 5 s', () => {
		expect(visibleNotice(notice, completedAt)).toBe(notice);
		expect(visibleNotice(notice, plusMs(4_999))).toBe(notice);
	});

	it('after 5 seconds it is no longer visible', () => {
		expect(visibleNotice(notice, plusMs(5_000))).toBeUndefined();
		expect(visibleNotice(notice, plusMs(3_600_000))).toBeUndefined();
	});

	it('before completedAt it is not visible', () => {
		expect(visibleNotice(notice, plusMs(-1))).toBeUndefined();
	});

	it('without a notice there is nothing to see', () => {
		expect(visibleNotice(undefined, completedAt)).toBeUndefined();
	});
});

describe('msUntilDue', () => {
	it('is what is left until 5 seconds after completedAt', () => {
		expect(msUntilDue(notice, completedAt)).toBe(5_000);
		expect(msUntilDue(notice, plusMs(4_999))).toBe(1);
	});
});

describe('completionToUndo', () => {
	it('is the completion the notice names, while the notice is visible', () => {
		expect(completionToUndo(notice, completedAt)).toBe(completion);
		expect(completionToUndo(notice, plusMs(4_999))).toBe(completion);
	});

	it('with an expired notice there is nothing to undo', () => {
		expect(completionToUndo(notice, plusMs(5_000))).toBeUndefined();
	});

	it('without a notice there is nothing to undo', () => {
		expect(completionToUndo(undefined, completedAt)).toBeUndefined();
	});
});

describe('the rescheduling notice (spec §5.4, §5.11)', () => {
	const at = new Date(2026, 6, 16, 10, 0, 0);
	const later = (ms: number) => new Date(at.getTime() + ms);
	const regar: Task = { id: 'r', title: 'Regar', kind: 'periodica', recurrence: { mode: 'relativo', every: 2, unit: 'dias' }, createdAt: new Date(2026, 6, 1) };
	const barrer: Task = { ...regar, id: 'b', title: 'Barrer' };
	const undo = [
		{ taskId: 'b', change: { resumedAt: new Date(2026, 6, 5) } },
		{ taskId: 'r', change: { resumedAt: null } }
	];
	const rescheduled = noticeOnReschedule(at, undo);

	it('says «Tareas reprogramadas», with no count and no return line', () => {
		expect(noticeText(rescheduled)).toBe('Tareas reprogramadas');
		expect(noticeReturn(rescheduled, at)).toBeUndefined();
	});

	it('lasts 5 seconds from the moment of confirming', () => {
		expect(visibleNotice(rescheduled, at)).toBe(rescheduled);
		expect(visibleNotice(rescheduled, later(4_999))).toBe(rescheduled);
		expect(visibleNotice(rescheduled, later(5_000))).toBeUndefined();
		expect(visibleNotice(rescheduled, later(-1))).toBeUndefined();
		expect(msUntilDue(rescheduled, later(1_000))).toBe(4_000);
	});

	it('Deshacer writes back each previous resumedAt, only of the tasks that still exist', () => {
		expect(rescheduleToUndo(rescheduled, later(4_999), [regar, barrer])).toStrictEqual(undo);
		expect(rescheduleToUndo(rescheduled, at, [regar])).toStrictEqual([undo[1]]);
		expect(rescheduleToUndo(rescheduled, at, [])).toStrictEqual([]);
	});

	it('expired, there is nothing to undo', () => {
		expect(rescheduleToUndo(rescheduled, later(5_000), [regar, barrer])).toBeUndefined();
		expect(rescheduleToUndo(undefined, at, [regar])).toBeUndefined();
	});

	it('it does not undo a completion, and the completion notice does not undo a rescheduling', () => {
		expect(completionToUndo(rescheduled, at)).toBeUndefined();
		expect(rescheduleToUndo(notice, completedAt, [water])).toBeUndefined();
	});
});
