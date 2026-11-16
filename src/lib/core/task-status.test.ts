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

describe('estadoDeTarea', () => {
	it('aplica la regla de la periódica relativa a los completados de la tarea', () => {
		expect(taskStatus(TASK, [completion('c1', 'tarea-1', U)], TWO_HOURS_LATER)).toEqual({
			kind: 'en espera',
			progress: 0.5
		});
	});

	it('ignora los completados de otras tareas', () => {
		const ofOther = completion('c2', 'tarea-2', TWO_HOURS_LATER);

		expect(taskStatus(TASK, [ofOther], TWO_HOURS_LATER)).toEqual({ kind: 'pendiente' });
	});

	it('aplica la regla de calendario a una semanal, con P desde creadaEn si nunca se completó', () => {
		const weekly: RecurringTask = {
			...TASK,
			recurrence: { mode: 'calendario', weekdays: ['martes'] },
			createdAt: new Date(2026, 6, 13, 8, 0, 0)
		};

		expect(taskStatus(weekly, [], new Date(2026, 6, 13, 16, 0, 0))).toEqual({ kind: 'en espera', progress: 0.5 });
		expect(taskStatus(weekly, [], new Date(2026, 6, 14, 9, 0, 0))).toEqual({ kind: 'pendiente' });
	});

	it('en modo calendario solo cuenta lo que cubren los completados de la tarea', () => {
		const monthly: RecurringTask = {
			...TASK,
			recurrence: { mode: 'calendario', monthDays: [15] },
			createdAt: new Date(2026, 6, 1, 8, 0, 0)
		};
		const ofOther: Completion = { ...completion('c3', 'tarea-2', U), coveredOccurrence: new Date(2026, 6, 15) };

		expect(taskStatus(monthly, [ofOther], new Date(2026, 6, 16, 0, 0, 0))).toEqual({ kind: 'atrasada' });
	});

	it('aplica la regla de la puntual con su fecha límite y solo los completados de la tarea', () => {
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

describe('estadoDeTarea de una pausada o reanudada (spec §5.8)', () => {
	const RESUMED = new Date(2026, 6, 15, 10, 0, 0);
	const relative: RecurringTask = { ...TASK, recurrence: { mode: 'relativo', every: 2, unit: 'dias' } };
	const weekly = (weekdays: RecurringTask['recurrence'] & { mode: 'calendario' }): RecurringTask => ({ ...TASK, recurrence: weekdays });
	const WEDNESDAY = weekly({ mode: 'calendario', weekdays: ['miércoles'] });
	const THURSDAY = weekly({ mode: 'calendario', weekdays: ['jueves'] });

	it('una pausada no tiene estado, aunque estaría atrasada', () => {
		const oldOne = completion('c1', 'tarea-1', new Date(2026, 6, 1, 9, 0, 0));

		expect(taskStatus({ ...relative, paused: true }, [oldOne], RESUMED)).toEqual({ kind: 'pausada' });
		expect(taskStatus({ ...WEDNESDAY, paused: true }, [], new Date(2026, 7, 20))).toEqual({ kind: 'pausada' });
	});

	it('una relativa reanudada queda pendiente: no cuenta el completado de antes de reanudar', () => {
		const ofYesterday = completion('c1', 'tarea-1', new Date(2026, 6, 14, 9, 0, 0));

		expect(taskStatus({ ...relative, resumedAt: RESUMED }, [ofYesterday], RESUMED)).toEqual({ kind: 'pendiente' });
		expect(taskStatus({ ...relative, resumedAt: RESUMED }, [ofYesterday], new Date(2026, 6, 25))).toEqual({ kind: 'pendiente' });
	});

	it('un completado en el instante de la reanudación cuenta', () => {
		const atTheInstant = completion('c1', 'tarea-1', RESUMED);

		expect(taskStatus({ ...relative, resumedAt: RESUMED }, [atTheInstant], RESUMED)).toEqual({ kind: 'en espera', progress: 0 });
	});

	it('una de calendario reanudada un día de ocurrencia queda pendiente, aunque la ocurrencia pasada esté sin cubrir', () => {
		expect(taskStatus({ ...WEDNESDAY, resumedAt: RESUMED }, [], RESUMED)).toEqual({ kind: 'pendiente' });
	});

	it('una de calendario reanudada un día sin ocurrencia queda en espera, con progreso desde reanudadaEn', () => {
		// Jueves 16 a las 00:00: 14 h después de reanudar, de 14 h de espera.
		expect(taskStatus({ ...THURSDAY, resumedAt: RESUMED }, [], new Date(2026, 6, 15, 17, 0, 0))).toEqual({
			kind: 'en espera',
			progress: 0.5
		});
	});

	it('con horario, una ventana que cerró antes de reanudar no cuenta como perdida', () => {
		const withSchedule: RecurringTask = { ...WEDNESDAY, schedule: [{ from: '08:00', to: '10:00' }], resumedAt: RESUMED };
		const later = new Date(2026, 6, 15, 12, 0, 0);

		expect(taskStatus(withSchedule, [], later).kind).toBe('en espera');
		expect(taskStatus({ ...withSchedule, resumedAt: new Date(2026, 6, 15, 9, 0, 0) }, [], later)).toEqual({ kind: 'atrasada' });
	});

	it('con horario, la reanudada en la ventana queda pendiente y se atrasa al cerrar', () => {
		const withSchedule: RecurringTask = { ...WEDNESDAY, schedule: [{ from: '08:00', to: '12:00' }], resumedAt: RESUMED };

		expect(taskStatus(withSchedule, [], new Date(2026, 6, 15, 11, 0, 0))).toEqual({ kind: 'pendiente' });
		expect(taskStatus(withSchedule, [], new Date(2026, 6, 15, 12, 0, 0))).toEqual({ kind: 'atrasada' });
	});

	it('con varios horarios, en espera hasta la próxima ventana que cierra después de reanudar', () => {
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

describe('estadoDeTarea de una pospuesta (spec §5.9)', () => {
	const FROM = new Date(2026, 6, 15, 10, 0, 0);
	const TO = new Date(2026, 6, 15, 13, 0, 0);
	const postponed = { from: FROM, to: TO };
	const HALFWAY = new Date(2026, 6, 15, 11, 30, 0);
	const ONE_OFF: OneOffTask = { id: 'p', title: 'Pagar', kind: 'puntual', createdAt: new Date(2026, 6, 1), postponed };

	it('una puntual pendiente está en espera hasta el borde de hasta, y después vuelve', () => {
		expect(taskStatus(ONE_OFF, [], HALFWAY)).toStrictEqual({ kind: 'en espera', progress: 0.5 });
		expect(taskStatus(ONE_OFF, [], TO)).toStrictEqual({ kind: 'pendiente' });
	});

	it('la posposición no mueve la fecha límite: al vencer, está atrasada en el acto', () => {
		const task = { ...ONE_OFF, dueDate: new Date(2026, 6, 14) };

		expect(taskStatus(task, [], HALFWAY)).toStrictEqual({ kind: 'en espera', progress: 0.5 });
		expect(taskStatus(task, [], TO)).toStrictEqual({ kind: 'atrasada' });
	});

	it('en espera por su propia regla, vale su progreso', () => {
		const task = { ...TASK, postponed };
		const now = new Date(2026, 6, 15, 12, 0, 0);

		expect(taskStatus(task, [completion('c', 'tarea-1', new Date(2026, 6, 15, 11, 0, 0))], now)).toStrictEqual({ kind: 'en espera', progress: 0.25 });
	});

	it('una puntual completada sigue completada', () => {
		expect(taskStatus(ONE_OFF, [completion('c', 'p', HALFWAY)], HALFWAY)).toStrictEqual({ kind: 'completada' });
	});

	it('esperaPorPosposicion distingue la espera por la posposición de la de su propia regla', () => {
		const relative = { ...TASK, postponed };
		const ofPostpone = completion('c', 'tarea-1', new Date(2026, 6, 15, 6, 0, 0));
		const ofItsRule = completion('c', 'tarea-1', new Date(2026, 6, 15, 11, 0, 0));

		expect(waitForPostponement(relative, [ofPostpone], HALFWAY)).toBe(postponed);
		expect(waitForPostponement(relative, [ofItsRule], HALFWAY)).toBeUndefined();
		expect(waitForPostponement(relative, [ofPostpone], TO)).toBeUndefined();
		expect(waitForPostponement(TASK, [], HALFWAY)).toBeUndefined();
	});

	it('una pausada no tiene estado aunque esté pospuesta', () => {
		expect(taskStatus({ ...TASK, postponed, paused: true }, [], HALFWAY)).toStrictEqual({ kind: 'pausada' });
	});

	it('una reanudada antes de hasta sigue pospuesta', () => {
		const task = { ...TASK, postponed, resumedAt: new Date(2026, 6, 15, 11, 0, 0) };

		expect(taskStatus(task, [], HALFWAY)).toStrictEqual({ kind: 'en espera', progress: 0.5 });
	});
});
