import { describe, expect, it } from 'vitest';
import { crearPeriodicaCalendario } from './crear-periodica-calendario';

const AHORA = new Date(2026, 6, 15, 8, 0, 0);

describe('crearPeriodicaCalendario', () => {
	it('crea una semanal con id, creadaEn y solo los días de la semana', () => {
		const resultado = crearPeriodicaCalendario(
			{ titulo: ' Sacar la basura ', diasSemana: ['martes', 'jueves'], diasMes: [] },
			't1',
			AHORA
		);

		expect(resultado).toStrictEqual({
			ok: true,
			tarea: {
				id: 't1',
				titulo: 'Sacar la basura',
				tipo: 'periodica',
				recurrencia: { modo: 'calendario', diasSemana: ['martes', 'jueves'] },
				creadaEn: AHORA
			}
		});
	});

	it('crea una mensual con solo los días del mes', () => {
		const resultado = crearPeriodicaCalendario({ titulo: 'Pagar', diasSemana: [], diasMes: [10, 31] }, 't1', AHORA);

		expect(resultado.ok && resultado.tarea.recurrencia).toStrictEqual({ modo: 'calendario', diasMes: [10, 31] });
	});

	it('guarda los días como conjunto: en el orden de la semana y sin repetir', () => {
		const resultado = crearPeriodicaCalendario(
			{ titulo: 'T', diasSemana: ['domingo', 'jueves', 'lunes', 'jueves'], diasMes: [] },
			't1',
			AHORA
		);

		expect(resultado.ok && resultado.tarea.recurrencia).toStrictEqual({
			modo: 'calendario',
			diasSemana: ['lunes', 'jueves', 'domingo']
		});
	});

	it('guarda los días del mes de menor a mayor y sin repetir', () => {
		const resultado = crearPeriodicaCalendario({ titulo: 'T', diasSemana: [], diasMes: [20, 5, 20, 31] }, 't1', AHORA);

		expect(resultado.ok && resultado.tarea.recurrencia).toStrictEqual({ modo: 'calendario', diasMes: [5, 20, 31] });
	});

	it.each(['', '   '])('rechaza el título vacío o de solo espacios (%j)', (titulo) => {
		expect(crearPeriodicaCalendario({ titulo, diasSemana: ['lunes'], diasMes: [] }, 't1', AHORA)).toEqual({
			ok: false,
			errores: { titulo: 'vacio' }
		});
	});

	it('rechaza la falta de días', () => {
		expect(crearPeriodicaCalendario({ titulo: 'T', diasSemana: [], diasMes: [] }, 't1', AHORA)).toEqual({
			ok: false,
			errores: { dias: 'faltan' }
		});
	});

	it.each([[[0]], [[32]], [[-1]], [[1.5]], [[Number.NaN]], [[15, 32]], [[0, 10]]])(
		'rechaza toda la tarea si algún día del mes no es entero entre 1 y 31 (%j)',
		(diasMes) => {
			expect(crearPeriodicaCalendario({ titulo: 'T', diasSemana: [], diasMes }, 't1', AHORA)).toEqual({
				ok: false,
				errores: { dias: 'diaDelMesInvalido' }
			});
		}
	);

	it('acepta los extremos 1 y 31', () => {
		expect(crearPeriodicaCalendario({ titulo: 'T', diasSemana: [], diasMes: [1, 31] }, 't1', AHORA).ok).toBe(true);
	});

	it('rechaza combinar días de la semana y del mes', () => {
		expect(crearPeriodicaCalendario({ titulo: 'T', diasSemana: ['martes'], diasMes: [15] }, 't1', AHORA)).toEqual({
			ok: false,
			errores: { dias: 'combinados' }
		});
	});

	it('informa el título vacío junto con el error de días', () => {
		expect(crearPeriodicaCalendario({ titulo: ' ', diasSemana: [], diasMes: [] }, 't1', AHORA)).toEqual({
			ok: false,
			errores: { titulo: 'vacio', dias: 'faltan' }
		});
	});
});
