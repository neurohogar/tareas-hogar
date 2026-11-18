import { describe, expect, it } from 'vitest';
import { comparePaused } from './pending-order';
import type { Task } from './task';

const task = (id: string, title: string, createdAt: Date): Task => ({ id, title, createdAt, kind: 'puntual' });

describe('comparePaused', () => {
	it('orders by title in Spanish', () => {
		const a = task('a', 'Barrer', new Date(0));
		const b = task('b', 'Ñandú', new Date(0));
		expect(comparePaused(a, b)).toBeLessThan(0);
	});

	it('if the titles tie, it breaks the tie by the oldest createdAt', () => {
		const older = task('b', 'Barrer', new Date(0));
		const recent = task('a', 'Barrer', new Date(86_400_000));
		expect(comparePaused(older, recent)).toBeLessThan(0);
	});
});
