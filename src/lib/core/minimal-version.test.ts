import { describe, expect, it } from 'vitest';
import { avisoAlCompletar, textoDelAviso } from './notice';
import { hayCambios } from './unsaved-changes';
import { accionDelCheckbox } from './checkbox';
import { completar } from './completions';
import { crearPeriodicaCalendario } from './create-recurring-calendar';
import { crearPeriodicaRelativa } from './create-recurring-relative';
import { crearPuntual } from './create-one-off';
import { crearSegunDatos, datosDeTarea, type DatosDeTarea } from './task-data';
import { aplicarCambio, tareaDesdeDocumento, type DocumentoDeTarea } from './task-document';
import { editar } from './editing';
import { estadoDeTarea } from './task-status';
import { historial } from './history';
import { cambioAlBorrarCompletado, cambioAlCompletar } from './current-step';
import { filasDePendientes } from './pending';
import type { Completado, TareaPeriodica, TareaPuntual } from './task';
import { hacerLaMinima, lineaDeMinima } from './minimal-version';

const CREADA = new Date(2026, 10, 1, 8, 0, 0);
const AHORA = new Date(2026, 10, 13, 10, 0, 0);
const MINIMA = 'Solo el inodoro';
const PUNTUAL: TareaPuntual = { id: 't1', titulo: 'Baño', tipo: 'puntual', creadaEn: CREADA, versionMinima: MINIMA };
const RELATIVA: TareaPeriodica = {
	id: 't2',
	titulo: 'Regar',
	tipo: 'periodica',
	recurrencia: { modo: 'relativo', cada: 2, unidad: 'dias' },
	creadaEn: CREADA,
	versionMinima: MINIMA
};
const CON_PASOS: TareaPuntual = { ...PUNTUAL, primerPaso: 'Guantes', pasos: ['Inodoro', 'Pileta'], pasoActual: 2 };

describe('crear con versión mínima (spec §4.1)', () => {
	it('las tres formas guardan la versión mínima recortada', () => {
		const comunes = { titulo: 'Baño', versionMinima: `  ${MINIMA} ` };

		expect(crearPuntual(comunes, 'p', CREADA)).toMatchObject({ ok: true, tarea: { versionMinima: MINIMA } });
		expect(crearPeriodicaRelativa({ ...comunes, cada: 2, unidad: 'dias' }, 'r', CREADA)).toMatchObject({ ok: true, tarea: { versionMinima: MINIMA } });
		expect(crearPeriodicaCalendario({ ...comunes, diasSemana: ['lunes'], diasMes: [] }, 'c', CREADA)).toMatchObject({
			ok: true,
			tarea: { versionMinima: MINIMA }
		});
	});

	it.each(['', '   ', ' \t '])('vacía o solo espacios (%j) es sin versión mínima: el campo no se guarda', (versionMinima) => {
		expect(crearPuntual({ titulo: 'Baño', versionMinima }, 't1', CREADA)).toStrictEqual({
			ok: true,
			tarea: { id: 't1', titulo: 'Baño', tipo: 'puntual', creadaEn: CREADA }
		});
	});

	it('nunca es inválida ni tiene largo máximo, y no reemplaza la nota ni el primer paso', () => {
		const larga = 'x'.repeat(5000);
		const resultado = crearPuntual({ titulo: 'Baño', nota: 'Guantes', primerPaso: 'Lavandina', versionMinima: larga }, 't1', CREADA);

		expect(resultado).toMatchObject({ ok: true, tarea: { nota: 'Guantes', primerPaso: 'Lavandina', versionMinima: larga } });
	});
});

describe('datosDeTarea y documento con versión mínima (spec §6.2, §7)', () => {
	it('al editar, el panel la carga, y crearSegunDatos la devuelve igual', () => {
		const datos = datosDeTarea(RELATIVA);

		expect(datos).toMatchObject({ versionMinima: MINIMA });
		expect(crearSegunDatos(datos, RELATIVA.id, CREADA)).toStrictEqual({ ok: true, tarea: RELATIVA });
	});

	it('una tarea sin el campo abre el panel sin versión mínima', () => {
		const { versionMinima: _, ...sinMinima } = PUNTUAL;

		expect(datosDeTarea(sinMinima)).not.toHaveProperty('versionMinima');
	});

	it('el documento la conserva; sin el campo, la tarea no la tiene (no hay migración)', () => {
		const documento: DocumentoDeTarea = { id: 't1', titulo: 'Baño', tipo: 'puntual', creadaEn: CREADA };

		expect(tareaDesdeDocumento({ ...documento, versionMinima: MINIMA })).toMatchObject({ versionMinima: MINIMA });
		expect(tareaDesdeDocumento(documento)).not.toHaveProperty('versionMinima');
	});
});

