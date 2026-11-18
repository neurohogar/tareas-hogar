import { describe, expect, it } from 'vitest';
import { postponeAction, postponementText } from './postponement-in-panel';
import type { Completion, Task } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const ONE_OFF: Task = { id: 'p', title: 'Pagar', kind: 'puntual', createdAt: CREATED };
const RELATIVE: Task = { id: 'r', title: 'Regar', kind: 'periodica', recurrence: { mode: 'relativo', every: 2, unit: 'dias' }, createdAt: CREATED };
const completion = (taskId: string, completedAt: Date): Completion => ({ id: `c-${taskId}`, taskId, completedAt });
const postponed = (task: Task, from: Date, to: Date): Task => ({ ...task, postponed: { from, to } });

describe('postponeAction (spec §6.2)', () => {
	const NOW = new Date(2026, 6, 15, 10, 0, 0);

	it('a pending one offers to postpone', () => {
		expect(postponeAction(ONE_OFF, [], NOW)).toBe('posponer');
	});

	it('an overdue one offers to postpone', () => {
		expect(postponeAction({ ...ONE_OFF, dueDate: new Date(2026, 6, 14) }, [], NOW)).toBe('posponer');
	});

	it('one waiting by its own rule offers nothing', () => {
		expect(postponeAction(RELATIVE, [completion('r', new Date(2026, 6, 15, 9, 0, 0))], NOW)).toBeUndefined();
	});

	it('a completed one-off offers nothing', () => {
		expect(postponeAction(ONE_OFF, [completion('p', new Date(2026, 6, 15, 9, 0, 0))], NOW)).toBeUndefined();
	});

	it('a paused one cannot be postponed (spec §5.9)', () => {
		expect(postponeAction({ ...RELATIVE, paused: true }, [], NOW)).toBeUndefined();
	});

	it('a postponed one offers Quitar posponer', () => {
		expect(postponeAction(postponed(ONE_OFF, NOW, new Date(2026, 6, 15, 11, 0, 0)), [], NOW)).toBe('quitar');
	});

	it('a postponed and later completed one still offers Quitar posponer', () => {
		const task = postponed(RELATIVE, new Date(2026, 6, 15, 9, 0, 0), new Date(2026, 6, 15, 12, 0, 0));

		expect(postponeAction(task, [completion('r', new Date(2026, 6, 15, 9, 30, 0))], NOW)).toBe('quitar');
	});

	it('a postponed and later paused one still offers Quitar posponer', () => {
		const task = postponed({ ...RELATIVE, paused: true }, new Date(2026, 6, 15, 9, 0, 0), new Date(2026, 6, 15, 12, 0, 0));

		expect(postponeAction(task, [], NOW)).toBe('quitar');
	});

	it('from to onward, it offers to postpone again', () => {
		expect(postponeAction(postponed(ONE_OFF, new Date(2026, 6, 15, 9, 0, 0), NOW), [], NOW)).toBe('posponer');
	});
});

describe('postponementText (spec §6.2)', () => {
	const FROM = new Date(2026, 6, 15, 10, 15, 30);

	it('if to is today, the time without seconds', () => {
		const task = postponed(ONE_OFF, FROM, new Date(2026, 6, 15, 11, 15, 30));

		expect(postponementText(task, new Date(2026, 6, 15, 10, 30, 0))).toBe('Pospuesta hasta 11:15');
	});

	it('if to is tomorrow, it says so', () => {
		const task = postponed(ONE_OFF, FROM, new Date(2026, 6, 16, 1, 5, 0));

		expect(postponementText(task, new Date(2026, 6, 15, 23, 59, 59))).toBe('Pospuesta hasta mañana 01:05');
	});

	it('past midnight, that same to is already today', () => {
		const task = postponed(ONE_OFF, FROM, new Date(2026, 6, 16, 1, 5, 0));

		expect(postponementText(task, new Date(2026, 6, 16, 0, 0, 0))).toBe('Pospuesta hasta 01:05');
	});

	it('to tomorrow crossing a month', () => {
		const task = postponed(ONE_OFF, FROM, new Date(2026, 7, 1, 7, 0, 0));

		expect(postponementText(task, new Date(2026, 6, 31, 20, 0, 0))).toBe('Pospuesta hasta mañana 07:00');
	});

	it('without an active postponement, there is no text', () => {
		const to = new Date(2026, 6, 15, 11, 0, 0);

		expect(postponementText(ONE_OFF, FROM)).toBeUndefined();
		expect(postponementText(postponed(ONE_OFF, FROM, to), to)).toBeUndefined();
	});
});
