import { describe, expect, it } from 'vitest';
import { historial } from '../../src/lib/core/historial';
import type { Completado, Tarea } from '../../src/lib/core/tarea';

const tarea = (id: string): Tarea => ({ id, titulo: id, tipo: 'puntual', creadaEn: new Date(2026, 0, 1) });
const completado = (id: string, completadoEn: Date): Completado => ({ id, tareaId: 't', completadoEn });
const ahora = new Date(2026, 6, 15, 12, 0, 0);

const permutaciones = <T>(xs: T[]): T[][] =>
	xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permutaciones([...xs.slice(0, i), ...xs.slice(i + 1)]).map((resto) => [x, ...resto]));

describe('historial: orden y agrupación estables', () => {
	it('con el mismo completadoEn el orden es por id, sea cual sea el orden de entrada', () => {
		const momento = new Date(2026, 6, 15, 10, 0);
		const cs = ['c1', 'c2', 'c3'].map((id) => completado(id, momento));
		for (const entrada of permutaciones(cs)) {
			const ids = historial([tarea('t')], entrada, ahora).flatMap((g) => g.entradas.map((e) => e.completado.id));
			expect(ids).toEqual(['c1', 'c2', 'c3']);
		}
	});

	it('todas las entradas de un día quedan en un solo grupo aunque haya días anteriores', () => {
		const cs = [
			completado('a', new Date(2026, 6, 15, 10, 0)),
			completado('b', new Date(2026, 6, 14, 10, 0)),
			completado('c', new Date(2026, 6, 14, 9, 0)),
			completado('d', new Date(2026, 6, 14, 8, 0))
		];
		const grupos = historial([tarea('t')], cs, ahora);
		expect(grupos.map((g) => [g.encabezado, g.entradas.length])).toEqual([
			['Hoy', 1],
			['Ayer', 3]
		]);
	});
});
