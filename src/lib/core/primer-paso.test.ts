import { describe, expect, it } from 'vitest';
import { hayCambios } from './cambios-sin-guardar';
import { crearPeriodicaCalendario } from './crear-periodica-calendario';
import { crearPeriodicaRelativa } from './crear-periodica-relativa';
import { crearPuntual } from './crear-puntual';
import { crearSegunDatos, datosDeTarea, type DatosDeTarea } from './datos-de-tarea';
import { aplicarCambio, tareaDesdeDocumento, type DocumentoDeTarea } from './documento-de-tarea';
import { editar } from './edicion';
import { filasDePendientes } from './pendientes';
import { textoDePrimerPaso } from './primer-paso';
import type { Completado, TareaPeriodica, TareaPuntual } from './tarea';

const CREADA = new Date(2026, 6, 1, 8, 0, 0);
const AHORA = new Date(2026, 6, 15, 8, 0, 0);
const PASO = 'Separar la ropa blanca';
const PUNTUAL: TareaPuntual = { id: 't1', titulo: 'Ropa', tipo: 'puntual', creadaEn: CREADA, primerPaso: PASO };
const RELATIVA: TareaPeriodica = {
	id: 't2',
	titulo: 'Regar',
	tipo: 'periodica',
	recurrencia: { modo: 'relativo', cada: 1, unidad: 'dias' },
	creadaEn: CREADA,
	primerPaso: PASO
};

describe('crear con primer paso (spec §4.1)', () => {
	it('las tres formas guardan el primer paso recortado', () => {
		const comunes = { titulo: 'Ropa', primerPaso: `  ${PASO} ` };

		expect(crearPuntual(comunes, 'p', CREADA)).toMatchObject({ ok: true, tarea: { primerPaso: PASO } });
		expect(crearPeriodicaRelativa({ ...comunes, cada: 2, unidad: 'dias' }, 'r', CREADA)).toMatchObject({ ok: true, tarea: { primerPaso: PASO } });
		expect(crearPeriodicaCalendario({ ...comunes, diasSemana: ['lunes'], diasMes: [] }, 'c', CREADA)).toMatchObject({
			ok: true,
			tarea: { primerPaso: PASO }
		});
	});

	it.each(['', '   ', ' \t '])('vacío o solo espacios (%j) es sin primer paso: el campo no se guarda', (primerPaso) => {
		const resultado = crearPuntual({ titulo: 'Ropa', primerPaso }, 't1', CREADA);

		expect(resultado).toStrictEqual({ ok: true, tarea: { id: 't1', titulo: 'Ropa', tipo: 'puntual', creadaEn: CREADA } });
	});

	it('nunca es inválido ni tiene largo máximo: no rechaza la creación', () => {
		const largo = 'x'.repeat(5000);

		expect(crearPuntual({ titulo: 'Ropa', primerPaso: largo }, 't1', CREADA)).toMatchObject({ ok: true, tarea: { primerPaso: largo } });
	});

	it('no reemplaza la nota: son campos distintos', () => {
		const resultado = crearPuntual({ titulo: 'Ropa', nota: 'Usar guantes', primerPaso: PASO }, 't1', CREADA);

		expect(resultado).toMatchObject({ ok: true, tarea: { nota: 'Usar guantes', primerPaso: PASO } });
	});
});

describe('datosDeTarea con primer paso (spec §6.2)', () => {
	it('al editar, el panel carga el primer paso actual, y crearSegunDatos lo devuelve igual', () => {
		const datos = datosDeTarea(RELATIVA);

		expect(datos).toMatchObject({ forma: 'relativa', primerPaso: PASO });
		expect(crearSegunDatos(datos, RELATIVA.id, CREADA)).toStrictEqual({ ok: true, tarea: RELATIVA });
	});

	it('una tarea sin primer paso carga los datos sin el campo', () => {
		const { primerPaso: _, ...sinPaso } = PUNTUAL;

		expect(datosDeTarea(sinPaso)).toStrictEqual({ forma: 'puntual', titulo: 'Ropa' });
	});
});

describe('tareaDesdeDocumento y aplicarCambio con primer paso (spec §7)', () => {
	const DOCUMENTO: DocumentoDeTarea = { id: 't1', titulo: 'Ropa', tipo: 'puntual', creadaEn: CREADA };

	it('la tarea conserva el primer paso del documento; sin el campo, no tiene', () => {
		expect(tareaDesdeDocumento({ ...DOCUMENTO, primerPaso: PASO })).toStrictEqual({ ...DOCUMENTO, primerPaso: PASO });
		expect(tareaDesdeDocumento(DOCUMENTO)).toStrictEqual(DOCUMENTO);
	});

	it('un cambio escribe el primer paso, null lo quita, y no toca la nota', () => {
		const conNota = { ...DOCUMENTO, nota: 'Usar guantes' };
		const [conPaso] = aplicarCambio([conNota], 't1', { primerPaso: PASO });

		expect(conPaso).toStrictEqual({ ...conNota, primerPaso: PASO });
		expect(aplicarCambio([conPaso], 't1', { primerPaso: null })[0]).toStrictEqual(conNota);
	});
});