describe('editar la versión mínima (spec §6.2, §7)', () => {
	const conMinima = (versionMinima: string): DatosDeTarea => ({ ...datosDeTarea(PUNTUAL), versionMinima });

	it('solo entra en el cambio si cambió, recortada', () => {
		expect(editar(PUNTUAL, conMinima(` ${MINIMA}  `))).toStrictEqual({ ok: true, cambio: {} });
		expect(editar(PUNTUAL, conMinima(' Solo la pileta '))).toStrictEqual({ ok: true, cambio: { versionMinima: 'Solo la pileta' } });
	});

	it('vaciarla la quita con null, y aplicar el cambio deja el documento sin el campo', () => {
		const resultado = editar(PUNTUAL, conMinima('  '));
		const documento: DocumentoDeTarea = { ...PUNTUAL };

		expect(resultado).toStrictEqual({ ok: true, cambio: { versionMinima: null } });
		if (!resultado.ok) return;
		expect(aplicarCambio([documento], PUNTUAL.id, resultado.cambio)[0]).not.toHaveProperty('versionMinima');
	});

	it('cambiar el tipo no la toca', () => {
		const datos: DatosDeTarea = { ...datosDeTarea(PUNTUAL), forma: 'relativa', cada: 2, unidad: 'dias' };
		const resultado = editar(PUNTUAL, datos);

		expect(resultado.ok && resultado.cambio).not.toHaveProperty('versionMinima');
	});
});

describe('Cambios sin guardar con versión mínima (spec §6.2)', () => {
	const valores = (datos: DatosDeTarea) => ({ datos, etiquetas: [] });
	const alAbrir = valores(datosDeTarea(PUNTUAL));
	const conMinima = (versionMinima: string | undefined) => ({ ...valores({ ...datosDeTarea(PUNTUAL), versionMinima }), sinConfirmar: '' });

	it('escribir otra cuenta; volver al valor original o agregarle espacios no', () => {
		expect(hayCambios(alAbrir, conMinima('Solo la pileta'))).toBe(true);
		expect(hayCambios(alAbrir, conMinima(MINIMA))).toBe(false);
		expect(hayCambios(alAbrir, conMinima(`  ${MINIMA} `))).toBe(false);
	});

	it('vaciar una existente cuenta; vacío y sin el campo son lo mismo', () => {
		expect(hayCambios(alAbrir, conMinima(''))).toBe(true);
		const sinMinima = valores({ forma: 'puntual', titulo: 'Baño' });
		expect(hayCambios(sinMinima, { ...valores({ forma: 'puntual', titulo: 'Baño', versionMinima: '  ' }), sinConfirmar: '' })).toBe(false);
	});

	it('con una repetición inválida, una versión mínima vacía no cuenta como cambio', () => {
		const invalida: DatosDeTarea = { forma: 'relativa', titulo: 'Regar', cada: 0, unidad: 'dias' };

		expect(hayCambios(valores(invalida), { ...valores({ ...invalida, versionMinima: '' }), sinConfirmar: '' })).toBe(false);
	});
});

