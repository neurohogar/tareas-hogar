import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Estado } from './estado';
import { estadoDeTarea } from './estado-de-tarea';
import { DIAS_DE_LA_SEMANA, type Completado, type Tarea } from './tarea';
import { instanteDeUrgencia } from './urgencia';

const instante = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
const dia = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
const recurrencia = fc.oneof(
	fc.record({ modo: fc.constant('relativo' as const), cada: fc.integer({ min: 1, max: 1000 }), unidad: fc.constantFrom('horas' as const, 'dias' as const) }),
	fc.record({
		modo: fc.constant('calendario' as const),
		diasMes: fc.uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 3 }).map((d) => d.sort((a, b) => a - b))
	}),
	fc.record({
		modo: fc.constant('calendario' as const),
		diasSemana: fc.subarray([...DIAS_DE_LA_SEMANA], { minLength: 1 })
	})
);
const tarea = fc.tuple(fc.option(dia, { nil: undefined }), fc.option(recurrencia, { nil: undefined }), dia).map(
	([fechaLimite, recurrencia, creadaEn]): Tarea => {
		const comun = { id: 't', titulo: 'T', creadaEn };
		if (recurrencia) return { ...comun, tipo: 'periodica', recurrencia };
		return { ...comun, tipo: 'puntual', ...(fechaLimite && { fechaLimite }) };
	}
);
const completados = fc
	.array(fc.tuple(instante, fc.option(dia, { nil: undefined })), { maxLength: 4 })
	.map((lista) =>
		lista.map(([completadoEn, ocurrenciaCubierta], i): Completado => ({ id: `c${i}`, tareaId: 't', completadoEn, ...(ocurrenciaCubierta && { ocurrenciaCubierta }) }))
	);

/** El estado justo antes del instante de urgencia y en él (spec §6.1: "desde cuándo", "cuándo vuelve"). */
const transicion = (t: Tarea, cs: readonly Completado[], momento: Date): [Estado['tipo'], Estado['tipo']] => [
	estadoDeTarea(t, cs, new Date(momento.getTime() - 1)).tipo,
	estadoDeTarea(t, cs, momento).tipo
];

describe('instanteDeUrgencia (propiedades)', () => {
	it('es el momento en que la tarea entró en su estado (atrasada, pendiente) o en que sale de la espera', () => {
		fc.assert(
			fc.property(tarea, completados, instante, (t, cs, ahora) => {
				const estado = estadoDeTarea(t, cs, ahora);
				if (estado.tipo === 'completada' || estado.tipo === 'pausada') return;
				const momento = instanteDeUrgencia(t, cs, estado, ahora);
				// Una puntual pendiente cuenta desde su fecha límite (o no tiene instante) y una relativa nunca completada desde creadaEn: no son transiciones.
				const sinTransicion = estado.tipo === 'pendiente' && (t.tipo === 'puntual' || (t.recurrencia.modo === 'relativo' && cs.length === 0));
				if (sinTransicion || momento === undefined) return;
				if (estado.tipo === 'en espera') {
					expect(momento.getTime()).toBeGreaterThan(ahora.getTime());
					expect(transicion(t, cs, momento)).toEqual(['en espera', 'pendiente']);
				} else {
					expect(momento.getTime()).toBeLessThanOrEqual(ahora.getTime());
					expect(transicion(t, cs, momento)).toEqual([estado.tipo === 'atrasada' ? 'pendiente' : 'en espera', estado.tipo]);
				}
			})
		);
	});

	it('una puntual pendiente cuenta desde su fecha límite y, sin ella, no tiene instante', () => {
		fc.assert(
			fc.property(tarea, instante, (t, ahora) => {
				fc.pre(t.tipo === 'puntual');
				const estado = estadoDeTarea(t, [], ahora);
				fc.pre(estado.tipo === 'pendiente');
				expect(instanteDeUrgencia(t, [], estado, ahora)).toEqual(t.tipo === 'puntual' ? t.fechaLimite : undefined);
			})
		);
	});
});
