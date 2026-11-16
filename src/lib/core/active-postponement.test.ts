import { describe, expect, it } from 'vitest';
import { withPostponement, activePostponement } from './active-postponement';
import type { Task } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const ONE_OFF: Task = { id: 'p', title: 'Pagar', kind: 'puntual', createdAt: CREATED };
const FROM = new Date(2026, 6, 15, 10, 0, 0);
const TO = new Date(2026, 6, 15, 13, 0, 0);
const POSTPONED: Task = { ...ONE_OFF, postponed: { from: FROM, to: TO } };

describe('posposicionVigente (spec §5.9)', () => {
	it('mientras ahora < hasta; desde hasta (inclusive), ya no', () => {
		const saved = { from: FROM, to: TO };

		expect(activePostponement(POSTPONED, FROM)).toStrictEqual(saved);
		expect(activePostponement(POSTPONED, new Date(TO.getTime() - 1))).toStrictEqual(saved);
		expect(activePostponement(POSTPONED, TO)).toBeUndefined();
	});

	it('sin el campo, no está pospuesta', () => {
		expect(activePostponement(ONE_OFF, FROM)).toBeUndefined();
	});
});

describe('conPosposicion (spec §5.9)', () => {
	const HALFWAY = new Date(2026, 6, 15, 11, 30, 0);

	it.each([[{ kind: 'pendiente' }], [{ kind: 'atrasada' }]] as const)('%o, mientras dura, está en espera con el progreso de la posposición', (status) => {
		expect(withPostponement(status, POSTPONED, HALFWAY)).toStrictEqual({ kind: 'en espera', progress: 0.5 });
	});

	it('el progreso es 0 al posponer', () => {
		expect(withPostponement({ kind: 'pendiente' }, POSTPONED, FROM)).toStrictEqual({ kind: 'en espera', progress: 0 });
	});

	it('un desde posterior a ahora (otro reloj) da progreso 0, no negativo', () => {
		const before = new Date(2026, 6, 15, 9, 0, 0);

		expect(withPostponement({ kind: 'pendiente' }, POSTPONED, before)).toStrictEqual({ kind: 'en espera', progress: 0 });
	});

	it.each([[{ kind: 'pendiente' }], [{ kind: 'atrasada' }]] as const)('desde hasta, %o vuelve tal cual', (status) => {
		expect(withPostponement(status, POSTPONED, TO)).toBe(status);
	});

	it.each([[{ kind: 'en espera', progress: 0.25 }], [{ kind: 'completada' }], [{ kind: 'pausada' }]] as const)('%o no cambia', (status) => {
		expect(withPostponement(status, POSTPONED, HALFWAY)).toBe(status);
	});

	it('sin posposición, el estado no cambia', () => {
		const status = { kind: 'pendiente' } as const;

		expect(withPostponement(status, ONE_OFF, HALFWAY)).toBe(status);
	});
});
