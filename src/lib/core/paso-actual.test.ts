import { describe, expect, it } from 'vitest';
import { completar } from './completados';
import {
	accionDeHecho,
	botonesDePaso,
	cambioAlBorrarCompletado,
	cambioAlCompletar,
	cambioDePasoAnterior,
	textoDelPaso
} from './paso-actual';
import { filasDePendientes } from './pendientes';
import type { Completado, TareaPeriodica, TareaPuntual } from './tarea';

const CREADA = new Date(2026, 6, 1, 8, 0, 0);
const AHORA = new Date(2026, 6, 15, 8, 0, 0);
const TRES: TareaPuntual = { id: 't1', titulo: 'Ropa', tipo: 'puntual', creadaEn: CREADA, primerPaso: 'Separar', pasos: ['Lavar', 'Tender'] };
const { pasos: _, ...UN_PASO } = TRES;
const enPaso = (pasoActual: number): TareaPuntual => ({ ...TRES, pasoActual });
const RELATIVA: TareaPeriodica = {
	id: 't2',
	titulo: 'Regar',
	tipo: 'periodica',
	recurrencia: { modo: 'relativo', cada: 1, unidad: 'dias' },
	creadaEn: CREADA,
	primerPaso: 'Llenar',
	pasos: ['Regar']
};
const completadoDe = (tareaId: string, completadoEn: Date, pasoAlCompletar?: number): Completado => ({
	id: `c-${completadoEn.getTime()}`,
	tareaId,
	completadoEn,
	...(pasoAlCompletar !== undefined && { pasoAlCompletar })
});

describe('textoDelPaso (spec §6.1)', () => {
	it('en el paso 1, «Primer paso: …»', () => {
		expect(textoDelPaso(TRES, { tipo: 'pendiente' })).toBe('Primer paso: Separar');
	});

	it('en otro paso, «Paso: …» con el texto de ese paso, sin número ni total', () => {
		expect(textoDelPaso(enPaso(2), { tipo: 'pendiente' })).toBe('Paso: Lavar');
		expect(textoDelPaso(enPaso(3), { tipo: 'atrasada' })).toBe('Paso: Tender');
	});

	it('con menos pasos que pasoActual, el último', () => {
		expect(textoDelPaso(enPaso(9), { tipo: 'pendiente' })).toBe('Paso: Tender');
	});

	it('una tarea de un solo paso, «Primer paso: …» aunque tenga un pasoActual viejo', () => {
		expect(textoDelPaso({ ...UN_PASO, pasoActual: 3 }, { tipo: 'pendiente' })).toBe('Primer paso: Separar');
	});

	it.each(['en espera', 'completada', 'pausada'] as const)('una fila %s no la muestra', (tipo) => {
		expect(textoDelPaso(enPaso(2), { tipo })).toBeUndefined();
	});

	it('sin primer paso, no hay línea', () => {
		expect(textoDelPaso({ ...TRES, primerPaso: undefined }, { tipo: 'pendiente' })).toBeUndefined();
	});

	it('no lo corta, aunque sea largo', () => {
		const largo = 'x'.repeat(500);

		expect(textoDelPaso({ ...enPaso(2), pasos: [largo] }, { tipo: 'pendiente' })).toBe(`Paso: ${largo}`);
	});
});

describe('accionDeHecho (spec §4.1 y §6.1)', () => {
	it('en un paso que no es el último, pasa al siguiente', () => {
		expect(accionDeHecho(TRES, [], AHORA)).toStrictEqual({ tipo: 'avanzar', cambio: { pasoActual: 2 } });
		expect(accionDeHecho(enPaso(2), [], AHORA)).toStrictEqual({ tipo: 'avanzar', cambio: { pasoActual: 3 } });
	});

	it('en el último paso completa la tarea', () => {
		expect(accionDeHecho(enPaso(3), [], AHORA)).toStrictEqual({ tipo: 'completar' });
	});

	it('con menos pasos que pasoActual actúa sobre el último: completa', () => {
		expect(accionDeHecho(enPaso(8), [], AHORA)).toStrictEqual({ tipo: 'completar' });
	});

	it('un pasoActual 0 de un dato viejo es el paso 1: pasa al 2', () => {
		expect(accionDeHecho(enPaso(0), [], AHORA)).toStrictEqual({ tipo: 'avanzar', cambio: { pasoActual: 2 } });
	});

	it('en el último paso, fuera de la ventana del horario, nada (como el checkbox)', () => {
		const conHorario = { ...enPaso(3), horario: [{ desde: '18:00', hasta: '20:00' }] };

		expect(accionDeHecho(conHorario, [], AHORA)).toStrictEqual({ tipo: 'ninguna' });
		expect(accionDeHecho(conHorario, [], new Date(2026, 6, 15, 19, 0, 0))).toStrictEqual({ tipo: 'completar' });
	});

	it('fuera de la ventana, en un paso que no es el último, pasa igual', () => {
		const conHorario = { ...TRES, horario: [{ desde: '18:00', hasta: '20:00' }] };

		expect(accionDeHecho(conHorario, [], AHORA)).toStrictEqual({ tipo: 'avanzar', cambio: { pasoActual: 2 } });
	});

	it('en el último paso de una completada no completa de nuevo', () => {
		expect(accionDeHecho(enPaso(3), [completadoDe('t1', CREADA)], AHORA)).toStrictEqual({ tipo: 'ninguna' });
	});

	it('una tarea de un solo paso no tiene «Hecho»', () => {
		expect(accionDeHecho(UN_PASO, [], AHORA)).toStrictEqual({ tipo: 'ninguna' });
	});

	it('dos «Hecho» desde el mismo paso escriben el mismo paso siguiente', () => {
		expect(accionDeHecho(TRES, [], AHORA)).toStrictEqual(accionDeHecho(TRES, [], AHORA));
	});
});

