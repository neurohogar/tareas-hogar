import { describe, expect, it } from 'vitest';
import { conPosposicion, posposicionVigente } from './posposicion-vigente';
import type { Tarea } from './tarea';

const CREADA = new Date(2026, 6, 1, 8, 0, 0);
const PUNTUAL: Tarea = { id: 'p', titulo: 'Pagar', tipo: 'puntual', creadaEn: CREADA };
const DESDE = new Date(2026, 6, 15, 10, 0, 0);
const HASTA = new Date(2026, 6, 15, 13, 0, 0);
const POSPUESTA: Tarea = { ...PUNTUAL, pospuesta: { desde: DESDE, hasta: HASTA } };

describe('posposicionVigente (spec §5.9)', () => {
	it('mientras ahora < hasta; desde hasta (inclusive), ya no', () => {
		const guardada = { desde: DESDE, hasta: HASTA };

		expect(posposicionVigente(POSPUESTA, DESDE)).toStrictEqual(guardada);
		expect(posposicionVigente(POSPUESTA, new Date(HASTA.getTime() - 1))).toStrictEqual(guardada);
		expect(posposicionVigente(POSPUESTA, HASTA)).toBeUndefined();
	});

	it('sin el campo, no está pospuesta', () => {
		expect(posposicionVigente(PUNTUAL, DESDE)).toBeUndefined();
	});
});

describe('conPosposicion (spec §5.9)', () => {
	const A_LA_MITAD = new Date(2026, 6, 15, 11, 30, 0);

	it.each([[{ tipo: 'pendiente' }], [{ tipo: 'atrasada' }]] as const)('%o, mientras dura, está en espera con el progreso de la posposición', (estado) => {
		expect(conPosposicion(estado, POSPUESTA, A_LA_MITAD)).toStrictEqual({ tipo: 'en espera', progreso: 0.5 });
	});

	it('el progreso es 0 al posponer', () => {
		expect(conPosposicion({ tipo: 'pendiente' }, POSPUESTA, DESDE)).toStrictEqual({ tipo: 'en espera', progreso: 0 });
	});

	it('un desde posterior a ahora (otro reloj) da progreso 0, no negativo', () => {
		const antes = new Date(2026, 6, 15, 9, 0, 0);

		expect(conPosposicion({ tipo: 'pendiente' }, POSPUESTA, antes)).toStrictEqual({ tipo: 'en espera', progreso: 0 });
	});

	it.each([[{ tipo: 'pendiente' }], [{ tipo: 'atrasada' }]] as const)('desde hasta, %o vuelve tal cual', (estado) => {
		expect(conPosposicion(estado, POSPUESTA, HASTA)).toBe(estado);
	});

	it.each([[{ tipo: 'en espera', progreso: 0.25 }], [{ tipo: 'completada' }], [{ tipo: 'pausada' }]] as const)('%o no cambia', (estado) => {
		expect(conPosposicion(estado, POSPUESTA, A_LA_MITAD)).toBe(estado);
	});

	it('sin posposición, el estado no cambia', () => {
		const estado = { tipo: 'pendiente' } as const;

		expect(conPosposicion(estado, PUNTUAL, A_LA_MITAD)).toBe(estado);
	});
});
