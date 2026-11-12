import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { accionDelCheckbox } from './checkbox';
import { estaCompletada } from './completada';
import { completadosDeTarea, completar, ultimoCompletadoEn } from './completados';
import { inicioDelDia } from './dias';
import type { Completado, RecurrenciaCalendario, RecurrenciaRelativa, Tarea } from './tarea';

const instante = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
const dia = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
const relativa: fc.Arbitrary<RecurrenciaRelativa> = fc.record({
	modo: fc.constant('relativo' as const),
	cada: fc.integer({ min: 1, max: 1000 }),
	unidad: fc.constantFrom('horas' as const, 'dias' as const)
});
const calendario: fc.Arbitrary<RecurrenciaCalendario> = fc.record({
	modo: fc.constant('calendario' as const),
	diasMes: fc.uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 3 }).map((d) => d.sort((a, b) => a - b))
});
const puntual = fc
	.tuple(fc.option(dia, { nil: undefined }), dia)
	.map(([fechaLimite, creadaEn]): Tarea => ({ id: 't', titulo: 'T', tipo: 'puntual', creadaEn, ...(fechaLimite && { fechaLimite }) }));
const periodica = (recurrencia: fc.Arbitrary<RecurrenciaRelativa | RecurrenciaCalendario>) =>
	fc.tuple(recurrencia, dia).map(([recurrencia, creadaEn]): Tarea => ({ id: 't', titulo: 'T', tipo: 'periodica', recurrencia, creadaEn }));
const tarea = fc.oneof(puntual, periodica(relativa), periodica(calendario));
/** Completados de la tarea t y de otra, para que el filtrado por tarea se ejercite. */
const completados = fc
	.array(fc.tuple(fc.constantFrom('t', 'otra'), instante), { maxLength: 6 })
	.map((lista) => lista.map(([tareaId, completadoEn], i): Completado => ({ id: `c${i}`, tareaId, completadoEn })));

describe('accionDelCheckbox (propiedades)', () => {
	it('una tarea no completada siempre se completa', () => {
		fc.assert(
			fc.property(tarea, completados, instante, (t, hechos, ahora) => {
				fc.pre(!estaCompletada(t, hechos, ahora));
				expect(accionDelCheckbox(t, hechos, ahora)).toEqual({ tipo: 'completar' });
			})
		);
	});

	it('si borra, borra el completado más reciente de la propia tarea', () => {
		fc.assert(
			fc.property(tarea, completados, instante, (t, hechos, ahora) => {
				const accion = accionDelCheckbox(t, hechos, ahora);
				if (accion.tipo !== 'borrar') return;
				const propios = completadosDeTarea(hechos, t.id);
				expect(propios).toContain(accion.completado);
				expect(accion.completado.completadoEn.getTime()).toBe(ultimoCompletadoEn(propios));
			})
		);
	});

	it('una puntual completada siempre borra', () => {
		fc.assert(
			fc.property(puntual, completados, instante, (t, hechos, ahora) => {
				fc.pre(completadosDeTarea(hechos, t.id).length > 0);
				expect(accionDelCheckbox(t, hechos, ahora).tipo).toBe('borrar');
			})
		);
	});

	it('una periódica cuyo último completado es de un día anterior se completa de nuevo', () => {
		fc.assert(
			fc.property(fc.oneof(periodica(relativa), periodica(calendario)), completados, instante, (t, hechos, ahora) => {
				const propios = completadosDeTarea(hechos, t.id);
				fc.pre(propios.length > 0 && ultimoCompletadoEn(propios) < inicioDelDia(ahora).getTime());
				expect(accionDelCheckbox(t, hechos, ahora)).toEqual({ tipo: 'completar' });
			})
		);
	});

	it('ida y vuelta: tocar después de completar ahora borra justo ese completado', () => {
		fc.assert(
			fc.property(fc.oneof(puntual, periodica(relativa)), completados, instante, (t, hechos, ahora) => {
				const anteriores = hechos.filter(({ completadoEn }) => completadoEn.getTime() < ahora.getTime());
				const nuevo = completar(t, anteriores, 'nuevo', ahora);
				expect(accionDelCheckbox(t, [...anteriores, nuevo], ahora)).toEqual({ tipo: 'borrar', completado: nuevo });
			})
		);
	});
});
