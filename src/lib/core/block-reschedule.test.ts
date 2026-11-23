import { describe, expect, it } from 'vitest';
import { confirmReschedule, rescheduleEnabled, tasksToReschedule } from './block-reschedule';
import { applyChange, taskFromDocument, type TaskDocument } from './task-document';
import { taskStatus } from './task-status';
import type { Completion, OneOffTask, RecurringTask, Task } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const NOW = new Date(2026, 6, 16, 10, 0, 0);
/** Every 2 days, completed on 2026-07-10 09:00: overdue at NOW («Tocaba hace 4 días», spec §5.11). */
const WATER: RecurringTask = { id: 'r', title: 'Regar', kind: 'periodica', recurrence: { mode: 'relativo', every: 2, unit: 'dias' }, createdAt: CREATED };
const WATERED: Completion = { id: 'c', taskId: 'r', completedAt: new Date(2026, 6, 10, 9, 0, 0) };
/** Every 3 days, completed on 2026-07-01 09:00: overdue at NOW, more urgent than Regar. */
const SWEEP: RecurringTask = { id: 'b', title: 'Barrer', kind: 'periodica', recurrence: { mode: 'relativo', every: 3, unit: 'dias' }, createdAt: CREATED };
/** On Tuesdays and Thursdays since 2026-07-01: overdue on Thursday 2026-07-16. */
const TRASH: RecurringTask = { id: 'k', title: 'Basura', kind: 'periodica', recurrence: { mode: 'calendario', weekdays: ['martes', 'jueves'] }, createdAt: CREATED };
const PAY: OneOffTask = { id: 'p', title: 'Pagar', kind: 'puntual', dueDate: new Date(2026, 6, 14), createdAt: CREATED };
const SWEPT: Completion = { id: 'd', taskId: 'b', completedAt: new Date(2026, 6, 1, 9, 0, 0) };
const COMPLETIONS = [WATERED, SWEPT];
const ids = (tasks: readonly Task[]) => tasks.map(({ id }) => id);

describe('tasksToReschedule (spec §5.11 Which tasks)', () => {
	it('every overdue recurring task in view, in the order of Pendientes', () => {
		expect(taskStatus(SWEEP, COMPLETIONS, NOW).kind).toBe('atrasada');
		expect(ids(tasksToReschedule([WATER, SWEEP], COMPLETIONS, NOW, false))).toEqual(['b', 'r']);
	});

	it('a calendar task overdue is rescheduled too', () => {
		expect(ids(tasksToReschedule([TRASH], [], NOW, false))).toEqual(['k']);
	});

	it('an overdue one-off is left out', () => {
		expect(taskStatus(PAY, [], NOW).kind).toBe('atrasada');
		expect(tasksToReschedule([PAY, WATER], COMPLETIONS, NOW, false)).toEqual([WATER]);
	});

	it('a paused, a postponed, a pending and a waiting recurring task are left out', () => {
		const paused = { ...WATER, paused: true };
		const postponed = { ...WATER, postponed: { from: new Date(2026, 6, 16, 9, 0, 0), to: new Date(2026, 6, 16, 12, 0, 0) } };
		const pending: Completion = { id: 'c', taskId: 'r', completedAt: new Date(2026, 6, 14, 9, 0, 0) };
		const waiting: Completion = { id: 'c', taskId: 'r', completedAt: new Date(2026, 6, 16, 9, 0, 0) };
		expect(tasksToReschedule([paused], COMPLETIONS, NOW, false)).toEqual([]);
		expect(tasksToReschedule([postponed], COMPLETIONS, NOW, false)).toEqual([]);
		expect(taskStatus(WATER, [pending], NOW).kind).toBe('pendiente');
		expect(tasksToReschedule([WATER], [pending], NOW, false)).toEqual([]);
		expect(taskStatus(WATER, [waiting], NOW).kind).toBe('en espera');
		expect(tasksToReschedule([WATER], [waiting], NOW, false)).toEqual([]);
	});

	it('with the minimal mode on, only the essential overdue ones (the ones in view)', () => {
		const essential = { ...SWEEP, essential: true };
		expect(tasksToReschedule([WATER, essential], COMPLETIONS, NOW, true)).toEqual([essential]);
		expect(tasksToReschedule([WATER], COMPLETIONS, NOW, true)).toEqual([]);
		expect(tasksToReschedule([WATER], COMPLETIONS, NOW, false)).toEqual([WATER]);
	});

	it('it follows the clock: a task overdue for less than a minute is already in', () => {
		const windowed: RecurringTask = { ...TRASH, schedule: [{ from: '08:00', to: '09:00' }], createdAt: new Date(2026, 6, 16, 7, 0, 0) };
		expect(tasksToReschedule([windowed], [], new Date(2026, 6, 16, 8, 59, 59), false)).toEqual([]);
		expect(tasksToReschedule([windowed], [], new Date(2026, 6, 16, 9, 0, 0), false)).toEqual([windowed]);
		expect(tasksToReschedule([windowed], [], new Date(2026, 6, 16, 9, 0, 30), false)).toEqual([windowed]);
	});
});

