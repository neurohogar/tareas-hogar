import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { completar } from './completados';
import { inicioDelDia } from './dias';
import type { EstadoEnPendientes } from './estado';
import { estadoPeriodicaCalendario } from './estado-periodica-calendario';
import { esOcurrencia } from './ocurrencias';
import { DIAS_DE_LA_SEMANA, type Completado, type RecurrenciaCalendario, type TareaPeriodica } from './tarea';

const HORA_MS = 3_600_000;
const RANGO: Record<EstadoEnPendientes['tipo'], number> = { 'en espera': 0, pendiente: 1, atrasada: 2 };
const recurrencia: fc.Arbitrary<RecurrenciaCalendario> = fc.oneof(
	fc.subarray([...DIAS_DE_LA_SEMANA], { minLength: 1 }).map((d) => ({ modo: 'calendario' as const, diasSemana: d })),
	fc
		.uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 6 })
		.map((d) => ({ modo: 'calendario' as const, diasMes: d.sort((a, b) => a - b) }))
);
const creadaEn = fc
	.tuple(fc.integer({ min: 0, max: 30_000 }), fc.integer({ min: 0, max: 23 }))
	.map(([dia, hora]) => new Date(1990, 0, 1 + dia, hora));

/** Una tarea con un historial armado con `completar` en momentos al azar (horas desde creadaEn). */
const conHistorial = fc
	.tuple(recurrencia, creadaEn, fc.array(fc.integer({ min: -48, max: 3_000 }), { maxLength: 10 }))
	.map(([r, creada, horas]) => {
		const t: TareaPeriodica = { id: 't', titulo: 'T', tipo: 'periodica', recurrencia: r, creadaEn: creada };
		const cs = horas.reduce<Completado[]>(
			(previos, h) => [...previos, completar(t, previos, `c${previos.length}`, new Date(creada.getTime() + h * HORA_MS))],
			[]
		);
		return { r, creada, cs };
	});
/** Horas después de creadaEn: hasta ~5 meses. */
const horas = fc.integer({ min: 0, max: 3_600 });
const estado = ({ r, creada, cs }: { r: RecurrenciaCalendario; creada: Date; cs: Completado[] }, h: number) =>
	estadoPeriodicaCalendario(r, creada, cs, new Date(creada.getTime() + h * HORA_MS));

describe('estadoPeriodicaCalendario (propiedades)', () => {
	it('con el tiempo el estado solo avanza: en espera → pendiente → atrasada', () => {
		fc.assert(
			fc.property(conHistorial, horas, horas, (tarea, a, b) => {
				const [antes, despues] = [Math.min(a, b), Math.max(a, b)];
				expect(RANGO[estado(tarea, antes).tipo]).toBeLessThanOrEqual(RANGO[estado(tarea, despues).tipo]);
			})
		);
	});

	it('el progreso de en espera está en [0, 1)', () => {
		fc.assert(
			fc.property(conHistorial, horas, (tarea, h) => {
				const e = estado(tarea, h);
				if (e.tipo !== 'en espera') return;
				expect(e.progreso).toBeGreaterThanOrEqual(0);
				expect(e.progreso).toBeLessThan(1);
			})
		);
	});

	it('solo está pendiente en un día de ocurrencia', () => {
		fc.assert(
			fc.property(conHistorial, horas, (tarea, h) => {
				const ahora = new Date(tarea.creada.getTime() + h * HORA_MS);
				if (estado(tarea, h).tipo === 'pendiente') expect(esOcurrencia(tarea.r, inicioDelDia(ahora))).toBe(true);
			})
		);
	});

	it('recién creada: pendiente si se crea en un día de ocurrencia; si no, en espera desde 0', () => {
		fc.assert(
			fc.property(recurrencia, creadaEn, (r, creada) => {
				const esperado = esOcurrencia(r, inicioDelDia(creada)) ? { tipo: 'pendiente' } : { tipo: 'en espera', progreso: 0 };
				expect(estadoPeriodicaCalendario(r, creada, [], creada)).toEqual(esperado);
			})
		);
	});

	it('el orden de los completados no cambia el estado', () => {
		const conPermutacion = conHistorial.chain((tarea) =>
			fc.shuffledSubarray(tarea.cs, { minLength: tarea.cs.length }).map((otro) => [tarea, { ...tarea, cs: otro }] as const)
		);
		fc.assert(
			fc.property(conPermutacion, horas, ([tarea, otra], h) => {
				expect(estado(otra, h)).toEqual(estado(tarea, h));
			})
		);
	});
});
