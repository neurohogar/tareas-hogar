import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { accionDePausa, comoRecienCreada, estaPausada } from './pausa';
import type { Completado, Tarea } from './tarea';

const instante = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
const periodica = fc
	.record({ creadaEn: instante, pausada: fc.boolean(), reanudadaEn: fc.option(instante, { nil: undefined }) })
	.map(({ creadaEn, pausada, reanudadaEn }): Tarea => ({
		id: 't',
		titulo: 'T',
		tipo: 'periodica',
		recurrencia: { modo: 'relativo', cada: 1, unidad: 'dias' },
		creadaEn,
		...(pausada && { pausada }),
		...(reanudadaEn && { reanudadaEn })
	}));
const puntual = fc
	.record({ creadaEn: instante, reanudadaEn: fc.option(instante, { nil: undefined }), pausada: fc.boolean() })
	.map(({ creadaEn, reanudadaEn, pausada }): Tarea => ({ id: 't', titulo: 'T', tipo: 'puntual', creadaEn, ...(pausada && { pausada }), ...(reanudadaEn && { reanudadaEn }) }) as Tarea);
const completados = fc
	.array(instante, { maxLength: 8 })
	.map((lista) => lista.map((completadoEn, i): Completado => ({ id: `c${i}`, tareaId: 't', completadoEn })));

describe('pausa: propiedades (spec §5.8)', () => {
	it('una puntual nunca está pausada ni tiene botón de pausa', () => {
		fc.assert(
			fc.property(puntual, instante, (tarea, ahora) => {
				expect(estaPausada(tarea)).toBe(false);
				expect(accionDePausa(tarea)).toBeUndefined();
			})
		);
	});

	it('el botón de una periódica es pausar o reanudar según esté pausada', () => {
		fc.assert(
			fc.property(periodica, (tarea) => {
				expect(accionDePausa(tarea)).toBe(estaPausada(tarea) ? 'reanudar' : 'pausar');
			})
		);
	});

	it('comoRecienCreada: una puntual o una periódica sin reanudadaEn queda igual', () => {
		fc.assert(
			fc.property(fc.oneof(puntual, periodica.filter((t) => t.tipo === 'periodica' && !t.reanudadaEn)), completados, (tarea, propios) => {
				expect(comoRecienCreada(tarea, propios)).toStrictEqual({ tarea, propios });
			})
		);
	});

	it('comoRecienCreada: con reanudadaEn, creadaEn = reanudadaEn y solo quedan los completados desde ahí', () => {
		fc.assert(
			fc.property(periodica.filter((t) => t.tipo === 'periodica' && !!t.reanudadaEn), completados, (tarea, propios) => {
				const desde = tarea.tipo === 'periodica' ? tarea.reanudadaEn! : tarea.creadaEn;
				const resultado = comoRecienCreada(tarea, propios);
				expect(resultado.tarea.creadaEn).toStrictEqual(desde);
				expect(resultado.propios).toStrictEqual(propios.filter((c) => c.completadoEn.getTime() >= desde.getTime()));
			})
		);
	});

	it('comoRecienCreada es idempotente', () => {
		fc.assert(
			fc.property(periodica, completados, (tarea, propios) => {
				const una = comoRecienCreada(tarea, propios);
				expect(comoRecienCreada(una.tarea, una.propios)).toStrictEqual(una);
			})
		);
	});
});
