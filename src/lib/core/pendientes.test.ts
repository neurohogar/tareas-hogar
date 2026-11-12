import { describe, expect, it } from 'vitest';
import { filasDePendientes } from './pendientes';
import type { Completado, DiaSemana, Tarea } from './tarea';

const CREADA = new Date(2026, 6, 1);
const AHORA = new Date(2026, 6, 15, 8, 0, 0);
interface Datos {
	titulo?: string;
	creadaEn?: Date;
}
const puntual = (id: string, fechaLimite?: Date, { titulo = id, creadaEn = CREADA }: Datos = {}): Tarea => ({
	id,
	titulo,
	tipo: 'puntual',
	creadaEn,
	...(fechaLimite && { fechaLimite })
});
const relativa = (id: string, { titulo = id, creadaEn = CREADA }: Datos = {}): Tarea => ({
	id,
	titulo,
	tipo: 'periodica',
	recurrencia: { modo: 'relativo', cada: 1, unidad: 'dias' },
	creadaEn
});
/** Semanal creada hoy a las 07:00, antes de su primera ocurrencia: en espera sin completados. */
const semanal = (id: string, dia: DiaSemana, { titulo = id, creadaEn = new Date(2026, 6, 15, 7, 0, 0) }: Datos = {}): Tarea => ({
	id,
	titulo,
	tipo: 'periodica',
	recurrencia: { modo: 'calendario', diasSemana: [dia] },
	creadaEn
});
const completadoDe = (tareaId: string, completadoEn = new Date(2026, 6, 15, 7, 0, 0)): Completado => ({ id: `c-${tareaId}`, tareaId, completadoEn });
const ids = (tareas: Tarea[], completados: Completado[] = [], ahora = AHORA) =>
	filasDePendientes(tareas, completados, ahora).map(({ tarea }) => tarea.id);
const conCompletadas = (tareas: Tarea[], completados: Completado[] = [], ahora = AHORA) =>
	filasDePendientes(tareas, completados, ahora, true).map(({ tarea, completada }) => [tarea.id, completada]);

