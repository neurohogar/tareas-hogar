// Spec §6.2 (Borrar tarea) y §7 (Borrado de tareas y completados huérfanos).
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { borrado, completadosHuerfanos, existeTarea } from './borrado';
import type { Completado, Tarea } from './tarea';

const IDS = ['t1', 't2', 't3', 't4'];
const tareaId = fc.constantFrom(...IDS);
const tareas = fc
	.subarray(IDS)
	.map((ids) => ids.map((id): Tarea => ({ id, titulo: id, tipo: 'puntual', creadaEn: new Date(0) })));
const completados = fc
	.uniqueArray(fc.record({ id: fc.uuid(), tareaId, completadoEn: fc.date({ noInvalidDate: true }) }), {
		maxLength: 15,
		selector: ({ id }) => id
	})
	.map((cs) => cs as Completado[]);
const ids = (cs: readonly Completado[]) => cs.map(({ id }) => id);

describe('borrado (propiedades)', () => {
	it('borra todos los completados de la tarea y solo esos', () => {
		fc.assert(
			fc.property(tareaId, completados, (id, cs) => {
				const { tareaId: borrada, completadoIds } = borrado(id, cs, []);
				expect(borrada).toBe(id);
				expect(completadoIds).toEqual(ids(cs.filter((c) => c.tareaId === id)));
			})
		);
	});

	it('tras borrar una tarea, sus completados y los huérfanos de antes particionan los huérfanos de después', () => {
		fc.assert(
			fc.property(tareas, completados, (ts, cs) => {
				fc.pre(ts.length > 0);
				const [borrada, ...restantes] = ts;
				const { completadoIds } = borrado(borrada.id, cs, []);
				const antes = ids(completadosHuerfanos(ts, cs));
				const despues = ids(completadosHuerfanos(restantes, cs));
				expect(completadoIds.filter((id) => antes.includes(id))).toEqual([]);
				expect([...completadoIds, ...antes].sort()).toEqual([...despues].sort());
			})
		);
	});

	it('si el batch se aplica, no queda ningún huérfano de la tarea borrada', () => {
		fc.assert(
			fc.property(tareas, completados, (ts, cs) => {
				fc.pre(ts.length > 0);
				const [borrada, ...restantes] = ts;
				const { completadoIds } = borrado(borrada.id, cs, []);
				const quedan = cs.filter(({ id }) => !completadoIds.includes(id));
				expect(completadosHuerfanos(restantes, quedan)).toStrictEqual(completadosHuerfanos(ts, cs));
			})
		);
	});
});

describe('completadosHuerfanos (propiedades)', () => {
	it('particiona los completados: huérfano si y solo si su tarea no existe', () => {
		fc.assert(
			fc.property(tareas, completados, (ts, cs) => {
				const huerfanos = completadosHuerfanos(ts, cs);
				for (const c of cs) expect(huerfanos.includes(c)).toBe(!existeTarea(ts, c.tareaId));
			})
		);
	});

	it('es idempotente y conserva el orden', () => {
		fc.assert(
			fc.property(tareas, completados, (ts, cs) => {
				const huerfanos = completadosHuerfanos(ts, cs);
				expect(completadosHuerfanos(ts, huerfanos)).toStrictEqual(huerfanos);
				expect(huerfanos).toStrictEqual(cs.filter((c) => huerfanos.includes(c)));
			})
		);
	});

	it('limpiarlos deja sin huérfanos', () => {
		fc.assert(
			fc.property(tareas, completados, (ts, cs) => {
				const huerfanos = completadosHuerfanos(ts, cs);
				expect(completadosHuerfanos(ts, cs.filter((c) => !huerfanos.includes(c)))).toEqual([]);
			})
		);
	});
});
