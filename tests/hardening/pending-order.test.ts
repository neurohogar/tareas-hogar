import { describe, expect, it } from 'vitest';
import { compareByUrgency, type RowToOrder } from '../../src/lib/core/pending-order';

const row = (id: string): RowToOrder => ({
	task: { id, title: 'Barrer', kind: 'puntual', createdAt: new Date(0) },
	status: { kind: 'pendiente' },
	instant: new Date(0)
});

describe('compareByUrgency: last tiebreak by id', () => {
	it('the lower id goes first, the higher after, and the same id ties', () => {
		expect(compareByUrgency(row('a'), row('b'))).toBe(-1);
		expect(compareByUrgency(row('b'), row('a'))).toBe(1);
		expect(compareByUrgency(row('a'), row('a'))).toBe(0);
	});
});
