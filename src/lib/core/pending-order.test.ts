import { describe, expect, it } from 'vitest';
import { comparePaused } from './pending-order';
import type { Task } from './task';

const task = (id: string, title: string, createdAt: Date): Task => ({ id, title, createdAt, kind: 'puntual' });

describe('compararPausadas', () => {
	it('ordena por título en español', () => {
		const a = task('a', 'Barrer', new Date(0));
		const b = task('b', 'Ñandú', new Date(0));
		expect(comparePaused(a, b)).toBeLessThan(0);
	});

	it('si los títulos empatan, desempata por creadaEn más antigua', () => {
		const older = task('b', 'Barrer', new Date(0));
		const recent = task('a', 'Barrer', new Date(86_400_000));
		expect(comparePaused(older, recent)).toBeLessThan(0);
	});
});