describe('cambioDePasoAnterior (spec §4.1 y §6.1)', () => {
	it('vuelve al paso de antes', () => {
		expect(cambioDePasoAnterior(enPaso(3))).toStrictEqual({ pasoActual: 2 });
	});

	it('al paso 1 quita el campo (sin el campo, el paso 1)', () => {
		expect(cambioDePasoAnterior(enPaso(2))).toStrictEqual({ pasoActual: null });
	});

	it('en el paso 1 no pasa del primero: no cambia nada', () => {
		expect(cambioDePasoAnterior(TRES)).toStrictEqual({});
	});

	it('con menos pasos que pasoActual, vuelve al de antes del último', () => {
		expect(cambioDePasoAnterior(enPaso(9))).toStrictEqual({ pasoActual: 2 });
	});
});

describe('botonesDePaso (spec §6.1)', () => {
	it('en el paso 1: «Hecho» y no «Paso anterior»', () => {
		expect(botonesDePaso(TRES, { tipo: 'pendiente' }, [], AHORA)).toStrictEqual({ pasoAnterior: false, hechoHabilitado: true });
	});

	it('en otro paso: «Paso anterior» y «Hecho»', () => {
		expect(botonesDePaso(enPaso(2), { tipo: 'atrasada' }, [], AHORA)).toStrictEqual({ pasoAnterior: true, hechoHabilitado: true });
	});

	it('«Hecho» del último paso, deshabilitado si el checkbox lo está; el de otro paso, no', () => {
		const horario = [{ desde: '18:00', hasta: '20:00' }];

		expect(botonesDePaso({ ...enPaso(3), horario }, { tipo: 'atrasada' }, [], AHORA)).toStrictEqual({ pasoAnterior: true, hechoHabilitado: false });
		expect(botonesDePaso({ ...enPaso(2), horario }, { tipo: 'atrasada' }, [], AHORA)).toStrictEqual({ pasoAnterior: true, hechoHabilitado: true });
	});

	it('una tarea de un solo paso no tiene botones', () => {
		expect(botonesDePaso(UN_PASO, { tipo: 'pendiente' }, [], AHORA)).toBeUndefined();
	});

	it.each(['en espera', 'completada', 'pausada'] as const)('una fila %s no los muestra', (tipo) => {
		expect(botonesDePaso(enPaso(2), { tipo }, [], AHORA)).toBeUndefined();
	});
});

describe('completar y cambioAlCompletar (spec §4.1, Completar; §4.4)', () => {
	it('el completado de una tarea de dos pasos o más guarda el paso en que iba', () => {
		expect(completar(enPaso(2), [], 'c', AHORA)).toStrictEqual({ id: 'c', tareaId: 't1', completadoEn: AHORA, pasoAlCompletar: 2 });
		expect(completar(TRES, [], 'c', AHORA)).toMatchObject({ pasoAlCompletar: 1 });
	});

	it('con menos pasos que pasoActual, guarda el último', () => {
		expect(completar(enPaso(9), [], 'c', AHORA)).toMatchObject({ pasoAlCompletar: 3 });
	});

	it('una periódica también lo guarda', () => {
		expect(completar({ ...RELATIVA, pasoActual: 2 }, [], 'c', AHORA)).toMatchObject({ pasoAlCompletar: 2 });
	});

	it('en una tarea de un solo paso el completado no guarda paso', () => {
		expect(completar({ ...UN_PASO, pasoActual: 2 }, [], 'c', AHORA)).toStrictEqual({ id: 'c', tareaId: 't1', completadoEn: AHORA });
	});

	it('completar vuelve al paso 1: quita pasoActual', () => {
		expect(cambioAlCompletar(enPaso(3))).toStrictEqual({ pasoActual: null });
	});

	it('si ya va en el paso 1 sin el campo, no cambia nada', () => {
		expect(cambioAlCompletar(TRES)).toStrictEqual({});
	});
});

