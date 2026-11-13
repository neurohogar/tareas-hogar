import { describe, expect, it } from 'vitest';
import { hayCambios } from './cambios-sin-guardar';
import { crearPeriodicaCalendario } from './crear-periodica-calendario';
import { crearPeriodicaRelativa } from './crear-periodica-relativa';
import { crearPuntual } from './crear-puntual';
import { crearSegunDatos, datosDeTarea, type DatosDeTarea } from './datos-de-tarea';
import { aplicarCambio, tareaDesdeDocumento, type DocumentoDeTarea } from './documento-de-tarea';
import { editar } from './edicion';
import { normalizarPasos, pasoEnQueVa, pasosDeLaTarea, tieneVariosPasos } from './pasos';
import type { TareaPeriodica, TareaPuntual } from './tarea';

const CREADA = new Date(2026, 6, 1, 8, 0, 0);
const PUNTUAL: TareaPuntual = { id: 't1', titulo: 'Ropa', tipo: 'puntual', creadaEn: CREADA, primerPaso: 'Separar', pasos: ['Lavar', 'Tender'] };

describe('normalizarPasos (spec §4.1, Pasos: Texto)', () => {
	it('recorta cada paso', () => {
		expect(normalizarPasos(' Separar ', ['  Lavar', 'Tender  '])).toStrictEqual({ primerPaso: 'Separar', pasos: ['Lavar', 'Tender'] });
	});

	it('descarta los vacíos o de solo espacios y los de abajo suben', () => {
		expect(normalizarPasos('Separar', ['', 'Lavar', ' \t ', 'Tender'])).toStrictEqual({ primerPaso: 'Separar', pasos: ['Lavar', 'Tender'] });
	});

	it('si el primer paso queda vacío y el paso 2 no, el paso 2 pasa a ser el primer paso', () => {
		expect(normalizarPasos('  ', ['Lavar', 'Tender'])).toStrictEqual({ primerPaso: 'Lavar', pasos: ['Tender'] });
	});

	it('sin pasos más allá del primero, no hay campo pasos', () => {
		expect(normalizarPasos('Separar', ['', '  '])).toStrictEqual({ primerPaso: 'Separar' });
		expect(normalizarPasos('Separar')).toStrictEqual({ primerPaso: 'Separar' });
	});

	it('todo vacío es sin primer paso y sin pasos', () => {
		expect(normalizarPasos(' ', [' '])).toStrictEqual({});
		expect(normalizarPasos()).toStrictEqual({});
	});

	it('no hay máximo de pasos ni de largo', () => {
		const muchos = Array.from({ length: 200 }, (_, i) => `Paso ${i + 2} ${'x'.repeat(1000)}`);

		expect(normalizarPasos('Separar', muchos)).toStrictEqual({ primerPaso: 'Separar', pasos: muchos });
	});
});

describe('pasosDeLaTarea y tieneVariosPasos (spec §4.1)', () => {
	it('el primer paso es el paso 1 y siguen los de pasos, en orden', () => {
		expect(pasosDeLaTarea(PUNTUAL)).toStrictEqual(['Separar', 'Lavar', 'Tender']);
		expect(tieneVariosPasos(PUNTUAL)).toBe(true);
	});

	it('con primer paso y sin pasos, un solo paso', () => {
		const { pasos: _, ...unPaso } = PUNTUAL;

		expect(pasosDeLaTarea(unPaso)).toStrictEqual(['Separar']);
		expect(tieneVariosPasos(unPaso)).toBe(false);
	});

	it('sin primer paso, ningún paso', () => {
		expect(pasosDeLaTarea({ pasos: ['Lavar'] })).toStrictEqual([]);
		expect(tieneVariosPasos({ pasos: ['Lavar'] })).toBe(false);
	});
});

describe('pasoEnQueVa (spec §4.1, Pasos: Avance)', () => {
	it('sin pasoActual, el paso 1', () => {
		expect(pasoEnQueVa(PUNTUAL)).toBe(1);
	});

	it('el pasoActual guardado', () => {
		expect(pasoEnQueVa({ ...PUNTUAL, pasoActual: 2 })).toBe(2);
		expect(pasoEnQueVa({ ...PUNTUAL, pasoActual: 3 })).toBe(3);
	});

	it('con menos pasos que pasoActual, el último', () => {
		expect(pasoEnQueVa({ ...PUNTUAL, pasoActual: 7 })).toBe(3);
	});

	it.each([0, -2])('un pasoActual %i de un dato viejo es el paso 1', (pasoActual) => {
		expect(pasoEnQueVa({ ...PUNTUAL, pasoActual })).toBe(1);
	});

	it('sin pasos, el paso 1', () => {
		expect(pasoEnQueVa({ pasoActual: 3 })).toBe(1);
	});
});

