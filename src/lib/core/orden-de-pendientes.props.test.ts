import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { EstadoEnPendientes } from './estado';
import { compararCompletadas, compararPorUrgencia, type FilaCompletada, type FilaPorOrdenar } from './orden-de-pendientes';

/** Pocos valores por campo, para que los desempates se ejerciten. */
const momento = fc.option(fc.integer({ min: 0, max: 3 }).map((n) => new Date(n * 86_400_000)), { nil: undefined });
const estado = fc.constantFrom<EstadoEnPendientes>({ tipo: 'atrasada' }, { tipo: 'pendiente' }, { tipo: 'en espera', progreso: 0.5 });
const fila = fc
	.record({
		id: fc.constantFrom('a', 'b', 'c', 'A', 'á'),
		titulo: fc.constantFrom('Barrer', 'barrer', 'Ñandú', 'Nube', 'Árbol'),
		creadaEn: fc.integer({ min: 0, max: 2 }).map((n) => new Date(n)),
		estado,
		instante: momento
	})
	.map(({ id, titulo, creadaEn, estado, instante }): FilaPorOrdenar => ({ tarea: { id, titulo, creadaEn, tipo: 'puntual' }, estado, instante }));
const signo = (a: FilaPorOrdenar, b: FilaPorOrdenar) => Math.sign(compararPorUrgencia(a, b));

describe('compararPorUrgencia (propiedades)', () => {
	it('es un orden total: antisimétrica, transitiva y solo empata una tarea consigo misma', () => {
		fc.assert(
			fc.property(fila, fila, fila, (a, b, c) => {
				expect(compararPorUrgencia(a, a)).toBe(0);
				expect(signo(a, b)).toBe(-signo(b, a) || 0);
				if (signo(a, b) <= 0 && signo(b, c) <= 0) expect(signo(a, c)).toBeLessThanOrEqual(0);
				if (signo(a, b) === 0) expect(a.tarea.id).toBe(b.tarea.id);
			})
		);
	});

	it('el grupo manda: atrasada antes que pendiente antes que en espera', () => {
		const rango = { atrasada: 0, pendiente: 1, 'en espera': 2 };
		fc.assert(
			fc.property(fila, fila, (a, b) => {
				fc.pre(a.estado.tipo !== b.estado.tipo);
				expect(signo(a, b)).toBe(Math.sign(rango[a.estado.tipo] - rango[b.estado.tipo]));
			})
		);
	});

	it('dentro del grupo, el instante más antiguo primero y sin instante al final', () => {
		fc.assert(
			fc.property(fila, fila, (a, b) => {
				fc.pre(a.estado.tipo === b.estado.tipo && a.instante?.getTime() !== b.instante?.getTime());
				const clave = (f: FilaPorOrdenar) => f.instante?.getTime() ?? Infinity;
				expect(signo(a, b)).toBe(Math.sign(clave(a) - clave(b)));
			})
		);
	});
});

const completada = fc
	.record({
		id: fc.constantFrom('a', 'b', 'c', 'A', 'á'),
		titulo: fc.constantFrom('Barrer', 'barrer', 'Ñandú', 'Nube', 'Árbol'),
		creadaEn: fc.integer({ min: 0, max: 2 }).map((n) => new Date(n)),
		ultimoCompletadoEn: fc.integer({ min: 0, max: 3 })
	})
	.map(({ id, titulo, creadaEn, ultimoCompletadoEn }): FilaCompletada => ({
		tarea: { id, titulo, creadaEn, tipo: 'puntual' },
		estado: { tipo: 'completada' },
		ultimoCompletadoEn
	}));
const signoCompletadas = (a: FilaCompletada, b: FilaCompletada) => Math.sign(compararCompletadas(a, b));

describe('compararCompletadas (propiedades)', () => {
	it('es un orden total: antisimétrica, transitiva y solo empata una tarea consigo misma', () => {
		fc.assert(
			fc.property(completada, completada, completada, (a, b, c) => {
				expect(compararCompletadas(a, a)).toBe(0);
				expect(signoCompletadas(a, b)).toBe(-signoCompletadas(b, a) || 0);
				if (signoCompletadas(a, b) <= 0 && signoCompletadas(b, c) <= 0) expect(signoCompletadas(a, c)).toBeLessThanOrEqual(0);
				if (signoCompletadas(a, b) === 0) expect(a.tarea.id).toBe(b.tarea.id);
			})
		);
	});

	it('el completado más reciente primero', () => {
		fc.assert(
			fc.property(completada, completada, (a, b) => {
				fc.pre(a.ultimoCompletadoEn !== b.ultimoCompletadoEn);
				expect(signoCompletadas(a, b)).toBe(Math.sign(b.ultimoCompletadoEn - a.ultimoCompletadoEn));
			})
		);
	});

	it('si empatan, desempata igual que compararPorUrgencia', () => {
		const comoUrgente = (f: FilaCompletada): FilaPorOrdenar => ({ tarea: f.tarea, estado: { tipo: 'pendiente' }, instante: undefined });
		fc.assert(
			fc.property(completada, completada, (a, b) => {
				fc.pre(a.ultimoCompletadoEn === b.ultimoCompletadoEn);
				expect(signoCompletadas(a, b)).toBe(Math.sign(compararPorUrgencia(comoUrgente(a), comoUrgente(b))));
			})
		);
	});
});