describe('filasDePendientes (spec §6.1)', () => {
	it('da cada tarea que aparece con su estado y si está completada', () => {
		const enEspera = relativa('r');
		const atrasada = puntual('a', new Date(2026, 6, 10));
		expect(filasDePendientes([enEspera, atrasada], [completadoDe('r')], AHORA, true)).toEqual([
			{ tarea: atrasada, estado: { tipo: 'atrasada' }, completada: false },
			{ tarea: enEspera, estado: { tipo: 'en espera', progreso: 1 / 24 }, completada: true }
		]);
	});

	describe('Mostrar completadas apagado (el valor inicial)', () => {
		it('deja afuera las puntuales completadas', () => {
			const sinHacer = puntual('s');
			expect(filasDePendientes([puntual('h'), sinHacer], [completadoDe('h')], AHORA)).toEqual([
				{ tarea: sinHacer, estado: { tipo: 'pendiente' }, completada: false }
			]);
		});

		it('deja afuera las periódicas en espera con completados', () => {
			expect(ids([relativa('r'), puntual('s')], [completadoDe('r')])).toEqual(['s']);
		});

		it('muestra la periódica pendiente con completados y la semanal en espera sin completados', () => {
			const pendiente = relativa('r');
			expect(ids([semanal('s', 'sábado'), pendiente], [completadoDe('r', new Date(2026, 6, 14, 7, 0, 0))])).toEqual(['r', 's']);
		});

		it('apagado explícito es lo mismo que el valor inicial', () => {
			expect(filasDePendientes([relativa('r')], [completadoDe('r')], AHORA, false)).toEqual([]);
		});
	});

	describe('Mostrar completadas encendido', () => {
		it('las completadas van después de las no completadas, aunque estas estén en espera', () => {
			const completada = puntual('hecha');
			expect(conCompletadas([completada, semanal('s', 'sábado')], [completadoDe('hecha')])).toEqual([
				['s', false],
				['hecha', true]
			]);
		});

		it('las completadas van de la de completadoEn más reciente a la más antigua, sin importar el tipo', () => {
			const completados = [
				completadoDe('vieja', new Date(2026, 6, 13, 9, 0, 0)),
				completadoDe('r', new Date(2026, 6, 15, 7, 0, 0)),
				completadoDe('nueva', new Date(2026, 6, 15, 7, 30, 0))
			];
			expect(conCompletadas([puntual('vieja'), relativa('r'), puntual('nueva')], completados)).toEqual([
				['nueva', true],
				['r', true],
				['vieja', true]
			]);
		});

		it('ordena una completada por su completado más reciente', () => {
			const completados = [
				{ id: 'c1', tareaId: 'dos', completadoEn: new Date(2026, 6, 15, 7, 0, 0) },
				{ id: 'c2', tareaId: 'dos', completadoEn: new Date(2026, 6, 10, 7, 0, 0) },
				completadoDe('una', new Date(2026, 6, 14, 7, 0, 0))
			];
			expect(ids([puntual('una'), puntual('dos')], completados, AHORA)).toEqual([]);
			expect(conCompletadas([puntual('una'), puntual('dos')], completados)).toEqual([
				['dos', true],
				['una', true]
			]);
		});

		it('si empata completadoEn: creadaEn más antigua, después título en español, después id', () => {
			const momento = new Date(2026, 6, 15, 7, 0, 0);
			const tareas = [
				puntual('t3', undefined, { titulo: 'Ñandú' }),
				puntual('t2', undefined, { titulo: 'Nube' }),
				puntual('t1', undefined, { titulo: 'nube' }),
				puntual('t0', undefined, { titulo: 'Zeta', creadaEn: new Date(2020, 0, 1) })
			];
			const completados = tareas.map(({ id }) => ({ id: `c-${id}`, tareaId: id, completadoEn: momento }));
			expect(conCompletadas(tareas, completados).map(([id]) => id)).toEqual(['t0', 't1', 't2', 't3']);
		});
	});

	it('sin tareas no hay filas', () => {
		expect(filasDePendientes([], [], AHORA)).toEqual([]);
	});

	it('no modifica la lista recibida', () => {
		const tareas = [relativa('r'), puntual('a', new Date(2026, 6, 10))];
		const copia = [...tareas];
		filasDePendientes(tareas, [completadoDe('r')], AHORA);
		expect(tareas).toEqual(copia);
	});

	describe('orden por urgencia', () => {
		it('agrupa atrasada, pendiente y en espera, en ese orden', () => {
			const enEspera = semanal('espera', 'sábado');
			const pendiente = puntual('pendiente', new Date(2026, 6, 15));
			const atrasada = puntual('atrasada', new Date(2026, 6, 14));
			expect(ids([enEspera, pendiente, atrasada])).toEqual(['atrasada', 'pendiente', 'espera']);
		});

		it('manda el grupo aunque el instante de otro grupo sea anterior', () => {
			// La relativa está atrasada recién desde las 07:00 de hoy; la puntual, pendiente desde las 00:00.
			const relativaAtrasada = relativa('r');
			const pendiente = puntual('p', new Date(2026, 6, 15));
			expect(ids([pendiente, relativaAtrasada], [completadoDe('r', new Date(2026, 6, 13, 7, 0, 0))])).toEqual(['r', 'p']);
		});

		it('atrasadas: primero la que lleva más tiempo atrasada', () => {
			// Puntual atrasada desde el 12 a las 00:00; relativa desde el 11 a las 20:00 (V + intervalo).
			const p = puntual('p', new Date(2026, 6, 11));
			const r = relativa('r');
			expect(ids([p, r], [completadoDe('r', new Date(2026, 6, 9, 20, 0, 0))])).toEqual(['r', 'p']);
			expect(ids([p, r], [completadoDe('r', new Date(2026, 6, 10, 0, 0, 1))])).toEqual(['p', 'r']);
		});

		it('pendientes: primero la que está pendiente desde antes', () => {
			const p = puntual('p', new Date(2026, 6, 15));
			const r = relativa('r');
			// V = el 15 a las 00:00:01, después de la fecha límite.
			expect(ids([r, p], [completadoDe('r', new Date(2026, 6, 14, 0, 0, 1))])).toEqual(['p', 'r']);
			// V = el 14 a las 23:59:59, antes.
			expect(ids([p, r], [completadoDe('r', new Date(2026, 6, 13, 23, 59, 59))])).toEqual(['r', 'p']);
		});

		it('en espera: primero la que vuelve antes', () => {
			const pronto = semanal('pronto', 'jueves', { creadaEn: new Date(2026, 6, 15, 7, 30, 0) });
			const tarde = semanal('tarde', 'sábado');
			expect(ids([tarde, pronto])).toEqual(['pronto', 'tarde']);
		});

		it('las puntuales sin fecha límite van al final del grupo pendiente, por creadaEn', () => {
			const vieja = puntual('vieja', undefined, { creadaEn: new Date(2020, 0, 1) });
			const nueva = puntual('nueva', undefined, { creadaEn: new Date(2020, 0, 2) });
			const conFecha = puntual('conFecha', new Date(2026, 11, 31));
			const enEspera = semanal('espera', 'sábado');
			expect(ids([nueva, enEspera, vieja, conFecha])).toEqual(['conFecha', 'vieja', 'nueva', 'espera']);
		});

		it('si empata el instante, primero la de creadaEn más antigua', () => {
			const limite = new Date(2026, 6, 20);
			const antes = puntual('b', limite, { titulo: 'Zeta', creadaEn: new Date(2026, 6, 1, 8, 0, 0) });
			const despues = puntual('a', limite, { titulo: 'Alfa', creadaEn: new Date(2026, 6, 1, 8, 0, 1) });
			expect(ids([despues, antes])).toEqual(['b', 'a']);
		});

		it('si también empata creadaEn, por título en orden alfabético en español', () => {
			const nube = puntual('z', undefined, { titulo: 'Nube' });
			const nandu = puntual('a', undefined, { titulo: 'Ñandú' });
			expect(ids([nandu, nube])).toEqual(['z', 'a']);
		});

		it('si también empata el título, por id', () => {
			const segunda = puntual('t2', undefined, { titulo: 'Barrer' });
			const primera = puntual('t1', undefined, { titulo: 'barrer' });
			expect(ids([segunda, primera])).toEqual(['t1', 't2']);
			expect(ids([primera, segunda])).toEqual(['t1', 't2']);
		});
	});
});

