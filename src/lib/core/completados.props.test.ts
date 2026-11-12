import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { completadoMasReciente, completadosDeTarea, completar, ultimoCompletadoEn } from './completados';
import type { Completado, TareaPeriodica } from './tarea';

const tareaId = fc.constantFrom('t1', 't2', 't3');
const completado = fc.record({
	id: fc.uuid(),
	tareaId,
	completadoEn: fc.date({ noInvalidDate: true })
}) as fc.Arbitrary<Completado>;
const lista = fc.array(completado, { maxLength: 20 });

describe('completar (propiedades)', () => {
	it('registra la tarea, el id y el momento dados, sin ocurrencia cubierta', () => {
		fc.assert(
			fc.property(fc.uuid(), fc.uuid(), fc.date({ noInvalidDate: true }), (idTarea, id, ahora) => {
				const tarea: TareaPeriodica = {
					id: idTarea,
					titulo: 'T',
					tipo: 'periodica',
					recurrencia: { modo: 'relativo', cada: 1, unidad: 'horas' },
					creadaEn: new Date(0)
				};
				expect(completar(tarea, [], id, ahora)).toStrictEqual({ id, tareaId: idTarea, completadoEn: ahora });
			})
		);
	});
});

describe('completadosDeTarea (propiedades)', () => {
	it('devuelve exactamente los de la tarea, en el orden original', () => {
		fc.assert(
			fc.property(lista, tareaId, (cs, id) => {
				const deTarea = completadosDeTarea(cs, id);
				expect(deTarea.every((c) => c.tareaId === id)).toBe(true);
				expect(deTarea).toEqual(cs.filter((c) => c.tareaId === id));
			})
		);
	});

	it('es idempotente', () => {
		fc.assert(
			fc.property(lista, tareaId, (cs, id) => {
				expect(completadosDeTarea(completadosDeTarea(cs, id), id)).toEqual(completadosDeTarea(cs, id));
			})
		);
	});

	it('particiona: cada completado pertenece a exactamente una tarea', () => {
		fc.assert(
			fc.property(lista, (cs) => {
				const total = ['t1', 't2', 't3'].reduce((suma, id) => suma + completadosDeTarea(cs, id).length, 0);
				expect(total).toBe(cs.length);
			})
		);
	});
});

describe('completadoMasReciente (propiedades)', () => {
	const noVacia = fc.array(completado, { minLength: 1, maxLength: 20 });

	it('es uno de los completados, ninguno es posterior y da ultimoCompletadoEn', () => {
		fc.assert(
			fc.property(noVacia, (cs) => {
				const masReciente = completadoMasReciente(cs);
				expect(cs).toContain(masReciente);
				for (const c of cs) expect(c.completadoEn.getTime()).toBeLessThanOrEqual(masReciente.completadoEn.getTime());
				expect(ultimoCompletadoEn(cs)).toBe(masReciente.completadoEn.getTime());
			})
		);
	});

	it('el instante no depende del orden de los completados', () => {
		const permutada = noVacia.chain((cs) => fc.tuple(fc.constant(cs), fc.shuffledSubarray(cs, { minLength: cs.length })));
		fc.assert(
			fc.property(permutada, ([cs, permutados]) => {
				expect(ultimoCompletadoEn(permutados)).toBe(ultimoCompletadoEn(cs));
			})
		);
	});
});
