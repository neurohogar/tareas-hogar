import { describe, expect, it } from 'vitest';
import { accionDePausa, comoRecienCreada, estaPausada, pausar, reanudar } from './pausa';
import type { Completado, TareaPeriodica, TareaPuntual } from './tarea';

const CREADA = new Date(2026, 6, 1, 8, 0, 0);
const REANUDADA = new Date(2026, 6, 15, 10, 0, 0);
const RELATIVA: TareaPeriodica = {
	id: 'r',
	titulo: 'Regar',
	tipo: 'periodica',
	recurrencia: { modo: 'relativo', cada: 2, unidad: 'dias' },
	creadaEn: CREADA
};
const PUNTUAL: TareaPuntual = { id: 'p', titulo: 'Pagar', tipo: 'puntual', creadaEn: CREADA };
const completado = (id: string, completadoEn: Date): Completado => ({ id, tareaId: 'r', completadoEn });

describe('pausar y reanudar (spec §5.8, §7)', () => {
	it('pausar escribe pausada', () => {
		expect(pausar()).toStrictEqual({ pausada: true });
	});

	it('reanudar quita pausada y guarda reanudadaEn = ahora, en el mismo cambio', () => {
		expect(reanudar(REANUDADA)).toStrictEqual({ pausada: null, reanudadaEn: REANUDADA });
	});
});

describe('estaPausada (spec §4.1, §5.8)', () => {
	it('una periódica con pausada está pausada; sin el campo, no', () => {
		expect(estaPausada({ ...RELATIVA, pausada: true })).toBe(true);
		expect(estaPausada(RELATIVA)).toBe(false);
		expect(estaPausada({ ...RELATIVA, pausada: false })).toBe(false);
	});

	it('una puntual nunca está pausada', () => {
		expect(estaPausada(PUNTUAL)).toBe(false);
	});
});

describe('accionDePausa (spec §6.2)', () => {
	it('al editar una periódica ofrece pausar; si está pausada, reanudar', () => {
		expect(accionDePausa(RELATIVA)).toBe('pausar');
		expect(accionDePausa({ ...RELATIVA, pausada: true })).toBe('reanudar');
	});

	it('una puntual no se puede pausar', () => {
		expect(accionDePausa(PUNTUAL)).toBeUndefined();
	});
});

describe('comoRecienCreada (spec §5.8)', () => {
	it('una reanudada se evalúa con creadaEn = reanudadaEn y sin los completados anteriores a reanudadaEn', () => {
		const tarea = { ...RELATIVA, reanudadaEn: REANUDADA };
		const antes = completado('c1', new Date(2026, 6, 15, 9, 59, 59));
		const enElInstante = completado('c2', REANUDADA);
		const despues = completado('c3', new Date(2026, 6, 16, 8, 0, 0));

		expect(comoRecienCreada(tarea, [antes, enElInstante, despues])).toStrictEqual({
			tarea: { ...tarea, creadaEn: REANUDADA },
			propios: [enElInstante, despues]
		});
	});

	it('una que nunca se reanudó se evalúa tal cual', () => {
		const propios = [completado('c1', new Date(2026, 6, 2))];

		expect(comoRecienCreada(RELATIVA, propios)).toStrictEqual({ tarea: RELATIVA, propios });
		expect(comoRecienCreada(PUNTUAL, [])).toStrictEqual({ tarea: PUNTUAL, propios: [] });
	});
});
