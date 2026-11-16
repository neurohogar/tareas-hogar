import { describe, expect, it } from 'vitest';
import { taskStatus } from './task-status';
import type { Completion, Task } from './task';
import { dateText } from './task-date-text';

const NOW = new Date(2026, 10, 13, 10, 0);
const CREATED = new Date(2026, 10, 1, 9, 0);

const oneOff = (dueDate?: Date): Task => ({ id: 't', title: 'T', kind: 'puntual', createdAt: CREATED, ...(dueDate && { dueDate }) });
const everyTwoDays: Task = { id: 't', title: 'T', kind: 'periodica', recurrence: { mode: 'relativo', every: 2, unit: 'dias' }, createdAt: CREATED };
const completion = (completedAt: Date): Completion => ({ id: `c${completedAt.getTime()}`, taskId: 't', completedAt });

/** El texto con el estado que da el core en ese momento. */
const text = (task: Task, completions: Completion[] = [], now = NOW) => dateText(task, completions, taskStatus(task, completions, now), now);

describe('textoDeFecha (spec §6.1)', () => {
	it('una atrasada dice desde cuándo toca: «Tocaba …»', () => {
		expect(text(oneOff(new Date(2026, 10, 10)))).toBe('Tocaba el martes 10 · hace 3 días');
		expect(text(everyTwoDays, [completion(new Date(2026, 10, 8, 9, 0))])).toBe('Tocaba el martes 10 09:00 · hace 3 días');
	});

	it('una en espera dice cuándo vuelve: «Vuelve …»', () => {
		expect(text(everyTwoDays, [completion(new Date(2026, 10, 13, 8, 0))])).toBe('Vuelve el domingo 15 08:00 · en 2 días');
		const postponed: Task = { ...oneOff(new Date(2026, 10, 10)), postponed: { from: NOW, to: new Date(2026, 10, 13, 13, 0) } };
		expect(text(postponed)).toBe('Vuelve hoy 13:00 · en 3 horas');
	});

	it('una pendiente no lleva texto de fecha', () => {
		expect(text(oneOff(new Date(2026, 10, 13)))).toBeUndefined();
		expect(text(oneOff())).toBeUndefined();
		expect(text(everyTwoDays, [completion(new Date(2026, 10, 11, 10, 0))])).toBeUndefined();
	});

	it('una puntual completada y una pausada no llevan texto de fecha', () => {
		expect(text(oneOff(new Date(2026, 10, 10)), [completion(new Date(2026, 10, 12, 9, 0))])).toBeUndefined();
		expect(text({ ...everyTwoDays, paused: true }, [completion(new Date(2026, 10, 1, 9, 0))])).toBeUndefined();
	});
});
