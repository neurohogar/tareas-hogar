import { describe, expect, it } from 'vitest';
import { taskName } from './task-name';
import type { Task } from './task';

const WATER: Task = { id: 't1', title: 'Regar', kind: 'puntual', createdAt: new Date(2026, 0, 1) };

describe('nombreDeTarea', () => {
	it('con emoji es «emoji título», con un solo espacio', () => {
		expect(taskName({ ...WATER, emoji: '🌱' })).toBe('🌱 Regar');
	});

	it('sin emoji es solo el título, sin espacio inicial', () => {
		expect(taskName(WATER)).toBe('Regar');
	});

	it('no incluye la nota', () => {
		expect(taskName({ ...WATER, ...{ note: 'Usar guantes' } })).toBe('Regar');
	});
});
