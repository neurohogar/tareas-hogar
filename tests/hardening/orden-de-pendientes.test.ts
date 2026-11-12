import { describe, expect, it } from 'vitest';
import { compararPorUrgencia, type FilaPorOrdenar } from '../../src/lib/core/orden-de-pendientes';

const fila = (id: string): FilaPorOrdenar => ({
	tarea: { id, titulo: 'Barrer', tipo: 'puntual', creadaEn: new Date(0) },
	estado: { tipo: 'pendiente' },
	instante: new Date(0)
});

describe('compararPorUrgencia: último desempate por id', () => {
	it('el id menor va primero, el mayor después y el mismo id empata', () => {
		expect(compararPorUrgencia(fila('a'), fila('b'))).toBe(-1);
		expect(compararPorUrgencia(fila('b'), fila('a'))).toBe(1);
		expect(compararPorUrgencia(fila('a'), fila('a'))).toBe(0);
	});
});
