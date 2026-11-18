import { describe, expect, it } from 'vitest';
import { dayHeader, dateAndTimeInText, timeInText } from './dates-in-text';

const now = new Date(2026, 6, 15, 12, 0, 0);

describe('dayHeader', () => {
	it('the day of now is "Hoy", from 00:00 and also later than now', () => {
		expect(dayHeader(new Date(2026, 6, 15, 0, 0, 0), now)).toBe('Hoy');
		expect(dayHeader(new Date(2026, 6, 15, 23, 59, 59), now)).toBe('Hoy');
	});

	it('the previous day is "Ayer", up to its last second and across the year change', () => {
		expect(dayHeader(new Date(2026, 6, 14, 23, 59, 59), now)).toBe('Ayer');
		expect(dayHeader(new Date(2026, 6, 14, 0, 0, 0), now)).toBe('Ayer');
		expect(dayHeader(new Date(2025, 11, 31, 22, 0, 0), new Date(2026, 0, 1, 10, 0, 0))).toBe('Ayer');
	});

	it('another day of the year of now is named with the weekday, the number and the month', () => {
		expect(dayHeader(new Date(2026, 6, 13, 9, 0, 0), now)).toBe('lunes 13 de julio');
		expect(dayHeader(new Date(2026, 6, 13, 23, 59, 59), now)).toBe('lunes 13 de julio');
	});

	it('a day after today carries the date, never "Mañana"', () => {
		expect(dayHeader(new Date(2026, 6, 16, 9, 0, 0), now)).toBe('jueves 16 de julio');
	});

	it('if the year is not the one of now, it is added', () => {
		expect(dayHeader(new Date(2025, 11, 31, 22, 0, 0), new Date(2026, 0, 2, 10, 0, 0))).toBe(
			'miércoles 31 de diciembre de 2025'
		);
		expect(dayHeader(new Date(2027, 0, 1, 9, 0, 0), now)).toBe('viernes 1 de enero de 2027');
	});

	it('names each month in lowercase', () => {
		const months = [
			'enero',
			'febrero',
			'marzo',
			'abril',
			'mayo',
			'junio',
			'julio',
			'agosto',
			'septiembre',
			'octubre',
			'noviembre',
			'diciembre'
		];
		const fromDecember = new Date(2026, 11, 31, 12, 0, 0);
		const namedOnes = months.map((_, month) => dayHeader(new Date(2026, month, 1, 9, 0, 0), fromDecember));

		expect(namedOnes.map((header) => header.split(' de ')[1])).toEqual(months);
	});
});

describe('timeInText', () => {
	it('is the local time in 24 h, HH:MM, without seconds', () => {
		expect(timeInText(new Date(2026, 6, 15, 8, 5, 0))).toBe('08:05');
		expect(timeInText(new Date(2026, 6, 14, 23, 59, 59))).toBe('23:59');
		expect(timeInText(new Date(2026, 6, 15, 0, 0, 0))).toBe('00:00');
	});
});

describe('dateAndTimeInText', () => {
	it('is the local date and time, YYYY-MM-DD HH:MM, with leading zeros and without seconds', () => {
		expect(dateAndTimeInText(new Date(2026, 6, 15, 8, 5, 0))).toBe('2026-07-15 08:05');
		expect(dateAndTimeInText(new Date(2026, 6, 5, 0, 9, 59))).toBe('2026-07-05 00:09');
		expect(dateAndTimeInText(new Date(2025, 11, 31, 23, 59, 59))).toBe('2025-12-31 23:59');
	});
});
