import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { sumarDias } from './dias';
import { estadoPuntual } from './estado-puntual';
import type { Completado } from './tarea';

/** Un día local entre 1970 y ~2100 (a las 00:00), como una fecha límite guardada. */
const dia = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
/** Un instante cualquiera en el mismo rango, al milisegundo. */
const instante = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
const completados = fc
	.array(instante, { minLength: 1, maxLength: 5 })
	.map((momentos) => momentos.map((completadoEn, i): Completado => ({ id: `c${i}`, tareaId: 't', completadoEn })));

describe('estadoPuntual (propiedades, spec §5.1)', () => {
	it('sin completados ni fecha límite, siempre está pendiente', () => {
		fc.assert(
			fc.property(instante, (ahora) => {
				expect(estadoPuntual(undefined, [], ahora)).toEqual({ tipo: 'pendiente' });
			})
		);
	});

	it('sin completados, pasa de pendiente a atrasada exactamente al empezar el día siguiente a la fecha límite', () => {
		fc.assert(
			fc.property(dia, instante, (fechaLimite, ahora) => {
				const atrasadaDesde = sumarDias(fechaLimite, 1).getTime();
				const esperado = ahora.getTime() >= atrasadaDesde ? 'atrasada' : 'pendiente';
				expect(estadoPuntual(fechaLimite, [], ahora)).toEqual({ tipo: esperado });
			})
		);
	});

	it('el borde es exacto: el último milisegundo del día límite está pendiente y el primero del siguiente, atrasada', () => {
		fc.assert(
			fc.property(dia, (fechaLimite) => {
				const siguiente = sumarDias(fechaLimite, 1).getTime();
				expect(estadoPuntual(fechaLimite, [], new Date(siguiente - 1))).toEqual({ tipo: 'pendiente' });
				expect(estadoPuntual(fechaLimite, [], new Date(siguiente))).toEqual({ tipo: 'atrasada' });
			})
		);
	});

	it('con cualquier completado está completada, con o sin fecha límite y en cualquier momento', () => {
		fc.assert(
			fc.property(fc.option(dia, { nil: undefined }), completados, instante, (fechaLimite, hechos, ahora) => {
				expect(estadoPuntual(fechaLimite, hechos, ahora)).toEqual({ tipo: 'completada' });
			})
		);
	});
});
