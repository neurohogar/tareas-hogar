import { describe, expect, it } from 'vitest';
import { isOccurrence, firstLaterOccurrence, lastOccurrenceBetween } from './occurrences';
import type { Weekday, CalendarRecurrence } from './task';

const day = (year: number, month: number, d: number) => new Date(year, month - 1, d);
const weekly = (...weekdays: Weekday[]): CalendarRecurrence => ({
	mode: 'calendario',
	weekdays
});
const monthly = (...monthDays: number[]): CalendarRecurrence => ({ mode: 'calendario', monthDays });

describe('esOcurrencia', () => {
	it.each([
		['lunes', day(2026, 7, 13)],
		['martes', day(2026, 7, 14)],
		['sábado', day(2026, 7, 18)],
		['domingo', day(2026, 7, 19)]
	] as const)('una semanal ocurre el %s que corresponde', (name, date) => {
		expect(isOccurrence(weekly(name), date)).toBe(true);
		expect(isOccurrence(weekly(name), day(2026, 7, date.getDate() + 1))).toBe(false);
	});

	it('una mensual ocurre en sus días del mes', () => {
		expect(isOccurrence(monthly(10, 20), day(2026, 7, 20))).toBe(true);
		expect(isOccurrence(monthly(10, 20), day(2026, 7, 21))).toBe(false);
	});

	it('un día que no existe en el mes cae en el último día de ese mes', () => {
		expect(isOccurrence(monthly(31), day(2026, 6, 30))).toBe(true);
		expect(isOccurrence(monthly(31), day(2026, 7, 30))).toBe(false);
		expect(isOccurrence(monthly(29), day(2026, 2, 28))).toBe(true);
		expect(isOccurrence(monthly(29), day(2028, 2, 28))).toBe(false);
		expect(isOccurrence(monthly(29), day(2028, 2, 29))).toBe(true);
	});
});

describe('primeraOcurrenciaPosterior', () => {
	it('es la primera ocurrencia estrictamente posterior al día dado', () => {
		expect(firstLaterOccurrence(weekly('martes', 'jueves'), day(2026, 7, 14))).toEqual(day(2026, 7, 16));
		expect(firstLaterOccurrence(weekly('martes', 'jueves'), day(2026, 7, 16))).toEqual(day(2026, 7, 21));
	});

	it('cruza meses y años, con los días que no existen en el último día del mes', () => {
		expect(firstLaterOccurrence(monthly(31), day(2026, 1, 31))).toEqual(day(2026, 2, 28));
		expect(firstLaterOccurrence(monthly(31), day(2026, 2, 28))).toEqual(day(2026, 3, 31));
		expect(firstLaterOccurrence(monthly(30, 31), day(2026, 6, 30))).toEqual(day(2026, 7, 30));
		expect(firstLaterOccurrence(monthly(1), day(2026, 12, 1))).toEqual(day(2027, 1, 1));
	});

	it('devuelve el día a las 00:00 aunque el día dado tenga hora', () => {
		expect(firstLaterOccurrence(monthly(15), new Date(2026, 6, 10, 18, 30))).toEqual(day(2026, 7, 15));
	});

	it('rechaza una recurrencia que viola §4.2 y no ocurre nunca (por ejemplo, un documento corrupto)', () => {
		expect(() => firstLaterOccurrence(weekly(), day(2026, 7, 14))).toThrow('no tiene días de ocurrencia');
		expect(() => firstLaterOccurrence(monthly(0), day(2026, 7, 14))).toThrow('no tiene días de ocurrencia');
	});
});

describe('ultimaOcurrenciaEntre', () => {
	const tuesdayAndThursday = weekly('martes', 'jueves');

	it('es la ocurrencia más reciente en (desde, hasta], incluido el día hasta', () => {
		expect(lastOccurrenceBetween(tuesdayAndThursday, day(2026, 7, 12), day(2026, 7, 17))).toEqual(day(2026, 7, 16));
		expect(lastOccurrenceBetween(tuesdayAndThursday, day(2026, 7, 12), day(2026, 7, 16))).toEqual(day(2026, 7, 16));
	});

	it('excluye el día desde', () => {
		expect(lastOccurrenceBetween(tuesdayAndThursday, day(2026, 7, 14), day(2026, 7, 15))).toBeUndefined();
	});

	it('no hay ninguna si hasta no es posterior a desde', () => {
		expect(lastOccurrenceBetween(tuesdayAndThursday, day(2026, 7, 16), day(2026, 7, 14))).toBeUndefined();
	});
});
