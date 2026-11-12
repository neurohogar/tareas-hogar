// Spec §4.1, §6.2 y §7: el horario al crear, al editar y en el documento guardado.
import { describe, expect, it } from 'vitest';
import { crearSegunDatos, datosDeTarea } from './datos-de-tarea';
import { aplicarCambio, tareaDesdeDocumento, type DocumentoDeTarea } from './documento-de-tarea';
import { editar } from './edicion';
import type { TareaPuntual } from './tarea';

const AHORA = new Date(2026, 6, 15, 8, 0, 0);
const MANANA = [{ desde: '08:00', hasta: '11:00' }];

describe('crear con horario (spec §4.1)', () => {
	it.each([
		{ forma: 'puntual' as const, titulo: 'Regar' },
		{ forma: 'relativa' as const, titulo: 'Regar', cada: 2, unidad: 'dias' as const },
		{ forma: 'calendario' as const, titulo: 'Basura', diasSemana: ['martes' as const], diasMes: [] }
	])('cualquier tipo de tarea guarda el horario tal cual ($forma)', (datos) => {
		const resultado = crearSegunDatos({ ...datos, horario: MANANA }, 't1', AHORA);
		expect(resultado.ok && resultado.tarea.horario).toStrictEqual(MANANA);
	});

	it('sin horario, la tarea no tiene el campo', () => {
		const resultado = crearSegunDatos({ forma: 'puntual', titulo: 'Regar' }, 't1', AHORA);
		expect(resultado.ok && resultado.tarea).not.toHaveProperty('horario');
	});

	it('con desde ≥ hasta se rechaza entera, junto con los otros errores', () => {
		expect(crearSegunDatos({ forma: 'puntual', titulo: ' ', horario: [{ desde: '11:00', hasta: '08:00' }] }, 't1', AHORA)).toStrictEqual({
			ok: false,
			errores: { titulo: 'vacio', horario: 'finNoPosterior' }
		});
	});

	it('con una sola de las dos horas se rechaza por horario incompleto', () => {
		expect(crearSegunDatos({ forma: 'relativa', titulo: 'Regar', cada: 1, unidad: 'dias', horario: [{ desde: '08:00' }] }, 't1', AHORA)).toStrictEqual({
			ok: false,
			errores: { horario: 'incompleto' }
		});
	});
});

const CON_HORARIO: TareaPuntual = { id: 't1', titulo: 'Regar', tipo: 'puntual', horario: MANANA, creadaEn: AHORA };

describe('editar el horario (spec §6.2, §7)', () => {
	it('el panel carga el horario de la tarea', () => {
		expect(datosDeTarea(CON_HORARIO)).toStrictEqual({ forma: 'puntual', titulo: 'Regar', horario: MANANA });
	});

	it('cambiarlo escribe el horario entero, como un solo campo', () => {
		const resultado = editar(CON_HORARIO, { ...datosDeTarea(CON_HORARIO), horario: [{ desde: '07:00', hasta: '11:00' }] });
		expect(resultado).toStrictEqual({ ok: true, cambio: { horario: [{ desde: '07:00', hasta: '11:00' }] } });
	});

	it('quitarlo lo escribe como null', () => {
		const { horario: _, ...sinHorario } = datosDeTarea(CON_HORARIO);
		expect(editar(CON_HORARIO, sinHorario)).toStrictEqual({ ok: true, cambio: { horario: null } });
	});

	it('sin cambios en el horario no lo escribe, tampoco al cambiar de tipo', () => {
		expect(editar(CON_HORARIO, datosDeTarea(CON_HORARIO))).toStrictEqual({ ok: true, cambio: {} });
		const resultado = editar(CON_HORARIO, { forma: 'relativa', titulo: 'Regar', cada: 2, unidad: 'dias', horario: MANANA });
		expect(resultado.ok && resultado.cambio).not.toHaveProperty('horario');
	});

	it('una edición con horario inválido se rechaza entera', () => {
		expect(editar(CON_HORARIO, { forma: 'puntual', titulo: 'Barrer', horario: [{ desde: '10:00', hasta: '10:00' }] })).toStrictEqual({
			ok: false,
			errores: { horario: 'finNoPosterior' }
		});
	});
});

describe('el horario en el documento (spec §7)', () => {
	const DOCUMENTO: DocumentoDeTarea = { id: 't1', titulo: 'Regar', tipo: 'puntual', creadaEn: AHORA };

	it('la tarea del documento conserva su horario', () => {
		expect(tareaDesdeDocumento({ ...DOCUMENTO, horario: MANANA })).toStrictEqual({ ...DOCUMENTO, horario: MANANA });
		expect(tareaDesdeDocumento({ ...DOCUMENTO, recurrencia: { modo: 'relativo', cada: 1, unidad: 'dias' }, tipo: 'periodica', horario: MANANA }).horario).toStrictEqual(MANANA);
	});

	it('un cambio de horario reemplaza el campo entero, y null lo quita', () => {
		const [cambiado] = aplicarCambio([{ ...DOCUMENTO, horario: MANANA }], 't1', { horario: [{ desde: '07:00', hasta: '12:00' }] });
		expect(cambiado.horario).toStrictEqual([{ desde: '07:00', hasta: '12:00' }]);
		const [quitado] = aplicarCambio([cambiado], 't1', { horario: null });
		expect(quitado).not.toHaveProperty('horario');
	});
});

