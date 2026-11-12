import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { estadoDeTarea } from './estado-de-tarea';
import type { Completado, Tarea, TareaPeriodica } from './tarea';

const instante = fc.integer({ min: 0, max: 4_000_000_000_000 });
const periodica = fc.record({
	cada: fc.integer({ min: 1, max: 10_000 }),
	unidad: fc.constantFrom('horas' as const, 'dias' as const)
}).map(({ cada, unidad }): TareaPeriodica => ({
	id: 'propia',
	titulo: 'T',
	tipo: 'periodica',
	recurrencia: { modo: 'relativo', cada, unidad },
	creadaEn: new Date(0)
}));
const puntual = fc.option(fc.integer({ min: 0, max: 47_000 }), { nil: undefined }).map(
	(dias): Tarea => ({
		id: 'propia',
		titulo: 'T',
		tipo: 'puntual',
		creadaEn: new Date(0),
		...(dias !== undefined && { fechaLimite: new Date(1970, 0, 1 + dias) })
	})
);
const tarea = fc.oneof(periodica, puntual);
const completadosDe = (tareaId: string) =>
	fc.array(instante, { maxLength: 6 }).map((momentos) =>
		momentos.map((ms, i): Completado => ({ id: `${tareaId}-${i}`, tareaId, completadoEn: new Date(ms) }))
	);

describe('estadoDeTarea (propiedades)', () => {
	it('los completados de otras tareas no cambian el estado', () => {
		fc.assert(
			fc.property(tarea, completadosDe('propia'), completadosDe('otra'), instante, (t, propios, ajenos, ahora) => {
				const fecha = new Date(ahora);
				expect(estadoDeTarea(t, [...ajenos, ...propios], fecha)).toEqual(estadoDeTarea(t, propios, fecha));
			})
		);
	});
});
