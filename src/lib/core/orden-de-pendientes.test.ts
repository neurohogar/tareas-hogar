import { describe, expect, it } from 'vitest';
import { compararPausadas } from './orden-de-pendientes';
import type { Tarea } from './tarea';

const tarea = (id: string, titulo: string, creadaEn: Date): Tarea => ({ id, titulo, creadaEn, tipo: 'puntual' });

describe('compararPausadas', () => {
	it('ordena por título en español', () => {
		const a = tarea('a', 'Barrer', new Date(0));
		const b = tarea('b', 'Ñandú', new Date(0));
		expect(compararPausadas(a, b)).toBeLessThan(0);
	});

	it('si los títulos empatan, desempata por creadaEn más antigua', () => {
		const antigua = tarea('b', 'Barrer', new Date(0));
		const reciente = tarea('a', 'Barrer', new Date(86_400_000));
		expect(compararPausadas(antigua, reciente)).toBeLessThan(0);
	});
});