describe('filasDePendientes con pausadas y reanudadas (spec §5.8, §6.1)', () => {
	const pausada = (tarea: Tarea): Tarea => ({ ...tarea, pausada: true }) as Tarea;
	const conPausadas = (tareas: Tarea[], completados: Completado[] = [], mostrarCompletadas = false) =>
		filasDePendientes(tareas, completados, AHORA, mostrarCompletadas, true).map(({ tarea, estado }) => [tarea.id, estado.tipo]);

	it('sin Mostrar pausadas, las pausadas no se ven', () => {
		expect(ids([pausada(relativa('p')), relativa('r')])).toEqual(['r']);
		expect(filasDePendientes([pausada(relativa('p'))], [], AHORA, true).map(({ tarea }) => tarea.id)).toEqual([]);
	});

	it('con Mostrar pausadas, van al final por título, sin importar urgencia ni creadaEn, sin estado y no completadas', () => {
		const tareas = [
			pausada(relativa('b', { titulo: 'Ñandú' })),
			pausada(relativa('a', { titulo: 'Árbol', creadaEn: new Date(2026, 6, 10) })),
			pausada(relativa('c', { titulo: 'nube' })),
			puntual('x', new Date(2026, 6, 10))
		];

		expect(conPausadas(tareas)).toEqual([
			['x', 'atrasada'],
			['a', 'pausada'],
			['c', 'pausada'],
			['b', 'pausada']
		]);
		expect(filasDePendientes(tareas, [], AHORA, false, true).at(-1)).toEqual({ tarea: tareas[0], estado: { tipo: 'pausada' }, completada: false });
	});

	it('las pausadas van después de las completadas', () => {
		expect(conPausadas([pausada(relativa('p')), relativa('r')], [completadoDe('r'), completadoDe('p')], true)).toEqual([
			['r', 'en espera'],
			['p', 'pausada']
		]);
	});

	it('una de calendario reanudada en espera, con completados solo de antes de reanudar, no está completada', () => {
		const reanudada = { ...semanal('s', 'jueves'), reanudadaEn: new Date(2026, 6, 15, 7, 30, 0) } as Tarea;

		expect(conCompletadas([reanudada], [completadoDe('s')])).toEqual([['s', false]]);
	});

	it('una relativa reanudada está pendiente desde reanudadaEn; si empata, desempata su creadaEn real', () => {
		const reanudadaEn = new Date(2026, 6, 10);
		const reanudada = { ...relativa('z', { creadaEn: new Date(2026, 5, 1) }), reanudadaEn } as Tarea;
		const anterior = relativa('m', { creadaEn: new Date(2026, 6, 5) });
		const empata = relativa('a', { creadaEn: reanudadaEn });

		expect(ids([reanudada, anterior])).toEqual(['m', 'z']);
		expect(ids([empata, reanudada])).toEqual(['z', 'a']);
	});
});

describe('filasDePendientes con pospuestas (spec §5.9, §6.1)', () => {
	const DESDE = new Date(2026, 6, 15, 7, 30, 0);
	const pospuestaHasta = (hasta: Date) => ({ pospuesta: { desde: DESDE, hasta } });

	it('una pospuesta con un completado de hoy se ve con Mostrar completadas apagado', () => {
		const tarea: Tarea = {
			id: 'r',
			titulo: 'r',
			tipo: 'periodica',
			recurrencia: { modo: 'relativo', cada: 4, unidad: 'horas' },
			creadaEn: CREADA,
			...pospuestaHasta(new Date(2026, 6, 15, 10, 0, 0))
		};
		const deHoy: Completado = { id: 'c', tareaId: 'r', completadoEn: new Date(2026, 6, 15, 3, 0, 0) };

		expect(filasDePendientes([tarea], [deHoy], AHORA).map(({ completada }) => completada)).toStrictEqual([false]);
	});

	it('las pospuestas van en el grupo en espera, ordenadas por hasta', () => {
		const tarde = { ...puntual('tarde'), ...pospuestaHasta(new Date(2026, 6, 15, 12, 0, 0)) };
		const temprano = { ...puntual('temprano', new Date(2026, 6, 10)), ...pospuestaHasta(new Date(2026, 6, 15, 9, 0, 0)) };
		const titulos = filasDePendientes([tarde, temprano, puntual('libre')], [], AHORA).map(({ tarea }) => tarea.titulo);

		expect(titulos).toStrictEqual(['libre', 'temprano', 'tarde']);
	});
});