describe('rescheduleEnabled (spec §6.1 Reprogramar vencidas)', () => {
	it('enabled exactly when there is an overdue recurring task in view', () => {
		expect(rescheduleEnabled([WATER], COMPLETIONS, NOW, false)).toBe(true);
		expect(rescheduleEnabled([], [], NOW, false)).toBe(false);
		expect(rescheduleEnabled([PAY], [], NOW, false)).toBe(false);
		expect(rescheduleEnabled([WATER], COMPLETIONS, NOW, true)).toBe(false);
		expect(rescheduleEnabled([{ ...WATER, essential: true }], COMPLETIONS, NOW, true)).toBe(true);
	});
});

describe('confirmReschedule (spec §5.11 What it does, Only reanudadaEn; §7)', () => {
	it('a single batch: one change per task, in the order of Pendientes, that writes only resumedAt = now', () => {
		const { changes } = confirmReschedule([WATER, PAY, SWEEP], COMPLETIONS, NOW, false);
		expect(changes).toStrictEqual([
			{ taskId: 'b', change: { resumedAt: NOW } },
			{ taskId: 'r', change: { resumedAt: NOW } }
		]);
	});

	it('the example of §5.11: the relative task is pending at once, with reanudadaEn the moment of confirming', () => {
		const doc: TaskDocument = { ...WATER };
		const [{ taskId, change }] = confirmReschedule([WATER], COMPLETIONS, NOW, false).changes;
		const [after] = applyChange([doc], taskId, change);
		expect(after).toStrictEqual({ ...doc, resumedAt: NOW });
		expect(taskStatus(taskFromDocument(after), COMPLETIONS, NOW).kind).toBe('pendiente');
	});

	it('a calendar task is waiting if today is not one of its days, and pending if it is', () => {
		const thursdays: RecurringTask = { ...TRASH, recurrence: { mode: 'calendario', weekdays: ['martes'] } };
		const friday = new Date(2026, 6, 17, 10, 0, 0);
		const resumed = (task: RecurringTask, now: Date) => taskStatus({ ...task, ...confirmReschedule([task], [], now, false).changes[0].change } as Task, [], now).kind;
		expect(resumed(thursdays, friday)).toBe('en espera');
		expect(resumed(TRASH, NOW)).toBe('pendiente');
	});

	it('nothing to reschedule: an empty batch', () => {
		expect(confirmReschedule([PAY], [], NOW, false).changes).toEqual([]);
	});

	it('the notice starts at the moment of confirming', () => {
		expect(confirmReschedule([WATER], COMPLETIONS, NOW, false).notice.rescheduledAt).toBe(NOW);
	});
});

describe('the undo of the notice (spec §5.11 Undo)', () => {
	it('per task, the resumedAt the rescheduling replaced, or null to remove it', () => {
		const earlier = new Date(2026, 6, 1, 8, 30, 0);
		const { notice } = confirmReschedule([WATER, { ...SWEEP, resumedAt: earlier }], COMPLETIONS, NOW, false);
		expect(notice.undo).toStrictEqual([
			{ taskId: 'b', change: { resumedAt: earlier } },
			{ taskId: 'r', change: { resumedAt: null } }
		]);
	});

	it('applying it leaves the document as it was before', () => {
		const doc: TaskDocument = { ...WATER };
		const { changes, notice } = confirmReschedule([WATER], COMPLETIONS, NOW, false);
		const rescheduled = applyChange([doc], changes[0].taskId, changes[0].change);
		expect(applyChange(rescheduled, notice.undo[0].taskId, notice.undo[0].change)).toStrictEqual([doc]);
	});
});
