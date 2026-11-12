import { describe, expect, it } from 'vitest';
import { completadoMasReciente } from '../../src/lib/core/completados';
import { filasDePendientes } from '../../src/lib/core/pendientes';
import type { Completado, Tarea } from '../../src/lib/core/tarea';

const completado = (id: string, completadoEn: Date): Completado => ({ id, tareaId: 't', completadoEn });

describe('completadoMasReciente: empate', () => {
	it('con el mismo completadoEn devuelve el primero', () => {
		const momento = new Date(2026, 6, 15, 10, 0);
		const a = completado('a', momento);
		const b = completado('b', new Date(momento.getTime()));
		expect(completadoMasReciente([a, b])).toBe(a);
		expect(completadoMasReciente([b, a])).toBe(b);
	});
});

describe('filasDePendientes: Mostrar completadas apagado por defecto', () => {
	it('sin el cuarto argumento no incluye las completadas', () => {
		const tarea: Tarea = { id: 't', titulo: 't', tipo: 'puntual', creadaEn: new Date(2026, 0, 1) };
		const ahora = new Date(2026, 6, 15, 12, 0);
		const filas = filasDePendientes([tarea], [completado('c', new Date(2026, 6, 15, 10, 0))], ahora);
		expect(filas).toEqual([]);
	});
});