const MANANA_Y_TARDE = [
	{ desde: '07:00', hasta: '10:00' },
	{ desde: '18:00', hasta: '21:00' }
];

describe('varios horarios (spec §4.1, §6.2, §7)', () => {
	it.each([
		{ forma: 'puntual' as const, titulo: 'Perros' },
		{ forma: 'relativa' as const, titulo: 'Perros', cada: 1, unidad: 'dias' as const },
		{ forma: 'calendario' as const, titulo: 'Perros', diasSemana: ['miércoles' as const], diasMes: [] }
	])('cualquier tipo de tarea guarda varias ventanas, ordenadas por desde ($forma)', (datos) => {
		const resultado = crearSegunDatos({ ...datos, horario: [MANANA_Y_TARDE[1], MANANA_Y_TARDE[0]] }, 't1', AHORA);
		expect(resultado.ok && resultado.tarea.horario).toStrictEqual(MANANA_Y_TARDE);
	});

	it('una relativa en horas con más de una ventana se rechaza entera', () => {
		expect(crearSegunDatos({ forma: 'relativa', titulo: ' ', cada: 8, unidad: 'horas', horario: MANANA_Y_TARDE }, 't1', AHORA)).toStrictEqual({
			ok: false,
			errores: { titulo: 'vacio', horario: 'variasEnHoras' }
		});
	});

	it('una relativa en horas con una sola ventana es válida', () => {
		const resultado = crearSegunDatos({ forma: 'relativa', titulo: 'Remedio', cada: 8, unidad: 'horas', horario: [MANANA_Y_TARDE[0]] }, 't1', AHORA);
		expect(resultado.ok).toBe(true);
	});

	it('un error del horario mismo tiene prioridad sobre el de la relativa en horas', () => {
		const superpuestas = [MANANA_Y_TARDE[0], { desde: '09:00', hasta: '12:00' }];
		expect(crearSegunDatos({ forma: 'relativa', titulo: 'Remedio', cada: 8, unidad: 'horas', horario: superpuestas }, 't1', AHORA)).toStrictEqual({
			ok: false,
			errores: { horario: 'superpuestos' }
		});
	});

	it('pasar a relativa en horas una tarea con dos ventanas se rechaza', () => {
		const tarea: TareaPuntual = { ...CON_HORARIO, horario: MANANA_Y_TARDE };
		expect(editar(tarea, { forma: 'relativa', titulo: 'Regar', cada: 8, unidad: 'horas', horario: MANANA_Y_TARDE })).toStrictEqual({
			ok: false,
			errores: { horario: 'variasEnHoras' }
		});
	});

	it('agregar una ventana escribe la lista entera; dejarla igual no escribe nada', () => {
		expect(editar(CON_HORARIO, { ...datosDeTarea(CON_HORARIO), horario: [...MANANA, MANANA_Y_TARDE[1]] })).toStrictEqual({
			ok: true,
			cambio: { horario: [...MANANA, MANANA_Y_TARDE[1]] }
		});
		const tarea: TareaPuntual = { ...CON_HORARIO, horario: MANANA_Y_TARDE };
		expect(editar(tarea, datosDeTarea(tarea))).toStrictEqual({ ok: true, cambio: {} });
		expect(editar(tarea, { ...datosDeTarea(tarea), horario: [MANANA_Y_TARDE[1]] })).toStrictEqual({ ok: true, cambio: { horario: [MANANA_Y_TARDE[1]] } });
	});

	it('el panel carga una copia de las ventanas', () => {
		const tarea: TareaPuntual = { ...CON_HORARIO, horario: MANANA_Y_TARDE };
		const datos = datosDeTarea(tarea);
		expect(datos.horario).toStrictEqual(MANANA_Y_TARDE);
		expect(datos.horario?.[0]).not.toBe(MANANA_Y_TARDE[0]);
	});

	it('un documento guardado con una sola ventana (formato anterior) se lee como una lista de una', () => {
		const documento: DocumentoDeTarea = { id: 't1', titulo: 'Regar', tipo: 'puntual', creadaEn: AHORA, horario: { desde: '08:00', hasta: '11:00' } };
		expect(tareaDesdeDocumento(documento).horario).toStrictEqual(MANANA);
	});
});
