// Spec §6.7: qué anotaciones se ven, su orden, su agrupación por día y el texto copiado.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Anotacion } from './anotacion';
import { anotacionesEnPantalla, anotacionesVisibles } from './anotaciones';
import { textoDeAnotaciones } from './anotaciones-copiadas';
import { anotacionesHuerfanas, borrado } from './borrado';
import { compararIds } from './comparar-ids';
import type { Tarea } from './tarea';

const IDS = ['t1', 't2', 't3'];
const tareas = fc.subarray(IDS).map((ids) => ids.map((id): Tarea => ({ id, titulo: id, tipo: 'puntual', creadaEn: new Date(0) })));
const anotacion = fc.record(
	{
		id: fc.uuid(),
		sentido: fc.constantFrom('Me sirvió' as const, 'Me molestó' as const),
		anotadaEn: fc.date({ min: new Date('2026-01-01T00:00:00'), max: new Date('2026-01-05T00:00:00'), noInvalidDate: true }),
		pantalla: fc.constantFrom('Pendientes' as const, 'Panel de edición' as const),
		tareaId: fc.constantFrom(...IDS, 'borrada'),
		texto: fc.constantFrom('uno', 'dos')
	},
	{ requiredKeys: ['id', 'sentido', 'anotadaEn', 'pantalla'] }
);
const anotaciones = fc.uniqueArray(anotacion, { selector: ({ id }) => id, maxLength: 12 }) as fc.Arbitrary<Anotacion[]>;
const ahora = fc.date({ min: new Date('2026-01-01T00:00:00'), max: new Date('2026-02-01T00:00:00'), noInvalidDate: true });
const masAntiguaPrimero = (a: Date, b: Date) => a.getTime() - b.getTime();
const idsDe = (lista: readonly { id: string }[]) => lista.map(({ id }) => id);

describe('anotacionesVisibles (propiedades)', () => {
	it('son las que no son huérfanas, sin repetir ni perder ninguna', () => {
		fc.assert(
			fc.property(tareas, anotaciones, (ts, as) => {
				const visibles = anotacionesVisibles(ts, as, masAntiguaPrimero).map((v) => v.anotacion);
				const huerfanas = anotacionesHuerfanas(ts, as);
				expect([...idsDe(visibles), ...idsDe(huerfanas)].sort()).toStrictEqual(idsDe(as).sort());
			})
		);
	});

	it('quedan ordenadas por anotadaEn y, si empatan, por id', () => {
		fc.assert(
			fc.property(tareas, anotaciones, (ts, as) => {
				const visibles = anotacionesVisibles(ts, as, masAntiguaPrimero).map((v) => v.anotacion);
				for (let i = 1; i < visibles.length; i++) {
					const [a, b] = [visibles[i - 1], visibles[i]];
					const orden = a.anotadaEn.getTime() - b.anotadaEn.getTime() || compararIds(a.id, b.id);
					expect(orden).toBeLessThan(0);
				}
			})
		);
	});

	it('no depende del orden en que llegan', () => {
		fc.assert(
			fc.property(tareas, anotaciones, (ts, as) => {
				const derecho = anotacionesVisibles(ts, as, masAntiguaPrimero);
				expect(anotacionesVisibles(ts, [...as].reverse(), masAntiguaPrimero)).toStrictEqual(derecho);
			})
		);
	});
});

describe('anotacionesEnPantalla (propiedades)', () => {
	it('muestra las mismas anotaciones que las visibles, de la más reciente a la más antigua, con encabezados distintos', () => {
		fc.assert(
			fc.property(tareas, anotaciones, ahora, (ts, as, hoy) => {
				const grupos = anotacionesEnPantalla(ts, as, hoy);
				const entradas = grupos.flatMap((g) => g.entradas.map((e) => e.anotacion));
				expect(idsDe(entradas)).toStrictEqual(idsDe(anotacionesVisibles(ts, as, (a, b) => b.getTime() - a.getTime()).map((v) => v.anotacion)));
				const encabezados = grupos.map((g) => g.encabezado);
				expect(new Set(encabezados).size).toBe(encabezados.length);
				for (const g of grupos) expect(g.entradas.length).toBeGreaterThan(0);
			})
		);
	});
});

describe('textoDeAnotaciones (propiedades)', () => {
	it('tiene una línea por anotación visible y es undefined si no hay ninguna', () => {
		fc.assert(
			fc.property(tareas, anotaciones, (ts, as) => {
				const copiado = textoDeAnotaciones(ts, as);
				const cuantas = anotacionesVisibles(ts, as, masAntiguaPrimero).length;
				if (cuantas === 0) expect(copiado).toBeUndefined();
				else expect(copiado?.split('\n')).toHaveLength(cuantas);
			})
		);
	});
});

describe('borrado y huérfanas de anotaciones (propiedades)', () => {
	it('borrar una tarea borra sus anotaciones y solo esas', () => {
		fc.assert(
			fc.property(fc.constantFrom(...IDS), anotaciones, (id, as) => {
				expect(borrado(id, [], as).anotacionIds).toStrictEqual(idsDe(as.filter((a) => a.tareaId === id)));
			})
		);
	});

	it('las huérfanas son idempotentes, conservan el orden y nunca incluyen las sin tarea', () => {
		fc.assert(
			fc.property(tareas, anotaciones, (ts, as) => {
				const huerfanas = anotacionesHuerfanas(ts, as);
				expect(anotacionesHuerfanas(ts, huerfanas)).toStrictEqual(huerfanas);
				expect(huerfanas).toStrictEqual(as.filter((a) => huerfanas.includes(a)));
				expect(huerfanas.every((a) => a.tareaId !== undefined)).toBe(true);
			})
		);
	});
});