describe('crear con pasos (spec §4.1)', () => {
	const comunes = { titulo: 'Ropa', primerPaso: ' Separar', pasos: ['Lavar ', '', 'Tender'] };

	it('las tres formas guardan los pasos normalizados', () => {
		const esperado = { primerPaso: 'Separar', pasos: ['Lavar', 'Tender'] };

		expect(crearPuntual(comunes, 'p', CREADA)).toMatchObject({ ok: true, tarea: esperado });
		expect(crearPeriodicaRelativa({ ...comunes, cada: 2, unidad: 'dias' }, 'r', CREADA)).toMatchObject({ ok: true, tarea: esperado });
		expect(crearPeriodicaCalendario({ ...comunes, diasSemana: ['lunes'], diasMes: [] }, 'c', CREADA)).toMatchObject({ ok: true, tarea: esperado });
	});

	it('un paso de solo espacios no rechaza la creación: se crea sin él, sin campo pasos', () => {
		expect(crearPuntual({ titulo: 'Ropa', primerPaso: 'Separar', pasos: ['   '] }, 't1', CREADA)).toStrictEqual({
			ok: true,
			tarea: { id: 't1', titulo: 'Ropa', tipo: 'puntual', creadaEn: CREADA, primerPaso: 'Separar' }
		});
	});

	it('con el primer paso vacío, el paso 2 pasa a ser el primer paso', () => {
		expect(crearPuntual({ titulo: 'Ropa', primerPaso: '', pasos: ['Lavar'] }, 't1', CREADA)).toMatchObject({
			ok: true,
			tarea: { primerPaso: 'Lavar' }
		});
	});

	it('crear no guarda pasoActual', () => {
		const creada = crearPuntual(comunes, 'p', CREADA);

		expect(creada.ok && 'pasoActual' in creada.tarea).toBe(false);
	});
});

describe('datosDeTarea con pasos (spec §6.2)', () => {
	it('carga los pasos más, y crearSegunDatos lo devuelve igual', () => {
		const relativa: TareaPeriodica = {
			id: 't2',
			titulo: 'Regar',
			tipo: 'periodica',
			recurrencia: { modo: 'relativo', cada: 1, unidad: 'dias' },
			creadaEn: CREADA,
			primerPaso: 'Llenar',
			pasos: ['Regar']
		};
		const datos = datosDeTarea(relativa);

		expect(datos).toMatchObject({ primerPaso: 'Llenar', pasos: ['Regar'] });
		expect(crearSegunDatos(datos, relativa.id, CREADA)).toStrictEqual({ ok: true, tarea: relativa });
	});

	it('los pasos cargados son una copia', () => {
		const datos = datosDeTarea(PUNTUAL);

		expect(datos.pasos).not.toBe(PUNTUAL.pasos);
	});

	it('sin pasos, los datos no tienen el campo', () => {
		const { pasos: _, ...unPaso } = PUNTUAL;

		expect('pasos' in datosDeTarea(unPaso)).toBe(false);
	});
});

describe('tareaDesdeDocumento y aplicarCambio con pasos (spec §7)', () => {
	const DOCUMENTO: DocumentoDeTarea = { id: 't1', titulo: 'Ropa', tipo: 'puntual', creadaEn: CREADA, primerPaso: 'Separar' };

	it('la tarea conserva pasos y pasoActual del documento', () => {
		expect(tareaDesdeDocumento({ ...DOCUMENTO, pasos: ['Lavar'], pasoActual: 2 })).toStrictEqual({ ...DOCUMENTO, pasos: ['Lavar'], pasoActual: 2 });
	});

	it('una periódica también', () => {
		const periodica: DocumentoDeTarea = { ...DOCUMENTO, tipo: 'periodica', recurrencia: { modo: 'relativo', cada: 1, unidad: 'dias' } };

		expect(tareaDesdeDocumento({ ...periodica, pasos: ['Lavar'], pasoActual: 2 })).toMatchObject({ pasos: ['Lavar'], pasoActual: 2 });
	});

	it('sin los campos, o con pasos vacío, no los tiene', () => {
		expect(tareaDesdeDocumento(DOCUMENTO)).toStrictEqual(DOCUMENTO);
		expect(tareaDesdeDocumento({ ...DOCUMENTO, pasos: [] })).toStrictEqual(DOCUMENTO);
	});

	it('pasos se reemplaza entero y pasoActual es otro campo', () => {
		const [conPasos] = aplicarCambio([{ ...DOCUMENTO, pasos: ['Lavar', 'Tender'], pasoActual: 2 }], 't1', { pasos: ['Planchar'] });

		expect(conPasos).toStrictEqual({ ...DOCUMENTO, pasos: ['Planchar'], pasoActual: 2 });
		expect(aplicarCambio([conPasos], 't1', { pasos: null, pasoActual: null })[0]).toStrictEqual(DOCUMENTO);
	});
});