describe('cambioAlBorrarCompletado (spec §4.1, Deshacer; §5.4)', () => {
	const anterior = completadoDe('t1', new Date(2026, 6, 10, 8, 0, 0), 1);
	const reciente = completadoDe('t1', new Date(2026, 6, 14, 8, 0, 0), 2);
	const deOtra = completadoDe('t9', new Date(2026, 6, 14, 9, 0, 0), 3);
	const completados = [anterior, reciente, deOtra];

	it('borrar el más reciente devuelve pasoActual a su pasoAlCompletar', () => {
		expect(cambioAlBorrarCompletado(TRES, completados, reciente)).toStrictEqual({ pasoActual: 2 });
	});

	it('vale también si los completados ya no lo incluyen', () => {
		expect(cambioAlBorrarCompletado(TRES, [anterior], reciente)).toStrictEqual({ pasoActual: 2 });
	});

	it('borrar uno que no es el más reciente no cambia el avance', () => {
		expect(cambioAlBorrarCompletado(enPaso(3), completados, anterior)).toStrictEqual({});
	});

	it('al paso 1 quita el campo', () => {
		expect(cambioAlBorrarCompletado(enPaso(3), [completadoDe('t1', AHORA, 1)], completadoDe('t1', AHORA, 1))).toStrictEqual({ pasoActual: null });
	});

	it('con el tope del último paso', () => {
		const delQuinto = completadoDe('t1', AHORA, 5);

		expect(cambioAlBorrarCompletado(TRES, [delQuinto], delQuinto)).toStrictEqual({ pasoActual: 3 });
	});

	it('un pasoAlCompletar 0 de un dato viejo es el paso 1', () => {
		const delCero = completadoDe('t1', AHORA, 0);

		expect(cambioAlBorrarCompletado(enPaso(2), [delCero], delCero)).toStrictEqual({ pasoActual: null });
	});

	it('un completado sin pasoAlCompletar no cambia el avance', () => {
		const sinPaso = completadoDe('t1', AHORA);

		expect(cambioAlBorrarCompletado(enPaso(2), [sinPaso], sinPaso)).toStrictEqual({});
	});

	it('una tarea que ahora tiene un solo paso no cambia', () => {
		expect(cambioAlBorrarCompletado({ ...UN_PASO, pasoActual: 2 }, completados, reciente)).toStrictEqual({});
	});

	it('si ya va en ese paso, no cambia nada', () => {
		expect(cambioAlBorrarCompletado(enPaso(2), completados, reciente)).toStrictEqual({});
	});
});

describe('filasDePendientes con pasos (spec §6.1)', () => {
	it('la fila lleva la línea del paso y sus botones', () => {
		expect(filasDePendientes([enPaso(2)], [], AHORA)[0]).toMatchObject({
			textoDePrimerPaso: 'Paso: Lavar',
			botonesDePaso: { pasoAnterior: true, hechoHabilitado: true }
		});
	});

	it('una tarea de un solo paso lleva la línea y no botones', () => {
		const [fila] = filasDePendientes([UN_PASO], [], AHORA);

		expect(fila).toMatchObject({ textoDePrimerPaso: 'Primer paso: Separar' });
		expect('botonesDePaso' in fila).toBe(false);
	});

	it('una completada (con Mostrar completadas) y una pausada no llevan línea ni botones', () => {
		const filas = filasDePendientes([enPaso(2), { ...RELATIVA, pausada: true }], [completadoDe('t1', CREADA)], AHORA, true, true);

		for (const fila of filas) {
			expect('textoDePrimerPaso' in fila).toBe(false);
			expect('botonesDePaso' in fila).toBe(false);
		}
	});

	it('el avance no cambia el orden de la lista', () => {
		const orden = (tareas: (TareaPuntual | TareaPeriodica)[]) => filasDePendientes(tareas, [], AHORA).map(({ tarea }) => tarea.id);

		expect(orden([enPaso(3), RELATIVA])).toStrictEqual(orden([TRES, { ...RELATIVA, pasoActual: 2 }]));
	});
});
