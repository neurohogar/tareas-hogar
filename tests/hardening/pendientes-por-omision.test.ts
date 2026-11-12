import { describe, expect, it } from 'vitest';
import { filasDePendientes } from '../../src/lib/core/pendientes';
import type { Tarea } from '../../src/lib/core/tarea';

const AHORA = new Date(2026, 6, 15, 8, 0, 0);
const puntual = (id: string, extra: object = {}): Tarea =>
	({ id, titulo: id, tipo: 'puntual', creadaEn: new Date(2026, 6, 1), ...extra }) as Tarea;

describe('filasDePendientes: por omisión no muestra completadas ni pausadas', () => {
	it('sin los flags, solo aparece la tarea pendiente', () => {
		const tareas = [puntual('a'), puntual('c'), { ...puntual('p'), tipo: 'periodica', recurrencia: { modo: 'relativo', cada: 1, unidad: 'dias' }, pausada: true } as Tarea];
		const completados = [{ id: 'x', tareaId: 'c', completadoEn: new Date(2026, 6, 14) }];
		expect(filasDePendientes(tareas, completados, AHORA).map(({ tarea }) => tarea.id)).toEqual(['a']);
	});
});