describe('editar el primer paso (spec §4.1, §7)', () => {
	const datos = (cambios: Partial<DatosDeTarea>) => ({ ...datosDeTarea(PUNTUAL), ...cambios }) as DatosDeTarea;

	it('otro primer paso entra en el cambio, recortado', () => {
		expect(editar(PUNTUAL, datos({ primerPaso: ' Lavar ' }))).toStrictEqual({ ok: true, cambio: { primerPaso: 'Lavar' } });
	});

	it('el mismo, aunque con espacios alrededor, no cambia nada', () => {
		expect(editar(PUNTUAL, datos({ primerPaso: `  ${PASO}  ` }))).toStrictEqual({ ok: true, cambio: {} });
	});

	it('vacío o solo espacios lo quita (null)', () => {
		expect(editar(PUNTUAL, datos({ primerPaso: '   ' }))).toStrictEqual({ ok: true, cambio: { primerPaso: null } });
	});

	it('cambiar el tipo no lo toca', () => {
		const aRelativa: DatosDeTarea = { forma: 'relativa', titulo: 'Ropa', primerPaso: PASO, cada: 1, unidad: 'dias' };
		const resultado = editar(PUNTUAL, aRelativa);

		expect(resultado.ok && 'primerPaso' in resultado.cambio).toBe(false);
	});
});

describe('hayCambios con primer paso (spec §6.2)', () => {
	const ABIERTO: DatosDeTarea = { forma: 'puntual', titulo: 'Ropa', primerPaso: PASO };
	const cambia = (actual: DatosDeTarea, alAbrir: DatosDeTarea = ABIERTO) =>
		hayCambios({ datos: alAbrir, etiquetas: [] }, { datos: actual, etiquetas: [], sinConfirmar: '' });

	it('otro primer paso es un cambio; el mismo con espacios alrededor, no', () => {
		expect(cambia({ ...ABIERTO, primerPaso: 'Lavar' })).toBe(true);
		expect(cambia({ ...ABIERTO, primerPaso: `  ${PASO} ` })).toBe(false);
	});

	it('vaciar un primer paso existente es un cambio', () => {
		expect(cambia({ ...ABIERTO, primerPaso: '' })).toBe(true);
	});

	it('sin el campo, vacío y solo espacios son lo mismo', () => {
		const sinPaso: DatosDeTarea = { forma: 'puntual', titulo: 'Ropa' };

		expect(cambia({ ...sinPaso, primerPaso: '   ' }, sinPaso)).toBe(false);
		expect(cambia({ ...sinPaso, primerPaso: '' }, { ...sinPaso, primerPaso: '  ' })).toBe(false);
	});

	it('con una repetición inválida, los espacios del primer paso tampoco cuentan', () => {
		const invalida: DatosDeTarea = { forma: 'relativa', titulo: 'Ropa', cada: 0, unidad: 'dias' };

		expect(cambia({ ...invalida, primerPaso: '  ' }, invalida)).toBe(false);
	});
});

describe('textoDePrimerPaso (spec §6.1)', () => {
	it.each(['pendiente', 'atrasada'] as const)('una fila %s lo muestra con el prefijo y el texto completo', (tipo) => {
		expect(textoDePrimerPaso(PUNTUAL, { tipo })).toBe(`Primer paso: ${PASO}`);
	});

	it.each(['en espera', 'completada', 'pausada'] as const)('una fila %s no lo muestra', (tipo) => {
		expect(textoDePrimerPaso(PUNTUAL, { tipo })).toBeUndefined();
	});

	it('una tarea sin primer paso no lo muestra', () => {
		const { primerPaso: _, ...sinPaso } = PUNTUAL;

		expect(textoDePrimerPaso(sinPaso, { tipo: 'pendiente' })).toBeUndefined();
	});

	it('no lo corta, aunque sea largo', () => {
		const largo = 'x'.repeat(500);

		expect(textoDePrimerPaso({ ...PUNTUAL, primerPaso: largo }, { tipo: 'pendiente' })).toBe(`Primer paso: ${largo}`);
	});
});

describe('filasDePendientes con primer paso (spec §6.1)', () => {
	const completado: Completado = { id: 'c', tareaId: RELATIVA.id, completadoEn: new Date(2026, 6, 15, 7, 0, 0) };
	const textos = (completados: Completado[], tareas = [PUNTUAL, RELATIVA]) =>
		filasDePendientes(tareas, completados, AHORA, true, true).map(({ tarea, textoDePrimerPaso }) => [tarea.id, textoDePrimerPaso]);

	it('las filas pendiente y atrasada lo llevan; una completada en espera, no', () => {
		expect(textos([])).toStrictEqual([
			['t2', `Primer paso: ${PASO}`],
			['t1', `Primer paso: ${PASO}`]
		]);
		expect(textos([completado])).toStrictEqual([
			['t1', `Primer paso: ${PASO}`],
			['t2', undefined]
		]);
	});

	it('una pausada no lo lleva', () => {
		expect(textos([], [{ ...RELATIVA, pausada: true }])).toStrictEqual([['t2', undefined]]);
	});

	it('completar la tarea no lo borra: vuelve cuando la periódica vuelve a estar pendiente', () => {
		const alDiaSiguiente = new Date(2026, 6, 16, 7, 30, 0);

		expect(filasDePendientes([RELATIVA], [completado], alDiaSiguiente)[0]).toMatchObject({ textoDePrimerPaso: `Primer paso: ${PASO}` });
	});

	it('no cambia el orden de la lista', () => {
		const { primerPaso: _p, ...puntualSinPaso } = PUNTUAL;
		const { primerPaso: _r, ...relativaSinPaso } = RELATIVA;
		const orden = (tareas: (TareaPuntual | TareaPeriodica)[]) => filasDePendientes(tareas, [], AHORA).map(({ tarea }) => tarea.id);

		expect(orden([PUNTUAL, RELATIVA])).toStrictEqual(orden([puntualSinPaso, relativaSinPaso]));
	});
});
