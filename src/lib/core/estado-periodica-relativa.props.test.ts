import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { EstadoEnPendientes } from './estado';
import { estadoPeriodicaRelativa } from './estado-periodica-relativa';
import type { Completado, RecurrenciaRelativa } from './tarea';

const MS_POR_HORA = 3_600_000;
/** Momentos entre 1970 y ~2096, en ms: cualquier diferencia entre dos es exacta. */
const instante = fc.integer({ min: 0, max: 4_000_000_000_000 });
const recurrencia = fc.record({
	modo: fc.constant('relativo' as const),
	cada: fc.integer({ min: 1, max: 10_000 }),
	unidad: fc.constantFrom('horas' as const, 'dias' as const)
});
const completados = fc
	.array(instante, { minLength: 1, maxLength: 8 })
	.map((momentos) => momentos.map((ms, i): Completado => ({ id: `c${i}`, tareaId: 't', completadoEn: new Date(ms) })));
const conPermutacion = completados.chain((cs) =>
	fc.shuffledSubarray(cs, { minLength: cs.length, maxLength: cs.length }).map((permutados) => [cs, permutados] as const)
);

const RANGO: Record<EstadoEnPendientes['tipo'], number> = { 'en espera': 0, pendiente: 1, atrasada: 2 };
const estado = (r: RecurrenciaRelativa, cs: readonly Completado[], ms: number) =>
	estadoPeriodicaRelativa(r, cs, new Date(ms));
const intervaloEnMs = (r: RecurrenciaRelativa) => r.cada * (r.unidad === 'dias' ? 24 : 1) * MS_POR_HORA;
const ultimo = (cs: readonly Completado[]) => Math.max(...cs.map((c) => c.completadoEn.getTime()));

describe('estadoPeriodicaRelativa (propiedades)', () => {
	it('nunca completada: pendiente en cualquier momento', () => {
		fc.assert(
			fc.property(recurrencia, instante, (r, ahora) => {
				expect(estado(r, [], ahora)).toEqual({ tipo: 'pendiente' });
			})
		);
	});

	it('el progreso de en espera está en [0, 1)', () => {
		fc.assert(
			fc.property(recurrencia, completados, instante, (r, cs, ahora) => {
				const e = estado(r, cs, ahora);
				if (e.tipo !== 'en espera') return;
				expect(e.progreso).toBeGreaterThanOrEqual(0);
				expect(e.progreso).toBeLessThan(1);
			})
		);
	});

	it('no depende del orden de los completados', () => {
		fc.assert(
			fc.property(recurrencia, conPermutacion, instante, (r, [cs, permutados], ahora) => {
				expect(estado(r, permutados, ahora)).toEqual(estado(r, cs, ahora));
			})
		);
	});

	it('solo cuenta el completado más reciente: agregar uno anterior no cambia nada', () => {
		fc.assert(
			fc.property(recurrencia, completados, instante, fc.integer({ min: 0, max: 1e12 }), (r, cs, ahora, antes) => {
				const viejo: Completado = { id: 'viejo', tareaId: 't', completadoEn: new Date(ultimo(cs) - antes) };
				expect(estado(r, [...cs, viejo], ahora)).toEqual(estado(r, cs, ahora));
			})
		);
	});

	it('avanza en un solo sentido: en espera → pendiente → atrasada, con progreso creciente', () => {
		fc.assert(
			fc.property(recurrencia, completados, instante, instante, (r, cs, a, b) => {
				const [antes, despues] = [estado(r, cs, Math.min(a, b)), estado(r, cs, Math.max(a, b))];
				expect(RANGO[antes.tipo]).toBeLessThanOrEqual(RANGO[despues.tipo]);
				if (antes.tipo === 'en espera' && despues.tipo === 'en espera')
					expect(antes.progreso).toBeLessThanOrEqual(despues.progreso);
			})
		);
	});

	it('cambia de estado exactamente en V = U + intervalo y en V + intervalo', () => {
		fc.assert(
			fc.property(recurrencia, completados, (r, cs) => {
				const vencimiento = ultimo(cs) + intervaloEnMs(r);
				expect(estado(r, cs, vencimiento - 1).tipo).toBe('en espera');
				expect(estado(r, cs, vencimiento).tipo).toBe('pendiente');
				expect(estado(r, cs, vencimiento + intervaloEnMs(r) - 1).tipo).toBe('pendiente');
				expect(estado(r, cs, vencimiento + intervaloEnMs(r)).tipo).toBe('atrasada');
			})
		);
	});

	it('completar reinicia: justo al completar queda en espera con progreso 0, desde cualquier estado', () => {
		fc.assert(
			fc.property(recurrencia, completados, fc.integer({ min: 0, max: 1e12 }), (r, cs, despues) => {
				const ahora = ultimo(cs) + despues;
				const nuevo: Completado = { id: 'nuevo', tareaId: 't', completadoEn: new Date(ahora) };
				expect(estado(r, [...cs, nuevo], ahora)).toEqual({ tipo: 'en espera', progreso: 0 });
			})
		);
	});

	it('"cada N días" equivale a "cada N × 24 horas"', () => {
		fc.assert(
			fc.property(fc.integer({ min: 1, max: 1_000 }), completados, instante, (n, cs, ahora) => {
				const dias: RecurrenciaRelativa = { modo: 'relativo', cada: n, unidad: 'dias' };
				const horas: RecurrenciaRelativa = { modo: 'relativo', cada: 24 * n, unidad: 'horas' };
				expect(estado(dias, cs, ahora)).toEqual(estado(horas, cs, ahora));
			})
		);
	});

	it('solo importa el tiempo transcurrido: desplazar todos los momentos no cambia el estado', () => {
		fc.assert(
			fc.property(recurrencia, completados, instante, fc.integer({ min: -1e12, max: 1e12 }), (r, cs, ahora, delta) => {
				const desplazados = cs.map((c) => ({ ...c, completadoEn: new Date(c.completadoEn.getTime() + delta) }));
				expect(estado(r, desplazados, ahora + delta)).toEqual(estado(r, cs, ahora));
			})
		);
	});
});
