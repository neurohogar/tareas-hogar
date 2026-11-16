import { describe, expect, it } from 'vitest';
import { compareByUrgency, type RowToOrder } from '../../src/lib/core/pending-order';

const row = (id: string): RowToOrder => ({
	task: { id, title: 'Barrer', kind: 'puntual', createdAt: new Date(0) },
	status: { kind: 'pendiente' },
	instant: new Date(0)
});

describe('compararPorUrgencia: último desempate por id', () => {
	it('el id menor va primero, el mayor después y el mismo id empata', () => {
		expect(compareByUrgency(row('a'), row('b'))).toBe(-1);
		expect(compareByUrgency(row('b'), row('a'))).toBe(1);
		expect(compareByUrgency(row('a'), row('a'))).toBe(0);
	});
});
