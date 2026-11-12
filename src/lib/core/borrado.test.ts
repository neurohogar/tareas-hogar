import { describe, expect, it } from 'vitest';
import { borrado, completadosHuerfanos, existeTarea } from './borrado';
import type { Completado, TareaPuntual } from './tarea';

const tarea = (id: string): TareaPuntual => ({ id, titulo: id, tipo: 'puntual', creadaEn: new Date(2026, 6, 1) });
const completado = (id: string, tareaId: string): Completado => ({ id, tareaId, completadoEn: new Date(2026, 6, 2) });

describe('borrado', () => {
	it('borra la tarea y todos sus completados, y solo los suyos', () => {
		const completados = [completado('c1', 'regar'), completado('c2', 'pagar'), completado('c3', 'regar')];

		expect(borrado('regar', completados)).toStrictEqual({ tareaId: 'regar', completadoIds: ['c1', 'c3'] });
	});

	it('una tarea nunca completada se borra sola', () => {
		expect(borrado('regar', [completado('c2', 'pagar')])).toStrictEqual({ tareaId: 'regar', completadoIds: [] });
	});
});

describe('completadosHuerfanos', () => {
	it('son los completados cuya tarea ya no existe', () => {
		const huerfano = completado('c2', 'borrada');
		const completados = [completado('c1', 'regar'), huerfano, completado('c3', 'pagar')];

		expect(completadosHuerfanos([tarea('regar'), tarea('pagar')], completados)).toStrictEqual([huerfano]);
	});

	it('sin tareas, todos los completados son huérfanos', () => {
		const completados = [completado('c1', 'regar')];

		expect(completadosHuerfanos([], completados)).toStrictEqual(completados);
	});
});

describe('existeTarea', () => {
	it('existe si alguna tarea tiene ese id', () => {
		expect(existeTarea([tarea('pagar'), tarea('regar')], 'regar')).toBe(true);
	});

	it('no existe si ninguna lo tiene', () => {
		expect(existeTarea([tarea('pagar')], 'regar')).toBe(false);
	});
});
