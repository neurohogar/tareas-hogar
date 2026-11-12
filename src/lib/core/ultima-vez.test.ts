import { describe, expect, it } from 'vitest';
import type { Completado } from './tarea';
import { ultimaVez } from './ultima-vez';

const ahora = new Date(2026, 6, 15, 12, 0, 0);

const completado = (id: string, completadoEn: Date, tareaId = 't1'): Completado => ({ id, tareaId, completadoEn });

const desde = (completadoEn: Date, momento = ahora) => ultimaVez('t1', [completado('c1', completadoEn)], momento);

describe('ultimaVez', () => {
	it('sin completados de la tarea es "nunca", aunque otras tareas tengan', () => {
		expect(ultimaVez('t1', [], ahora)).toBe('nunca');
		expect(ultimaVez('t1', [completado('c1', new Date(2026, 6, 15, 8, 0), 't2')], ahora)).toBe('nunca');
	});

	it('del día de ahora es "hoy" con la hora sin segundos, también más tarde que ahora', () => {
		expect(desde(new Date(2026, 6, 15, 8, 5, 59))).toBe('hoy 08:05');
		expect(desde(new Date(2026, 6, 15, 0, 0, 0))).toBe('hoy 00:00');
		expect(desde(new Date(2026, 6, 15, 23, 59, 59))).toBe('hoy 23:59');
	});

	it('del día anterior es "ayer" con la hora, también a través del cambio de año', () => {
		expect(desde(new Date(2026, 6, 14, 19, 30))).toBe('ayer 19:30');
		expect(desde(new Date(2026, 6, 14, 23, 59, 59), new Date(2026, 6, 15, 0, 0, 0))).toBe('ayer 23:59');
		expect(desde(new Date(2025, 11, 31, 22, 0), new Date(2026, 0, 1, 10, 0))).toBe('ayer 22:00');
	});

	it('de dos o más días antes es "hace N días", contando días locales y no horas', () => {
		expect(desde(new Date(2026, 6, 13, 23, 59, 59), new Date(2026, 6, 15, 0, 0, 0))).toBe('hace 2 días');
		expect(desde(new Date(2026, 6, 13, 0, 0, 0), new Date(2026, 6, 15, 23, 59, 59))).toBe('hace 2 días');
		expect(desde(new Date(2026, 5, 15, 8, 0), new Date(2026, 6, 15, 7, 0))).toBe('hace 30 días');
		expect(desde(new Date(2025, 11, 30, 22, 0), new Date(2026, 0, 2, 8, 0))).toBe('hace 3 días');
	});

	it('de un día posterior a hoy lleva la fecha y la hora, con el año si no es el de ahora', () => {
		expect(desde(new Date(2026, 6, 16, 8, 5))).toBe('jueves 16 de julio 08:05');
		expect(desde(new Date(2027, 0, 1, 8, 0), new Date(2026, 11, 31, 20, 0))).toBe('viernes 1 de enero de 2027 08:00');
	});

	it('cuenta el completadoEn más reciente, sin importar el orden en que se registraron', () => {
		const completados = [completado('c1', new Date(2026, 6, 15, 9, 0)), completado('c2', new Date(2026, 6, 14, 10, 0))];
		expect(ultimaVez('t1', completados, ahora)).toBe('hoy 09:00');
		expect(ultimaVez('t1', [...completados].reverse(), ahora)).toBe('hoy 09:00');
	});
});
