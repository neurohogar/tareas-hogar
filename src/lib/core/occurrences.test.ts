import { describe, expect, it } from 'vitest';
import { isOccurrence, firstLaterOccurrence, lastOccurrenceBetween } from './occurrences';
import type { Weekday, CalendarRecurrence } from './task';

const day = (year: number, month: number, d: number) => new Date(year, month - 1, d);
const weekly = (...weekdays: Weekday[]): CalendarRecurrence => ({
	mode: 'calendario',
	weekdays
});
const monthly = (...monthDays: number[]): CalendarRecurrence => ({ mode: 'calendario', monthDays });

describe('isOccurrence', () => {
	it.each([
		['lunes', day(2026, 7, 13)],
		['martes', day(2026, 7, 14)],
		['sábado', day(2026, 7, 18)],
		['domingo', day(2026, 7, 19)]
	] as const)('a weekly one occurs on the matching %s', (name, date) => {
		expect(isOccurrence(weekly(name), date)).toBe(true);
		expect(isOccurrence(weekly(name), day(2026, 7, date.getDate() + 1))).toBe(false);
	});

	it('a monthly one occurs on its days of the month', () => {
		expect(isOccurrence(monthly(10, 20), day(2026, 7, 20))).toBe(true);
		expect(isOccurrence(monthly(10, 20), day(2026, 7, 21))).toBe(false);
	});

	it('a day that does not exist in the month falls on the last day of that month', () => {
		expect(isOccurrence(monthly(31), day(2026, 6, 30))).toBe(true);
		expect(isOccurrence(monthly(31), day(2026, 7, 30))).toBe(false);
		expect(isOccurrence(monthly(29), day(2026, 2, 28))).toBe(true);
		expect(isOccurrence(monthly(29), day(2028, 2, 28))).toBe(false);
		expect(isOccurrence(monthly(29), day(2028, 2, 29))).toBe(true);
	});
});

describe('firstLaterOccurrence', () => {
	it('is the first occurrence strictly later than the given day', () => {
		expect(firstLaterOccurrence(weekly('martes', 'jueves'), day(2026, 7, 14))).toEqual(day(2026, 7, 16));
		expect(firstLaterOccurrence(weekly('martes', 'jueves'), day(2026, 7, 16))).toEqual(day(2026, 7, 21));
	});

	it('crosses months and years, with the days that do not exist on the last day of the month', () => {
		expect(firstLaterOccurrence(monthly(31), day(2026, 1, 31))).toEqual(day(2026, 2, 28));
		expect(firstLaterOccurrence(monthly(31), day(2026, 2, 28))).toEqual(day(2026, 3, 31));
		expect(firstLaterOccurrence(monthly(30, 31), day(2026, 6, 30))).toEqual(day(2026, 7, 30));
		expect(firstLaterOccurrence(monthly(1), day(2026, 12, 1))).toEqual(day(2027, 1, 1));
	});

	it('returns the day at 00:00 even if the given day has a time', () => {
		expect(firstLaterOccurrence(monthly(15), new Date(2026, 6, 10, 18, 30))).toEqual(day(2026, 7, 15));
	});

	it('rejects a recurrence that violates §4.2 and never occurs (for example, a corrupt document)', () => {
		expect(() => firstLaterOccurrence(weekly(), day(2026, 7, 14))).toThrow('has no occurrence days');
		expect(() => firstLaterOccurrence(monthly(0), day(2026, 7, 14))).toThrow('has no occurrence days');
	});
});

describe('lastOccurrenceBetween', () => {
	const tuesdayAndThursday = weekly('martes', 'jueves');

	it('is the most recent occurrence in (from, to], including the day to', () => {
		expect(lastOccurrenceBetween(tuesdayAndThursday, day(2026, 7, 12), day(2026, 7, 17))).toEqual(day(2026, 7, 16));
		expect(lastOccurrenceBetween(tuesdayAndThursday, day(2026, 7, 12), day(2026, 7, 16))).toEqual(day(2026, 7, 16));
	});

	it('excludes the day from', () => {
		expect(lastOccurrenceBetween(tuesdayAndThursday, day(2026, 7, 14), day(2026, 7, 15))).toBeUndefined();
	});

	it('there is none if to is not later than from', () => {
		expect(lastOccurrenceBetween(tuesdayAndThursday, day(2026, 7, 16), day(2026, 7, 14))).toBeUndefined();
	});
});
