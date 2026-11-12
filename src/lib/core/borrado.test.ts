import { describe, expect, it } from 'vitest';
import type { Anotacion } from './anotacion';
import { anotacionesHuerfanas, borrado, completadosHuerfanos, existeTarea } from './borrado';
import type { Completado, TareaPuntual } from './tarea';

const tarea = (id: string): TareaPuntual => ({ id, titulo: id, tipo: 'puntual', creadaEn: new Date(2026, 6, 1) });
const completado = (id: string, tareaId: string): Completado => ({ id, tareaId, completadoEn: new Date(2026, 6, 2) });
const anotacion = (id: string, tareaId?: string): Anotacion => ({
	id,
	sentido: 'Me sirvió',
	anotadaEn: new Date(2026, 6, 2),
	pantalla: 'Pendientes',
	...(tareaId === undefined ? {} : { tareaId })
});

describe('borrado', () => {
	it('borra la tarea y todos sus completados, y solo los suyos', () => {
		const completados = [completado('c1', 'regar'), completado('c2', 'pagar'), completado('c3', 'regar')];

		expect(borrado('regar', completados, [])).toStrictEqual({ tareaId: 'regar', completadoIds: ['c1', 'c3'], anotacionIds: [] });
	});

	it('borra también todas sus anotaciones, y solo las suyas: no las de otra tarea ni las sin tarea', () => {
		const anotaciones = [anotacion('a1', 'regar'), anotacion('a2', 'pagar'), anotacion('a3'), anotacion('a4', 'regar')];

		expect(borrado('regar', [], anotaciones).anotacionIds).toStrictEqual(['a1', 'a4']);
	});

	it('una tarea nunca completada se borra sola', () => {
		expect(borrado('regar', [completado('c2', 'pagar')], [])).toStrictEqual({ tareaId: 'regar', completadoIds: [], anotacionIds: [] });
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

describe('anotacionesHuerfanas', () => {
	it('son las anotaciones cuya tarea ya no existe; las sin tarea no lo son', () => {
		const huerfana = anotacion('a2', 'borrada');
		const anotaciones = [anotacion('a1', 'regar'), huerfana, anotacion('a3')];

		expect(anotacionesHuerfanas([tarea('regar')], anotaciones)).toStrictEqual([huerfana]);
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
