import { describe, expect, it } from 'vitest';
import { withPostponement, activePostponement } from './active-postponement';
import type { Task } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const ONE_OFF: Task = { id: 'p', title: 'Pagar', kind: 'puntual', createdAt: CREATED };
const FROM = new Date(2026, 6, 15, 10, 0, 0);
const TO = new Date(2026, 6, 15, 13, 0, 0);
const POSTPONED: Task = { ...ONE_OFF, postponed: { from: FROM, to: TO } };

describe('activePostponement (spec §5.9)', () => {
	it('while now < to; from to on (inclusive), no longer', () => {
		const saved = { from: FROM, to: TO };

		expect(activePostponement(POSTPONED, FROM)).toStrictEqual(saved);
		expect(activePostponement(POSTPONED, new Date(TO.getTime() - 1))).toStrictEqual(saved);
		expect(activePostponement(POSTPONED, TO)).toBeUndefined();
	});

	it('without the field, it is not postponed', () => {
		expect(activePostponement(ONE_OFF, FROM)).toBeUndefined();
	});
});

describe('withPostponement (spec §5.9)', () => {
	const HALFWAY = new Date(2026, 6, 15, 11, 30, 0);

	it.each([[{ kind: 'pendiente' }], [{ kind: 'atrasada' }]] as const)('%o, while it lasts, is waiting with the progress of the postponement', (status) => {
		expect(withPostponement(status, POSTPONED, HALFWAY)).toStrictEqual({ kind: 'en espera', progress: 0.5 });
	});

	it('the progress is 0 when postponing', () => {
		expect(withPostponement({ kind: 'pendiente' }, POSTPONED, FROM)).toStrictEqual({ kind: 'en espera', progress: 0 });
	});

	it('a from later than now (another clock) gives progress 0, not negative', () => {
		const before = new Date(2026, 6, 15, 9, 0, 0);

		expect(withPostponement({ kind: 'pendiente' }, POSTPONED, before)).toStrictEqual({ kind: 'en espera', progress: 0 });
	});

	it.each([[{ kind: 'pendiente' }], [{ kind: 'atrasada' }]] as const)('from to on, %o comes back as is', (status) => {
		expect(withPostponement(status, POSTPONED, TO)).toBe(status);
	});

	it.each([[{ kind: 'en espera', progress: 0.25 }], [{ kind: 'completada' }], [{ kind: 'pausada' }]] as const)('%o does not change', (status) => {
		expect(withPostponement(status, POSTPONED, HALFWAY)).toBe(status);
	});

	it('without a postponement, the status does not change', () => {
		const status = { kind: 'pendiente' } as const;

		expect(withPostponement(status, ONE_OFF, HALFWAY)).toBe(status);
	});
});
