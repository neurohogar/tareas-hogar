import { describe, expect, it } from 'vitest';
import { taskStatus } from './task-status';
import type { Completion, Schedule, Recurrence, Task } from './task';
import { dueInstant, returnInstant } from './date-text-instants';

const CREATED = new Date(2026, 10, 1, 9, 0);
const NOW = new Date(2026, 10, 13, 10, 0);

const oneOff = (extra: Partial<Extract<Task, { kind: 'puntual' }>> = {}): Task => ({ id: 't', title: 'T', kind: 'puntual', createdAt: CREATED, ...extra });
const recurring = (recurrence: Recurrence, extra: Partial<Extract<Task, { kind: 'periodica' }>> = {}): Task => ({
	id: 't',
	title: 'T',
	kind: 'periodica',
	recurrence,
	createdAt: CREATED,
	...extra
});
const completion = (completedAt: Date): Completion => ({ id: `c${completedAt.getTime()}`, taskId: 't', completedAt });
const schedule = (...timeWindows: [string, string][]): Schedule => timeWindows.map(([from, to]) => ({ from, to }));

/** El instante de «Vuelve» con el estado que da el core, que tiene que ser en espera. */
function returns(task: Task, completions: Completion[], now: Date): Date {
	const status = taskStatus(task, completions, now);
	if (status.kind !== 'en espera') throw new Error(`se esperaba en espera y está ${status.kind}`);
	return returnInstant(task, completions, status, now);
}

describe('instanteDeTocaba (spec §6.1, instante de «Tocaba»)', () => {
	it('puntual: el día de la fecha límite, a las 00:00', () => {
		expect(dueInstant(oneOff({ dueDate: new Date(2026, 10, 10) }), [], NOW)).toEqual(new Date(2026, 10, 10));
	});

	it('puntual con horario: el día de la fecha límite, sin hora, aunque su primera ventana haya sido semanas antes', () => {
		const task = oneOff({ dueDate: new Date(2026, 10, 10), schedule: schedule(['08:00', '11:00']) });
		expect(dueInstant(task, [], NOW)).toEqual(new Date(2026, 10, 10));
	});

	it('puntual sin fecha límite: no tiene instante', () => {
		expect(dueInstant(oneOff(), [], NOW)).toBeUndefined();
	});

	it('relativa: V (desde cuándo toca), no V + intervalo (desde cuándo está atrasada)', () => {
		const task = recurring({ mode: 'relativo', every: 2, unit: 'dias' });
		expect(dueInstant(task, [completion(new Date(2026, 10, 8, 9, 0))], NOW)).toEqual(new Date(2026, 10, 10, 9, 0));
	});

	it('calendario: el día de N, no el día siguiente', () => {
		const task = recurring({ mode: 'calendario', weekdays: ['martes', 'jueves'] }, { createdAt: new Date(2026, 10, 2, 8, 0) });
		expect(dueInstant(task, [], NOW)).toEqual(new Date(2026, 10, 3));
		const monthly = recurring({ mode: 'calendario', monthDays: [10] });
		expect(dueInstant(monthly, [], NOW)).toEqual(new Date(2026, 10, 10));
	});

	it('con horario: A, el inicio de la ventana en que pasó a tocar', () => {
		const relative = recurring({ mode: 'relativo', every: 3, unit: 'horas' }, { schedule: schedule(['08:00', '09:00']) });
		expect(dueInstant(relative, [completion(new Date(2026, 10, 13, 4, 0))], NOW)).toEqual(new Date(2026, 10, 13, 8, 0));
		const weekly = recurring({ mode: 'calendario', weekdays: ['viernes'] }, { createdAt: new Date(2026, 10, 12, 8, 0), schedule: schedule(['09:20', '09:50']) });
		expect(dueInstant(weekly, [], NOW)).toEqual(new Date(2026, 10, 13, 9, 20));
	});

	it('con varias ventanas: el inicio de la ocurrencia N', () => {
		const task = (createdAt: Date) =>
			recurring({ mode: 'relativo', every: 2, unit: 'dias' }, { createdAt, schedule: schedule(['07:00', '10:00'], ['18:00', '21:00']) });
		expect(dueInstant(task(new Date(2026, 10, 10, 8, 0)), [], NOW)).toEqual(new Date(2026, 10, 10, 7, 0));
		expect(dueInstant(task(new Date(2026, 10, 10, 12, 0)), [], NOW)).toEqual(new Date(2026, 10, 10, 18, 0));
	});

	it('con horario y A todavía no llegó: el instante sin horario (V), nunca uno futuro', () => {
		const task = recurring({ mode: 'relativo', every: 3, unit: 'horas' }, { schedule: schedule(['20:00', '22:00']) });
		expect(dueInstant(task, [completion(new Date(2026, 10, 13, 2, 0))], NOW)).toEqual(new Date(2026, 10, 13, 5, 0));
	});

	it('con horario y A justo ahora: A', () => {
		const task = recurring({ mode: 'relativo', every: 3, unit: 'horas' }, { schedule: schedule(['10:00', '22:00']) });
		expect(dueInstant(task, [completion(new Date(2026, 10, 13, 2, 0))], NOW)).toEqual(new Date(2026, 10, 13, 10, 0));
	});

	it('reanudada: como recién creada en reanudadaEn (§5.8)', () => {
		const task = recurring({ mode: 'calendario', weekdays: ['martes'] }, { createdAt: new Date(2026, 9, 1), resumedAt: new Date(2026, 10, 2, 8, 0) });
		expect(dueInstant(task, [], NOW)).toEqual(new Date(2026, 10, 3));
	});
});