describe('editar los pasos (spec §4.1, §7)', () => {
	const datos = (cambios: Partial<DatosDeTarea>) => ({ ...datosDeTarea(PUNTUAL), ...cambios }) as DatosDeTarea;

	it('cambiar un paso escribe la lista entera, recortada', () => {
		expect(editar(PUNTUAL, datos({ pasos: ['Lavar', ' Planchar '] }))).toStrictEqual({ ok: true, cambio: { pasos: ['Lavar', 'Planchar'] } });
	});

	it('agregar un paso escribe la lista entera', () => {
		expect(editar(PUNTUAL, datos({ pasos: ['Lavar', 'Tender', 'Guardar'] }))).toStrictEqual({ ok: true, cambio: { pasos: ['Lavar', 'Tender', 'Guardar'] } });
	});

	it('los mismos pasos, con espacios o un vacío que se descarta, no cambian nada', () => {
		expect(editar(PUNTUAL, datos({ pasos: [' Lavar ', '', 'Tender'] }))).toStrictEqual({ ok: true, cambio: {} });
	});

	it('quitar todos los pasos más lo quita (null)', () => {
		expect(editar(PUNTUAL, datos({ pasos: ['', ' '] }))).toStrictEqual({ ok: true, cambio: { pasos: null } });
	});

	it('vaciar el primer paso sube el paso 2: cambian los dos campos', () => {
		expect(editar(PUNTUAL, datos({ primerPaso: '' }))).toStrictEqual({ ok: true, cambio: { primerPaso: 'Lavar', pasos: ['Tender'] } });
	});

	it('nunca escribe pasoActual, aunque queden menos pasos', () => {
		const resultado = editar({ ...PUNTUAL, pasoActual: 3 }, datos({ pasos: [] }));

		expect(resultado).toStrictEqual({ ok: true, cambio: { pasos: null } });
	});

	it('cambiar el tipo no toca los pasos', () => {
		const aRelativa: DatosDeTarea = { ...datosDeTarea(PUNTUAL), forma: 'relativa', cada: 1, unidad: 'dias' } as DatosDeTarea;
		const resultado = editar({ ...PUNTUAL, pasoActual: 2 }, aRelativa);

		expect(resultado.ok && ('pasos' in resultado.cambio || 'pasoActual' in resultado.cambio)).toBe(false);
	});
});

describe('hayCambios con pasos (spec §6.2)', () => {
	const ABIERTO: DatosDeTarea = { forma: 'puntual', titulo: 'Ropa', primerPaso: 'Separar', pasos: ['Lavar'] };
	const cambia = (actual: DatosDeTarea, alAbrir: DatosDeTarea = ABIERTO) =>
		hayCambios({ datos: alAbrir, etiquetas: [] }, { datos: actual, etiquetas: [], sinConfirmar: '' });

	it('cambiar un paso cuenta; el mismo con espacios alrededor, no', () => {
		expect(cambia({ ...ABIERTO, pasos: ['Tender'] })).toBe(true);
		expect(cambia({ ...ABIERTO, pasos: ['  Lavar '] })).toBe(false);
	});

	it('vaciar o dejar en solo espacios un paso existente cuenta', () => {
		expect(cambia({ ...ABIERTO, pasos: [''] })).toBe(true);
		expect(cambia({ ...ABIERTO, pasos: ['   '] })).toBe(true);
	});

	it('agregar un paso vacío o de solo espacios no cuenta; escrito, sí', () => {
		expect(cambia({ ...ABIERTO, pasos: ['Lavar', ''] })).toBe(false);
		expect(cambia({ ...ABIERTO, pasos: ['Lavar', '  '] })).toBe(false);
		expect(cambia({ ...ABIERTO, pasos: ['Lavar', 'Tender'] })).toBe(true);
	});

	it('quitar un paso existente cuenta', () => {
		expect(cambia({ ...ABIERTO, pasos: [] })).toBe(true);
	});

	it('al crear, agregar un paso vacío no cuenta y escribirlo sí', () => {
		const alCrear: DatosDeTarea = { forma: 'puntual', titulo: '' };

		expect(cambia({ ...alCrear, pasos: [''] }, alCrear)).toBe(false);
		expect(cambia({ ...alCrear, pasos: ['Lavar'] }, alCrear)).toBe(true);
	});

	it('con una repetición inválida, un paso vacío tampoco cuenta', () => {
		const invalida: DatosDeTarea = { forma: 'relativa', titulo: 'Ropa', cada: 0, unidad: 'dias' };

		expect(cambia({ ...invalida, pasos: [' '] }, invalida)).toBe(false);
	});
});
