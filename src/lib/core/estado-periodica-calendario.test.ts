import { describe, expect, it } from 'vitest';
import { estadoPeriodicaCalendario } from './estado-periodica-calendario';
import type { Completado, RecurrenciaCalendario } from './tarea';

const MARTES_Y_JUEVES: RecurrenciaCalendario = { modo: 'calendario', diasSemana: ['martes', 'jueves'] };
const EL_31: RecurrenciaCalendario = { modo: 'calendario', diasMes: [31] };
const momento = (mes: number, dia: number, hora = 0, minuto = 0, segundo = 0) =>
	new Date(2026, mes - 1, dia, hora, minuto, segundo);
const cubre = (id: string, completadoEn: Date, ocurrenciaCubierta: Date): Completado => ({
	id,
	tareaId: 't1',
	completadoEn,
	ocurrenciaCubierta
});

describe('estadoPeriodicaCalendario, nunca completada (P = el día anterior a creadaEn)', () => {
	const creadaElLunes = momento(7, 13, 8);

	it('está en espera antes de la primera ocurrencia, con progreso desde creadaEn', () => {
		expect(estadoPeriodicaCalendario(MARTES_Y_JUEVES, creadaElLunes, [], momento(7, 13, 16))).toEqual({
			tipo: 'en espera',
			progreso: 0.5
		});
	});

	it('está pendiente el día de la primera ocurrencia, de 00:00:00 a 23:59:59', () => {
		expect(estadoPeriodicaCalendario(MARTES_Y_JUEVES, creadaElLunes, [], momento(7, 14))).toEqual({ tipo: 'pendiente' });
		expect(estadoPeriodicaCalendario(MARTES_Y_JUEVES, creadaElLunes, [], momento(7, 14, 23, 59, 59))).toEqual({
			tipo: 'pendiente'
		});
	});

	it('creada en un día de ocurrencia, ya está pendiente ese día', () => {
		expect(estadoPeriodicaCalendario(MARTES_Y_JUEVES, momento(7, 14, 8), [], momento(7, 14, 8))).toEqual({
			tipo: 'pendiente'
		});
	});

	it('está atrasada una sola vez pasado el día de la primera ocurrencia', () => {
		expect(estadoPeriodicaCalendario(MARTES_Y_JUEVES, creadaElLunes, [], momento(7, 15))).toEqual({ tipo: 'atrasada' });
		expect(estadoPeriodicaCalendario(MARTES_Y_JUEVES, creadaElLunes, [], momento(8, 20, 10))).toEqual({
			tipo: 'atrasada'
		});
	});
});

describe('estadoPeriodicaCalendario, completada (P = la mayor ocurrencia cubierta)', () => {
	const creadaEn = momento(1, 1);

	it('usa la ocurrencia cubierta, no el día del completado', () => {
		// Completada el lunes cubriendo el martes: el martes ya no está pendiente.
		const completados = [cubre('c1', momento(7, 13, 12), momento(7, 14))];

		expect(estadoPeriodicaCalendario(MARTES_Y_JUEVES, creadaEn, completados, momento(7, 14, 18))).toEqual({
			tipo: 'en espera',
			progreso: 0.5
		});
	});

	it('toma la mayor ocurrencia cubierta aunque se haya registrado antes', () => {
		const completados = [cubre('c1', momento(7, 16, 10), momento(7, 16)), cubre('c2', momento(7, 14, 10), momento(7, 14))];

		expect(estadoPeriodicaCalendario(MARTES_Y_JUEVES, creadaEn, completados, momento(7, 17, 10)).tipo).toBe('en espera');
	});

	it('mide la espera desde el completadoEn más reciente, aunque se haya registrado antes', () => {
		const completados = [cubre('c1', momento(7, 14, 12), momento(7, 14)), cubre('c2', momento(7, 13, 12), momento(7, 14))];

		expect(estadoPeriodicaCalendario(MARTES_Y_JUEVES, creadaEn, completados, momento(7, 14, 21))).toEqual({
			tipo: 'en espera',
			progreso: 0.25
		});
	});

	it('pendiente el día de N y atrasada al día siguiente, con el 31 en el último día del mes', () => {
		const completados = [cubre('c1', momento(5, 31), momento(5, 31))];

		expect(estadoPeriodicaCalendario(EL_31, creadaEn, completados, momento(6, 29, 23, 59, 59)).tipo).toBe('en espera');
		expect(estadoPeriodicaCalendario(EL_31, creadaEn, completados, momento(6, 30))).toEqual({ tipo: 'pendiente' });
		expect(estadoPeriodicaCalendario(EL_31, creadaEn, completados, momento(7, 1))).toEqual({ tipo: 'atrasada' });
	});

	it('ignora los completados sin ocurrencia cubierta para P, pero no para el inicio de espera', () => {
		const completados = [
			cubre('c1', momento(7, 14, 0), momento(7, 14)),
			{ id: 'c2', tareaId: 't1', completadoEn: momento(7, 15, 0) }
		];

		expect(estadoPeriodicaCalendario(MARTES_Y_JUEVES, creadaEn, completados, momento(7, 15, 12))).toEqual({
			tipo: 'en espera',
			progreso: 0.5
		});
	});

	it('con P posterior a hoy, la tarea está en espera con progreso entre 0 y 1', () => {
		const completados = [cubre('c1', momento(7, 20, 12), momento(7, 21))];

		expect(estadoPeriodicaCalendario(MARTES_Y_JUEVES, creadaEn, completados, momento(7, 18, 0))).toEqual({
			tipo: 'en espera',
			progreso: 0
		});
	});
});
