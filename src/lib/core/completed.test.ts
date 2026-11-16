import { describe, expect, it } from 'vitest';
import { classifyInPending, isCompleted } from './completed';
import type { Completion, Task } from './task';

const NOW = new Date(2026, 6, 15, 12, 0, 0);
const ONE_COMPLETION: Completion[] = [{ id: 'c', taskId: 't', completedAt: new Date(2026, 6, 15, 8, 0, 0) }];

const oneOff: Task = { id: 't', title: 'T', kind: 'puntual', createdAt: new Date(2026, 6, 1) };
const recurring: Task = { id: 't', title: 'T', kind: 'periodica', recurrence: { mode: 'relativo', every: 1, unit: 'dias' }, createdAt: new Date(2026, 6, 1) };
const postponed = (task: Task): Task => ({ ...task, postponed: { from: new Date(2026, 6, 15, 11, 0, 0), to: new Date(2026, 6, 15, 14, 0, 0) } });

describe('estaCompletada (spec §6.1)', () => {
	it('una puntual con completados está completada', () => {
		expect(isCompleted(oneOff, ONE_COMPLETION, NOW)).toBe(true);
	});

	it('una periódica en espera con completados está completada', () => {
		expect(isCompleted(recurring, ONE_COMPLETION, NOW)).toBe(true);
	});

	it('una periódica en espera sin completados (antes de su primera ocurrencia) no está completada', () => {
		const future = { ...recurring, createdAt: new Date(2026, 6, 20) };

		expect(isCompleted(future, [], NOW)).toBe(false);
	});

	it('una tarea pendiente o atrasada no está completada aunque tenga completados', () => {
		const old = { ...recurring, createdAt: new Date(2026, 5, 1) };

		expect(isCompleted(oneOff, [], NOW)).toBe(false);
		expect(isCompleted(old, [{ ...ONE_COMPLETION[0], completedAt: new Date(2026, 5, 2) }], NOW)).toBe(false);
	});

	it('una pausada no está completada (spec §5.8)', () => {
		expect(isCompleted({ ...recurring, paused: true }, ONE_COMPLETION, NOW)).toBe(false);
	});
});

describe('clasificarEnPendientes', () => {
	it('conserva el estado de una no completada para ordenarla por urgencia', () => {
		expect(classifyInPending(oneOff, [], NOW)).toEqual({ completed: false, status: { kind: 'pendiente' } });
	});

	it('marca la completada con su estado', () => {
		expect(classifyInPending(oneOff, ONE_COMPLETION, NOW)).toEqual({ completed: true, status: { kind: 'completada' } });
	});
});

describe('una pospuesta no está completada (spec §5.9)', () => {
	it('una puntual completada sigue completada aunque esté pospuesta', () => {
		expect(isCompleted(postponed(oneOff), ONE_COMPLETION, NOW)).toBe(true);
	});

	it('en espera por la posposición, con completados, no está completada', () => {
		const classified = classifyInPending(postponed({ ...recurring, createdAt: new Date(2026, 5, 1) }), [{ ...ONE_COMPLETION[0], completedAt: new Date(2026, 5, 2) }], NOW);

		expect(classified.completed).toBe(false);
		expect(classified.status.kind).toBe('en espera');
	});

	it('una periódica en espera por su propia regla, con completados, sigue completada aunque la posposición ya venciera', () => {
		const expired = { ...recurring, postponed: { from: new Date(2026, 6, 15, 6, 0, 0), to: new Date(2026, 6, 15, 7, 0, 0) } };

		expect(isCompleted(expired, ONE_COMPLETION, NOW)).toBe(true);
	});
});