describe('lineaDeMinima: la fila ofrece la mínima (spec §6.1)', () => {
	it('en una pendiente, «Mínima: » y el texto completo, con el botón habilitado', () => {
		expect(lineaDeMinima(PUNTUAL, { tipo: 'pendiente' }, [], AHORA)).toStrictEqual({ texto: `Mínima: ${MINIMA}`, habilitado: true });
	});

	it('en una atrasada también, aunque la tarea no tenga primer paso', () => {
		expect(lineaDeMinima(PUNTUAL, { tipo: 'atrasada' }, [], AHORA)?.texto).toBe(`Mínima: ${MINIMA}`);
	});

	it.each([{ tipo: 'en espera', progreso: 0.5 }, { tipo: 'completada' }, { tipo: 'pausada' }] as const)('no se ve en una fila %o', (estado) => {
		expect(lineaDeMinima(PUNTUAL, estado, [], AHORA)).toBeUndefined();
	});

	it('sin versión mínima no se ve', () => {
		const { versionMinima: _, ...sinMinima } = PUNTUAL;

		expect(lineaDeMinima(sinMinima, { tipo: 'pendiente' }, [], AHORA)).toBeUndefined();
	});

	it('fuera de la ventana el botón está deshabilitado, como el checkbox (§5.5)', () => {
		const conHorario: TareaPuntual = { ...PUNTUAL, horario: [{ desde: '08:00', hasta: '09:00' }] };

		expect(lineaDeMinima(conHorario, { tipo: 'atrasada' }, [], AHORA)).toStrictEqual({ texto: `Mínima: ${MINIMA}`, habilitado: false });
	});
});

describe('filasDePendientes con la mínima (spec §6.1)', () => {
	it('la fila pendiente la lleva, la completada no', () => {
		const completado: Completado = { id: 'c1', tareaId: PUNTUAL.id, completadoEn: CREADA };
		const otra: TareaPuntual = { ...PUNTUAL, id: 't9', titulo: 'Cocina' };
		const filas = filasDePendientes([PUNTUAL, otra], [completado], AHORA, true);

		expect(filas.map(({ tarea, minima }) => [tarea.id, minima?.texto])).toStrictEqual([
			['t9', `Mínima: ${MINIMA}`],
			['t1', undefined]
		]);
	});

	it('una pospuesta no la ofrece', () => {
		const pospuesta: TareaPuntual = { ...PUNTUAL, pospuesta: { desde: CREADA, hasta: new Date(2026, 10, 20) } };

		expect(filasDePendientes([pospuesta], [], AHORA)[0]).not.toHaveProperty('minima');
	});

	it('el orden no cambia por tener mínima', () => {
		const { versionMinima: _, ...sinMinima } = PUNTUAL;
		const a: TareaPuntual = { ...sinMinima, id: 'a', titulo: 'A' };
		const b: TareaPuntual = { ...PUNTUAL, id: 'b', titulo: 'B' };

		expect(filasDePendientes([b, a], [], AHORA).map(({ tarea }) => tarea.id)).toStrictEqual(['a', 'b']);
	});
});

describe('hacerLaMinima (spec §6.1, §4.4)', () => {
	it('completa como el checkbox, con fueMinima en true', () => {
		expect(hacerLaMinima(PUNTUAL, [], 'c1', AHORA)).toStrictEqual({ id: 'c1', tareaId: PUNTUAL.id, completadoEn: AHORA, fueMinima: true });
	});

	it('en una de calendario cubre la misma ocurrencia que un completado entero', () => {
		const semanal: TareaPeriodica = { ...RELATIVA, recurrencia: { modo: 'calendario', diasSemana: ['jueves'] } };
		const { fueMinima, ...resto } = hacerLaMinima(semanal, [], 'c1', AHORA) ?? {};

		expect(fueMinima).toBe(true);
		expect(resto).toStrictEqual(completar(semanal, [], 'c1', AHORA));
	});

	it('cuenta para el estado como cualquier completado: la relativa queda en espera', () => {
		const completado = hacerLaMinima(RELATIVA, [], 'c1', AHORA);

		expect(completado && estadoDeTarea(RELATIVA, [completado], AHORA).tipo).toBe('en espera');
	});

	it('en cualquier paso guarda pasoAlCompletar y la tarea vuelve al paso 1; borrarlo devuelve el paso', () => {
		const completado = hacerLaMinima(CON_PASOS, [], 'c1', AHORA);

		expect(completado).toMatchObject({ pasoAlCompletar: 2, fueMinima: true });
		expect(cambioAlCompletar(CON_PASOS)).toStrictEqual({ pasoActual: null });
		if (!completado) return;
		expect(cambioAlBorrarCompletado({ ...CON_PASOS, pasoActual: undefined }, [completado], completado)).toStrictEqual({ pasoActual: 2 });
	});

	it('no completa si no hay versión mínima', () => {
		const { versionMinima: _, ...sinMinima } = PUNTUAL;

		expect(hacerLaMinima(sinMinima, [], 'c1', AHORA)).toBeUndefined();
	});

	it('no completa una completada, una pospuesta, una pausada ni fuera de la ventana', () => {
		const hecho: Completado = { id: 'c0', tareaId: PUNTUAL.id, completadoEn: CREADA };
		const pospuesta: TareaPuntual = { ...PUNTUAL, pospuesta: { desde: CREADA, hasta: new Date(2026, 10, 20) } };
		const pausada: TareaPeriodica = { ...RELATIVA, pausada: true };
		const fueraDeHorario: TareaPuntual = { ...PUNTUAL, horario: [{ desde: '08:00', hasta: '09:00' }] };

		expect(hacerLaMinima(PUNTUAL, [hecho], 'c1', AHORA)).toBeUndefined();
		expect(hacerLaMinima(pospuesta, [], 'c1', AHORA)).toBeUndefined();
		expect(hacerLaMinima(pausada, [], 'c1', AHORA)).toBeUndefined();
		expect(hacerLaMinima(fueraDeHorario, [], 'c1', AHORA)).toBeUndefined();
	});

	it('un completado entero no lleva el campo', () => {
		expect(completar(PUNTUAL, [], 'c1', AHORA)).not.toHaveProperty('fueMinima');
	});

	it('editar o vaciar la versión mínima no toca los completados', () => {
		const resultado = editar(PUNTUAL, { ...datosDeTarea(PUNTUAL), versionMinima: '' });

		expect(resultado.ok && Object.keys(resultado.cambio)).toStrictEqual(['versionMinima']);
	});
});