describe('instanteDeVuelve (spec §6.1, instante de «Vuelve»)', () => {
	it('relativa: V', () => {
		const task = recurring({ mode: 'relativo', every: 8, unit: 'horas' });
		expect(returns(task, [completion(NOW)], NOW)).toEqual(new Date(2026, 10, 13, 18, 0));
	});

	it('calendario: las 00:00 de N', () => {
		const task = recurring({ mode: 'calendario', weekdays: ['sábado'] }, { createdAt: new Date(2026, 10, 13, 8, 0) });
		expect(returns(task, [], NOW)).toEqual(new Date(2026, 10, 14));
	});

	it('con horario: A', () => {
		const task = recurring({ mode: 'relativo', every: 12, unit: 'horas' }, { schedule: schedule(['08:00', '10:30']) });
		expect(returns(task, [completion(NOW)], NOW)).toEqual(new Date(2026, 10, 14, 8, 0));
	});

	it('puntual fuera de ventana: el desde de la próxima', () => {
		const task = oneOff({ createdAt: new Date(2026, 10, 13, 12, 0), schedule: schedule(['08:00', '11:00']) });
		expect(returns(task, [], new Date(2026, 10, 13, 12, 0))).toEqual(new Date(2026, 10, 14, 8, 0));
	});

	it('pospuesta: pospuesta.hasta', () => {
		const task = oneOff({ postponed: { from: NOW, to: new Date(2026, 10, 13, 11, 0) } });
		expect(returns(task, [], NOW)).toEqual(new Date(2026, 10, 13, 11, 0));
	});

	it('con dos causas, el instante en que deja de estar en espera: el más tarde de los dos', () => {
		const postponed = { from: NOW, to: new Date(2026, 10, 13, 13, 0) };
		const completionA = [completion(new Date(2026, 10, 13, 10, 30))];
		const everyHour = recurring({ mode: 'relativo', every: 1, unit: 'horas' }, { postponed });
		expect(returns(everyHour, completionA, new Date(2026, 10, 13, 10, 30))).toEqual(new Date(2026, 10, 13, 13, 0));
		const everyEight = recurring({ mode: 'relativo', every: 8, unit: 'horas' }, { postponed });
		expect(returns(everyEight, completionA, new Date(2026, 10, 13, 10, 30))).toEqual(new Date(2026, 10, 13, 18, 30));
	});
});
