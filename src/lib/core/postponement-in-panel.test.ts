import { describe, expect, it } from 'vitest';
import { postponeAction, postponementText } from './postponement-in-panel';
import type { Completion, Task } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const ONE_OFF: Task = { id: 'p', title: 'Pagar', kind: 'puntual', createdAt: CREATED };
const RELATIVE: Task = { id: 'r', title: 'Regar', kind: 'periodica', recurrence: { mode: 'relativo', every: 2, unit: 'dias' }, createdAt: CREATED };
const completion = (taskId: string, completedAt: Date): Completion => ({ id: `c-${taskId}`, taskId, completedAt });
const postponed = (task: Task, from: Date, to: Date): Task => ({ ...task, postponed: { from, to } });

describe('accionDePosponer (spec §6.2)', () => {
	const NOW = new Date(2026, 6, 15, 10, 0, 0);

	it('una pendiente ofrece posponer', () => {
		expect(postponeAction(ONE_OFF, [], NOW)).toBe('posponer');
	});

	it('una atrasada ofrece posponer', () => {
		expect(postponeAction({ ...ONE_OFF, dueDate: new Date(2026, 6, 14) }, [], NOW)).toBe('posponer');
	});

	it('una en espera por su propia regla no ofrece nada', () => {
		expect(postponeAction(RELATIVE, [completion('r', new Date(2026, 6, 15, 9, 0, 0))], NOW)).toBeUndefined();
	});

	it('una puntual completada no ofrece nada', () => {
		expect(postponeAction(ONE_OFF, [completion('p', new Date(2026, 6, 15, 9, 0, 0))], NOW)).toBeUndefined();
	});

	it('una pausada no se puede posponer (spec §5.9)', () => {
		expect(postponeAction({ ...RELATIVE, paused: true }, [], NOW)).toBeUndefined();
	});

	it('una pospuesta ofrece quitar posponer', () => {
		expect(postponeAction(postponed(ONE_OFF, NOW, new Date(2026, 6, 15, 11, 0, 0)), [], NOW)).toBe('quitar');
	});

	it('una pospuesta y después completada sigue ofreciendo quitar posponer', () => {
		const task = postponed(RELATIVE, new Date(2026, 6, 15, 9, 0, 0), new Date(2026, 6, 15, 12, 0, 0));

		expect(postponeAction(task, [completion('r', new Date(2026, 6, 15, 9, 30, 0))], NOW)).toBe('quitar');
	});

	it('una pospuesta y después pausada sigue ofreciendo quitar posponer', () => {
		const task = postponed({ ...RELATIVE, paused: true }, new Date(2026, 6, 15, 9, 0, 0), new Date(2026, 6, 15, 12, 0, 0));

		expect(postponeAction(task, [], NOW)).toBe('quitar');
	});

	it('desde hasta, vuelve a ofrecer posponer', () => {
		expect(postponeAction(postponed(ONE_OFF, new Date(2026, 6, 15, 9, 0, 0), NOW), [], NOW)).toBe('posponer');
	});
});

describe('textoDePosposicion (spec §6.2)', () => {
	const FROM = new Date(2026, 6, 15, 10, 15, 30);

	it('si hasta es de hoy, la hora sin segundos', () => {
		const task = postponed(ONE_OFF, FROM, new Date(2026, 6, 15, 11, 15, 30));

		expect(postponementText(task, new Date(2026, 6, 15, 10, 30, 0))).toBe('Pospuesta hasta 11:15');
	});

	it('si hasta es de mañana, lo dice', () => {
		const task = postponed(ONE_OFF, FROM, new Date(2026, 6, 16, 1, 5, 0));

		expect(postponementText(task, new Date(2026, 6, 15, 23, 59, 59))).toBe('Pospuesta hasta mañana 01:05');
	});

	it('pasada la medianoche, ese mismo hasta ya es de hoy', () => {
		const task = postponed(ONE_OFF, FROM, new Date(2026, 6, 16, 1, 5, 0));

		expect(postponementText(task, new Date(2026, 6, 16, 0, 0, 0))).toBe('Pospuesta hasta 01:05');
	});

	it('hasta mañana cruzando de mes', () => {
		const task = postponed(ONE_OFF, FROM, new Date(2026, 7, 1, 7, 0, 0));

		expect(postponementText(task, new Date(2026, 6, 31, 20, 0, 0))).toBe('Pospuesta hasta mañana 07:00');
	});

	it('sin posposición vigente, no hay texto', () => {
		const to = new Date(2026, 6, 15, 11, 0, 0);

		expect(postponementText(ONE_OFF, FROM)).toBeUndefined();
		expect(postponementText(postponed(ONE_OFF, FROM, to), to)).toBeUndefined();
	});
});
