import { describe, expect, it } from 'vitest';
import { taskName } from './task-name';
import type { Task } from './task';

const WATER: Task = { id: 't1', title: 'Regar', kind: 'puntual', createdAt: new Date(2026, 0, 1) };

describe('taskName', () => {
	it('with an emoji it is «emoji title», with a single space', () => {
		expect(taskName({ ...WATER, emoji: '🌱' })).toBe('🌱 Regar');
	});

	it('without an emoji it is just the title, without a leading space', () => {
		expect(taskName(WATER)).toBe('Regar');
	});

	it('it does not include the note', () => {
		expect(taskName({ ...WATER, ...{ note: 'Usar guantes' } })).toBe('Regar');
	});
});
