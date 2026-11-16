import { describe, expect, it } from 'vitest';
import type { PendingStatus } from './status';
import type { Completion, Task } from './task';
import { urgencyInstant } from './urgency';

const CREATED = new Date(2026, 6, 1, 9, 30, 0);
const PENDING: PendingStatus = { kind: 'pendiente' };
const OVERDUE: PendingStatus = { kind: 'atrasada' };
const WAITING: PendingStatus = { kind: 'en espera', progress: 0.5 };
/** Sin horario, el instante no depende de ahora. */
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

describe('instanteDeUrgencia (spec §6.1)', () => {
	describe('puntual', () => {
		it('pendiente: las 00:00 de la fecha límite', () => {
			expect(urgencyInstant(oneOff(new Date(2026, 6, 15)), [], PENDING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 6, 15));
		});

		it('atrasada: las 00:00 del día siguiente a la fecha límite', () => {
			expect(urgencyInstant(oneOff(new Date(2026, 6, 31)), [], OVERDUE, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 7, 1));
		});

		it('sin fecha límite no tiene instante', () => {
			expect(urgencyInstant(oneOff(), [], PENDING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toBeUndefined();
		});
	});

	describe('relativa', () => {
		const completions = [
			completion('r', new Date(2026, 6, 14, 8, 0, 0)),
			completion('r', new Date(2026, 6, 15, 7, 0, 0)),
			completion('otra', new Date(2026, 6, 15, 11, 0, 0))
		];

		it('nunca completada: creadaEn', () => {
			expect(urgencyInstant(relative, [completion('otra', new Date(2026, 6, 15))], PENDING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(CREATED);
		});

		it('pendiente y en espera: V, desde el completado más reciente de la tarea', () => {
			expect(urgencyInstant(relative, completions, PENDING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 6, 15, 13, 0, 0));
			expect(urgencyInstant(relative, completions, WAITING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 6, 15, 13, 0, 0));
		});

		it('atrasada: V + intervalo', () => {
			expect(urgencyInstant(relative, completions, OVERDUE, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 6, 15, 19, 0, 0));
		});

		it('en días cuenta 24 horas por día', () => {
			const ofDays: Task = { ...relative, recurrence: { mode: 'relativo', every: 2, unit: 'dias' } };
			expect(urgencyInstant(ofDays, completions, OVERDUE, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 6, 19, 7, 0, 0));
		});
	});

	describe('calendario', () => {
		// P = martes 14, N = jueves 16.
		const completions = [completion('s', new Date(2026, 6, 14, 9, 0, 0), new Date(2026, 6, 14)), completion('otra', new Date(2026, 6, 15), new Date(2026, 6, 21))];

		it('pendiente y en espera: las 00:00 de N', () => {
			expect(urgencyInstant(weekly, completions, PENDING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 6, 16));
			expect(urgencyInstant(weekly, completions, WAITING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 6, 16));
		});

		it('atrasada: las 00:00 del día siguiente a N', () => {
			expect(urgencyInstant(weekly, completions, OVERDUE, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 6, 17));
		});

		it('sin completados, N es la primera ocurrencia desde creadaEn', () => {
			// Creada el miércoles 1: N = jueves 2.
			expect(urgencyInstant(weekly, [], PENDING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(new Date(2026, 6, 2));
		});
	});
});

describe('instanteDeUrgencia de una reanudada (spec §5.8, §6.1)', () => {
	const RESUMED = new Date(2026, 6, 15, 10, 0, 0);

	it('de calendario en espera: la próxima ocurrencia desde reanudadaEn, sin contar lo cubierto antes', () => {
		const coveredOnThursday = completion('s', new Date(2026, 6, 14, 9, 0, 0), new Date(2026, 6, 16));

		expect(urgencyInstant({ ...weekly, resumedAt: RESUMED }, [coveredOnThursday], WAITING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(
			new Date(2026, 6, 16)
		);
	});

	it('relativa nunca completada desde la reanudación: pendiente desde reanudadaEn', () => {
		const ofBefore = completion('r', new Date(2026, 6, 14, 9, 0, 0));

		expect(urgencyInstant({ ...relative, resumedAt: RESUMED }, [ofBefore], PENDING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toEqual(RESUMED);
	});
});

describe('instanteDeUrgencia de una pospuesta (spec §5.9)', () => {
	it('en espera por la posposición, vuelve en hasta', () => {
		const to = new Date(2026, 6, 15, 13, 0, 0);
		const task = { ...oneOff(new Date(2026, 6, 20)), postponed: { from: new Date(2026, 6, 15, 10, 0, 0), to } };

		expect(urgencyInstant(task, [], WAITING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toBe(to);
	});

	it('al vencer, vuelve a su clave de siempre', () => {
		const limit = new Date(2026, 6, 20);
		const postponed = { from: new Date(2026, 6, 15, 9, 0, 0), to: new Date(2026, 6, 15, 11, 0, 0) };

		expect(urgencyInstant({ ...oneOff(limit), postponed }, [], PENDING, NO_SCHEDULE_NOW_DOES_NOT_MATTER)).toBe(limit);
	});
});
