import { describe, expect, it } from 'vitest';
import { datePhrase } from './date-text';

/** Friday 13 November 2026, 10:00: the now of the spec examples (§6.1). */
const NOW = new Date(2026, 10, 13, 10, 0, 0);

const wasDue = (instant: Date, now = NOW) => datePhrase('Tocaba', instant, now);
const returns = (instant: Date, now = NOW) => datePhrase('Vuelve', instant, now);

describe('dateText (spec §6.1, Fecha y distancia)', () => {
	describe('date two or more days away: «el» weekday and number, with the distance in local days', () => {
		it('carries «el» and «hace N días» / «en N días»', () => {
			expect(wasDue(new Date(2026, 10, 10))).toBe('Tocaba el martes 10 · hace 3 días');
			expect(returns(new Date(2026, 10, 19))).toBe('Vuelve el jueves 19 · en 6 días');
		});

		it('counts local days, not hours: two days even if a minute is missing to 48 hours', () => {
			expect(wasDue(new Date(2026, 10, 11, 23, 0), new Date(2026, 10, 13, 0, 30))).toBe('Tocaba el miércoles 11 23:00 · hace 2 días');
			expect(returns(new Date(2026, 10, 15, 0, 0), new Date(2026, 10, 13, 23, 59, 59))).toBe('Vuelve el domingo 15 · en 2 días');
		});

		it('carries the time HH:MM when the instant is not 00:00', () => {
			expect(wasDue(new Date(2026, 10, 10, 9, 0))).toBe('Tocaba el martes 10 09:00 · hace 3 días');
			expect(wasDue(new Date(2026, 10, 9, 8, 0))).toBe('Tocaba el lunes 9 08:00 · hace 4 días');
			expect(returns(new Date(2026, 10, 19, 0, 1))).toBe('Vuelve el jueves 19 00:01 · en 6 días');
		});

		it('adds « de <month>» if the month is not the one of now', () => {
			expect(wasDue(new Date(2026, 9, 28))).toBe('Tocaba el miércoles 28 de octubre · hace 16 días');
			expect(returns(new Date(2026, 11, 3, 8, 0), new Date(2026, 10, 27, 10, 0))).toBe('Vuelve el jueves 3 de diciembre 08:00 · en 6 días');
		});

		it('adds « de <year>» if the year is not the one of now', () => {
			expect(wasDue(new Date(2025, 11, 31), new Date(2026, 0, 3, 10, 0))).toBe('Tocaba el miércoles 31 de diciembre de 2025 · hace 3 días');
			expect(returns(new Date(2027, 0, 5, 8, 0), new Date(2026, 11, 30, 10, 0))).toBe('Vuelve el martes 5 de enero de 2027 08:00 · en 6 días');
		});

		it('with another year and the same month as now, names the month next to the year', () => {
			expect(wasDue(new Date(2025, 10, 10), NOW)).toBe('Tocaba el lunes 10 de noviembre de 2025 · hace 368 días');
		});
	});

	describe('today, yesterday or tomorrow without a time: the word is already the distance', () => {
		it('without «el» and without distance', () => {
			expect(wasDue(new Date(2026, 10, 12))).toBe('Tocaba ayer');
			expect(wasDue(new Date(2026, 10, 13))).toBe('Tocaba hoy');
			expect(returns(new Date(2026, 10, 14))).toBe('Vuelve mañana');
		});

		it('the day starts at 00:00', () => {
			expect(wasDue(new Date(2026, 10, 12), new Date(2026, 10, 13, 0, 0, 0))).toBe('Tocaba ayer');
			expect(wasDue(new Date(2026, 10, 12), new Date(2026, 10, 13, 23, 59, 59))).toBe('Tocaba ayer');
			expect(returns(new Date(2026, 10, 14), new Date(2026, 10, 13, 23, 59, 59))).toBe('Vuelve mañana');
		});
	});

	describe('today, yesterday or tomorrow with a time: the distance in hours or, under one hour, in minutes', () => {
		it('the past, in hours rounded down', () => {
			expect(wasDue(new Date(2026, 10, 13, 9, 0))).toBe('Tocaba hoy 09:00 · hace 1 hora');
			expect(wasDue(new Date(2026, 10, 13, 8, 30))).toBe('Tocaba hoy 08:30 · hace 1 hora');
			expect(wasDue(new Date(2026, 10, 13, 8, 0))).toBe('Tocaba hoy 08:00 · hace 2 horas');
			expect(wasDue(new Date(2026, 10, 12, 21, 0))).toBe('Tocaba ayer 21:00 · hace 13 horas');
		});

		it('counts from now even if it crosses midnight', () => {
			expect(wasDue(new Date(2026, 10, 12, 23, 0), new Date(2026, 10, 13, 1, 0))).toBe('Tocaba ayer 23:00 · hace 2 horas');
			expect(returns(new Date(2026, 10, 13, 1, 0), new Date(2026, 10, 12, 23, 30))).toBe('Vuelve mañana 01:00 · en 2 horas');
		});

		it('the past, under one hour, in minutes rounded down', () => {
			expect(wasDue(new Date(2026, 10, 13, 9, 20))).toBe('Tocaba hoy 09:20 · hace 40 minutos');
			expect(wasDue(new Date(2026, 10, 13, 9, 20), new Date(2026, 10, 13, 10, 0, 59))).toBe('Tocaba hoy 09:20 · hace 40 minutos');
			expect(wasDue(new Date(2026, 10, 13, 9, 20), new Date(2026, 10, 13, 10, 1, 0))).toBe('Tocaba hoy 09:20 · hace 41 minutos');
			expect(wasDue(new Date(2026, 10, 13, 9, 1))).toBe('Tocaba hoy 09:01 · hace 59 minutos');
			expect(wasDue(new Date(2026, 10, 13, 9, 59))).toBe('Tocaba hoy 09:59 · hace 1 minuto');
		});

		it('the past under a minute is «ahora», not «hace 0 minutos»', () => {
			expect(wasDue(new Date(2026, 10, 13, 10, 0))).toBe('Tocaba hoy 10:00 · ahora');
			expect(wasDue(new Date(2026, 10, 13, 10, 0), new Date(2026, 10, 13, 10, 0, 30))).toBe('Tocaba hoy 10:00 · ahora');
			expect(wasDue(new Date(2026, 10, 13, 10, 0), new Date(2026, 10, 13, 10, 0, 59))).toBe('Tocaba hoy 10:00 · ahora');
			expect(wasDue(new Date(2026, 10, 13, 10, 0), new Date(2026, 10, 13, 10, 0, 59, 999))).toBe('Tocaba hoy 10:00 · ahora');
			expect(wasDue(new Date(2026, 10, 13, 10, 0), new Date(2026, 10, 13, 10, 1, 0))).toBe('Tocaba hoy 10:00 · hace 1 minuto');
			expect(wasDue(new Date(2026, 10, 12, 23, 59, 40), new Date(2026, 10, 13, 0, 0, 10))).toBe('Tocaba ayer 23:59 · ahora');
		});

		it('the future, in hours rounded up', () => {
			expect(returns(new Date(2026, 10, 13, 18, 0))).toBe('Vuelve hoy 18:00 · en 8 horas');
			expect(returns(new Date(2026, 10, 13, 18, 0), new Date(2026, 10, 13, 10, 0, 30))).toBe('Vuelve hoy 18:00 · en 8 horas');
			expect(returns(new Date(2026, 10, 13, 11, 0))).toBe('Vuelve hoy 11:00 · en 1 hora');
			expect(returns(new Date(2026, 10, 14, 10, 0))).toBe('Vuelve mañana 10:00 · en 24 horas');
		});

		it('the future, under one hour, in minutes rounded up, never «en 0 minutos»', () => {
			expect(returns(new Date(2026, 10, 13, 10, 40))).toBe('Vuelve hoy 10:40 · en 40 minutos');
			expect(returns(new Date(2026, 10, 13, 10, 40), new Date(2026, 10, 13, 10, 0, 30))).toBe('Vuelve hoy 10:40 · en 40 minutos');
			expect(returns(new Date(2026, 10, 13, 10, 40), new Date(2026, 10, 13, 10, 39, 30))).toBe('Vuelve hoy 10:40 · en 1 minuto');
			expect(returns(new Date(2026, 10, 13, 10, 40), new Date(2026, 10, 13, 10, 39, 59, 999))).toBe('Vuelve hoy 10:40 · en 1 minuto');
			expect(returns(new Date(2026, 10, 14, 6, 0), new Date(2026, 10, 14, 5, 1))).toBe('Vuelve hoy 06:00 · en 59 minutos');
			expect(returns(new Date(2026, 10, 13, 10, 0))).not.toContain('en 0');
		});

		it('about to complete one hour in the future already says «en 1 hora»', () => {
			expect(returns(new Date(2026, 10, 13, 11, 0), new Date(2026, 10, 13, 10, 0, 0, 1))).toBe('Vuelve hoy 11:00 · en 1 hora');
			expect(returns(new Date(2026, 10, 13, 11, 0), new Date(2026, 10, 13, 10, 0, 59))).toBe('Vuelve hoy 11:00 · en 1 hora');
			expect(returns(new Date(2026, 10, 13, 11, 0), new Date(2026, 10, 13, 10, 1, 0))).toBe('Vuelve hoy 11:00 · en 59 minutos');
		});
	});
});
