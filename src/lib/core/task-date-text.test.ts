import { describe, expect, it } from 'vitest';
import { taskStatus } from './task-status';
import type { Completion, Task } from './task';
import { dateText } from './task-date-text';

const NOW = new Date(2026, 10, 13, 10, 0);
const CREATED = new Date(2026, 10, 1, 9, 0);

const oneOff = (dueDate?: Date): Task => ({ id: 't', title: 'T', kind: 'puntual', createdAt: CREATED, ...(dueDate && { dueDate }) });
const everyTwoDays: Task = { id: 't', title: 'T', kind: 'periodica', recurrence: { mode: 'relativo', every: 2, unit: 'dias' }, createdAt: CREATED };
const completion = (completedAt: Date): Completion => ({ id: `c${completedAt.getTime()}`, taskId: 't', completedAt });

/** The text with the status the core gives at that moment. */
const text = (task: Task, completions: Completion[] = [], now = NOW) => dateText(task, completions, taskStatus(task, completions, now), now);

describe('dateText (spec §6.1)', () => {
	it('an overdue one says since when it was due: «Tocaba …»', () => {
		expect(text(oneOff(new Date(2026, 10, 10)))).toBe('Tocaba el martes 10 · hace 3 días');
		expect(text(everyTwoDays, [completion(new Date(2026, 10, 8, 9, 0))])).toBe('Tocaba el martes 10 09:00 · hace 3 días');
	});

	it('a waiting one says when it returns: «Vuelve …»', () => {
		expect(text(everyTwoDays, [completion(new Date(2026, 10, 13, 8, 0))])).toBe('Vuelve el domingo 15 08:00 · en 2 días');
		const postponed: Task = { ...oneOff(new Date(2026, 10, 10)), postponed: { from: NOW, to: new Date(2026, 10, 13, 13, 0) } };
		expect(text(postponed)).toBe('Vuelve hoy 13:00 · en 3 horas');
	});

	it('a pending one carries no date text', () => {
		expect(text(oneOff(new Date(2026, 10, 13)))).toBeUndefined();
		expect(text(oneOff())).toBeUndefined();
		expect(text(everyTwoDays, [completion(new Date(2026, 10, 11, 10, 0))])).toBeUndefined();
	});

	it('a completed one-off and a paused one carry no date text', () => {
		expect(text(oneOff(new Date(2026, 10, 10)), [completion(new Date(2026, 10, 12, 9, 0))])).toBeUndefined();
		expect(text({ ...everyTwoDays, paused: true }, [completion(new Date(2026, 10, 1, 9, 0))])).toBeUndefined();
	});
});