describe('checkbox de una completada con la mínima (spec §5.4, §6.1)', () => {
	it('borra el completado más reciente, sea entero o mínimo', () => {
		const entero: Completado = { id: 'c1', tareaId: PUNTUAL.id, completadoEn: CREADA };
		const minimo: Completado = { id: 'c2', tareaId: PUNTUAL.id, completadoEn: new Date(2026, 10, 2), fueMinima: true };

		expect(accionDelCheckbox(PUNTUAL, [entero, minimo], AHORA)).toStrictEqual({ tipo: 'borrar', completado: minimo });
	});

	it('una periódica completada con la mínima un día anterior se completa de nuevo, entera', () => {
		const minimo: Completado = { id: 'c1', tareaId: RELATIVA.id, completadoEn: new Date(2026, 10, 12, 9, 0, 0), fueMinima: true };
		const diaria: TareaPeriodica = { ...RELATIVA, recurrencia: { modo: 'relativo', cada: 2, unidad: 'horas' } };

		expect(accionDelCheckbox(diaria, [minimo], AHORA)).toStrictEqual({ tipo: 'completar' });
		expect(completar(diaria, [minimo], 'c2', AHORA)).not.toHaveProperty('fueMinima');
	});
});

describe('textoDelAviso (spec §5.4)', () => {
	const tarea: TareaPuntual = { ...PUNTUAL, titulo: 'Regar', emoji: '🌱' };

	it('un completado de la mínima suma « · mínima», sin el texto de la mínima', () => {
		const completado: Completado = { id: 'c1', tareaId: tarea.id, completadoEn: AHORA, fueMinima: true };

		expect(textoDelAviso(avisoAlCompletar(tarea, completado))).toBe('Completaste «🌱 Regar» · mínima');
	});

	it('un completado entero no suma nada', () => {
		const completado: Completado = { id: 'c1', tareaId: tarea.id, completadoEn: AHORA };

		expect(textoDelAviso(avisoAlCompletar(tarea, completado))).toBe('Completaste «🌱 Regar»');
	});
});

describe('Historial con la mínima (spec §6.3)', () => {
	it('la hora de un completado de la mínima suma «Mínima», la de uno entero no', () => {
		const minimo: Completado = { id: 'c1', tareaId: PUNTUAL.id, completadoEn: new Date(2026, 10, 13, 8, 5), fueMinima: true };
		const entero: Completado = { id: 'c2', tareaId: PUNTUAL.id, completadoEn: new Date(2026, 10, 13, 9, 0) };
		const [hoy] = historial([PUNTUAL], [minimo, entero], AHORA);

		expect(hoy?.entradas.map(({ hora, textoDeHora }) => [hora, textoDeHora])).toStrictEqual([
			['09:00', '09:00'],
			['08:05', '08:05 Mínima']
		]);
	});
});
