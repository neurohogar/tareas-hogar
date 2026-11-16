import { describe, expect, it } from 'vitest';
import { datePhrase } from './date-text';

/** Viernes 13 de noviembre de 2026, 10:00: el ahora de los ejemplos del spec (§6.1). */
const NOW = new Date(2026, 10, 13, 10, 0, 0);

const wasDue = (instant: Date, now = NOW) => datePhrase('Tocaba', instant, now);
const returns = (instant: Date, now = NOW) => datePhrase('Vuelve', instant, now);

describe('fraseDeFecha (spec §6.1, Fecha y distancia)', () => {
	describe('fecha a dos o más días: «el» día de la semana y número, con la distancia en días locales', () => {
		it('lleva «el» y «hace N días» / «en N días»', () => {
			expect(wasDue(new Date(2026, 10, 10))).toBe('Tocaba el martes 10 · hace 3 días');
			expect(returns(new Date(2026, 10, 19))).toBe('Vuelve el jueves 19 · en 6 días');
		});

		it('cuenta días locales, no horas: dos días aunque falte un minuto para 48 horas', () => {
			expect(wasDue(new Date(2026, 10, 11, 23, 0), new Date(2026, 10, 13, 0, 30))).toBe('Tocaba el miércoles 11 23:00 · hace 2 días');
			expect(returns(new Date(2026, 10, 15, 0, 0), new Date(2026, 10, 13, 23, 59, 59))).toBe('Vuelve el domingo 15 · en 2 días');
		});

		it('lleva la hora HH:MM cuando el instante no es las 00:00', () => {
			expect(wasDue(new Date(2026, 10, 10, 9, 0))).toBe('Tocaba el martes 10 09:00 · hace 3 días');
			expect(wasDue(new Date(2026, 10, 9, 8, 0))).toBe('Tocaba el lunes 9 08:00 · hace 4 días');
			expect(returns(new Date(2026, 10, 19, 0, 1))).toBe('Vuelve el jueves 19 00:01 · en 6 días');
		});

		it('agrega « de <mes>» si el mes no es el de ahora', () => {
			expect(wasDue(new Date(2026, 9, 28))).toBe('Tocaba el miércoles 28 de octubre · hace 16 días');
			expect(returns(new Date(2026, 11, 3, 8, 0), new Date(2026, 10, 27, 10, 0))).toBe('Vuelve el jueves 3 de diciembre 08:00 · en 6 días');
		});

		it('agrega « de <año>» si el año no es el de ahora', () => {
			expect(wasDue(new Date(2025, 11, 31), new Date(2026, 0, 3, 10, 0))).toBe('Tocaba el miércoles 31 de diciembre de 2025 · hace 3 días');
			expect(returns(new Date(2027, 0, 5, 8, 0), new Date(2026, 11, 30, 10, 0))).toBe('Vuelve el martes 5 de enero de 2027 08:00 · en 6 días');
		});

		it('con otro año y el mismo mes que ahora, nombra el mes junto al año', () => {
			expect(wasDue(new Date(2025, 10, 10), NOW)).toBe('Tocaba el lunes 10 de noviembre de 2025 · hace 368 días');
		});
	});

	describe('hoy, ayer o mañana sin hora: la palabra ya es la distancia', () => {
		it('sin «el» y sin distancia', () => {
			expect(wasDue(new Date(2026, 10, 12))).toBe('Tocaba ayer');
			expect(wasDue(new Date(2026, 10, 13))).toBe('Tocaba hoy');
			expect(returns(new Date(2026, 10, 14))).toBe('Vuelve mañana');
		});

		it('el día empieza a las 00:00', () => {
			expect(wasDue(new Date(2026, 10, 12), new Date(2026, 10, 13, 0, 0, 0))).toBe('Tocaba ayer');
			expect(wasDue(new Date(2026, 10, 12), new Date(2026, 10, 13, 23, 59, 59))).toBe('Tocaba ayer');
			expect(returns(new Date(2026, 10, 14), new Date(2026, 10, 13, 23, 59, 59))).toBe('Vuelve mañana');
		});
	});

	describe('hoy, ayer o mañana con hora: la distancia en horas o, a menos de una hora, en minutos', () => {
		it('lo pasado, en horas redondeadas hacia abajo', () => {
			expect(wasDue(new Date(2026, 10, 13, 9, 0))).toBe('Tocaba hoy 09:00 · hace 1 hora');
			expect(wasDue(new Date(2026, 10, 13, 8, 30))).toBe('Tocaba hoy 08:30 · hace 1 hora');
			expect(wasDue(new Date(2026, 10, 13, 8, 0))).toBe('Tocaba hoy 08:00 · hace 2 horas');
			expect(wasDue(new Date(2026, 10, 12, 21, 0))).toBe('Tocaba ayer 21:00 · hace 13 horas');
		});

		it('cuenta desde ahora aunque cruce la medianoche', () => {
			expect(wasDue(new Date(2026, 10, 12, 23, 0), new Date(2026, 10, 13, 1, 0))).toBe('Tocaba ayer 23:00 · hace 2 horas');
			expect(returns(new Date(2026, 10, 13, 1, 0), new Date(2026, 10, 12, 23, 30))).toBe('Vuelve mañana 01:00 · en 2 horas');
		});

		it('lo pasado, a menos de una hora, en minutos redondeados hacia abajo', () => {
			expect(wasDue(new Date(2026, 10, 13, 9, 20))).toBe('Tocaba hoy 09:20 · hace 40 minutos');
			expect(wasDue(new Date(2026, 10, 13, 9, 20), new Date(2026, 10, 13, 10, 0, 59))).toBe('Tocaba hoy 09:20 · hace 40 minutos');
			expect(wasDue(new Date(2026, 10, 13, 9, 20), new Date(2026, 10, 13, 10, 1, 0))).toBe('Tocaba hoy 09:20 · hace 41 minutos');
			expect(wasDue(new Date(2026, 10, 13, 9, 1))).toBe('Tocaba hoy 09:01 · hace 59 minutos');
			expect(wasDue(new Date(2026, 10, 13, 9, 59))).toBe('Tocaba hoy 09:59 · hace 1 minuto');
		});

		it('lo pasado a menos de un minuto es «ahora», no «hace 0 minutos»', () => {
			expect(wasDue(new Date(2026, 10, 13, 10, 0))).toBe('Tocaba hoy 10:00 · ahora');
			expect(wasDue(new Date(2026, 10, 13, 10, 0), new Date(2026, 10, 13, 10, 0, 30))).toBe('Tocaba hoy 10:00 · ahora');
			expect(wasDue(new Date(2026, 10, 13, 10, 0), new Date(2026, 10, 13, 10, 0, 59))).toBe('Tocaba hoy 10:00 · ahora');
			expect(wasDue(new Date(2026, 10, 13, 10, 0), new Date(2026, 10, 13, 10, 0, 59, 999))).toBe('Tocaba hoy 10:00 · ahora');
			expect(wasDue(new Date(2026, 10, 13, 10, 0), new Date(2026, 10, 13, 10, 1, 0))).toBe('Tocaba hoy 10:00 · hace 1 minuto');
			expect(wasDue(new Date(2026, 10, 12, 23, 59, 40), new Date(2026, 10, 13, 0, 0, 10))).toBe('Tocaba ayer 23:59 · ahora');
		});

		it('lo futuro, en horas redondeadas hacia arriba', () => {
			expect(returns(new Date(2026, 10, 13, 18, 0))).toBe('Vuelve hoy 18:00 · en 8 horas');
			expect(returns(new Date(2026, 10, 13, 18, 0), new Date(2026, 10, 13, 10, 0, 30))).toBe('Vuelve hoy 18:00 · en 8 horas');
			expect(returns(new Date(2026, 10, 13, 11, 0))).toBe('Vuelve hoy 11:00 · en 1 hora');
			expect(returns(new Date(2026, 10, 14, 10, 0))).toBe('Vuelve mañana 10:00 · en 24 horas');
		});

		it('lo futuro, a menos de una hora, en minutos redondeados hacia arriba, nunca «en 0 minutos»', () => {
			expect(returns(new Date(2026, 10, 13, 10, 40))).toBe('Vuelve hoy 10:40 · en 40 minutos');
			expect(returns(new Date(2026, 10, 13, 10, 40), new Date(2026, 10, 13, 10, 0, 30))).toBe('Vuelve hoy 10:40 · en 40 minutos');
			expect(returns(new Date(2026, 10, 13, 10, 40), new Date(2026, 10, 13, 10, 39, 30))).toBe('Vuelve hoy 10:40 · en 1 minuto');
			expect(returns(new Date(2026, 10, 13, 10, 40), new Date(2026, 10, 13, 10, 39, 59, 999))).toBe('Vuelve hoy 10:40 · en 1 minuto');
			expect(returns(new Date(2026, 10, 14, 6, 0), new Date(2026, 10, 14, 5, 1))).toBe('Vuelve hoy 06:00 · en 59 minutos');
			expect(returns(new Date(2026, 10, 13, 10, 0))).not.toContain('en 0');
		});

		it('a punto de cumplir una hora en el futuro ya dice «en 1 hora»', () => {
			expect(returns(new Date(2026, 10, 13, 11, 0), new Date(2026, 10, 13, 10, 0, 0, 1))).toBe('Vuelve hoy 11:00 · en 1 hora');
			expect(returns(new Date(2026, 10, 13, 11, 0), new Date(2026, 10, 13, 10, 0, 59))).toBe('Vuelve hoy 11:00 · en 1 hora');
			expect(returns(new Date(2026, 10, 13, 11, 0), new Date(2026, 10, 13, 10, 1, 0))).toBe('Vuelve hoy 11:00 · en 59 minutos');
		});
	});
});
