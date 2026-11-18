import { describe, expect, it } from 'vitest';
import {
	yearOf,
	weekday,
	dayOfMonth,
	dayFromIso,
	isoDay,
	daysBetween,
	atTheMinute,
	hourAndMinute,
	startOfDay,
	monthOf,
	readIsoDay,
	addDays,
	lastDayOfMonth
} from './days';

describe('local days', () => {
	it('the start of the day is 00:00 local of that day', () => {
		expect(startOfDay(new Date(2026, 6, 15, 23, 59, 59))).toEqual(new Date(2026, 6, 15));
	});

	it('adds and subtracts days across months and years', () => {
		expect(addDays(new Date(2026, 11, 31), 1)).toEqual(new Date(2027, 0, 1));
		expect(addDays(new Date(2026, 2, 1), -1)).toEqual(new Date(2026, 1, 28));
	});

	it('names the weekday, starting on Monday', () => {
		expect(weekday(new Date(2026, 6, 13))).toBe('lunes');
		expect(weekday(new Date(2026, 6, 19, 23, 59))).toBe('domingo');
	});

	it('knows the month (1..12) and the year of a local day', () => {
		expect(monthOf(new Date(2026, 0, 31, 23, 59))).toBe(1);
		expect(monthOf(new Date(2025, 11, 1))).toBe(12);
		expect(yearOf(new Date(2025, 11, 31, 23, 59, 59))).toBe(2025);
	});

	it('gives the local hour and minute of a moment, without the seconds', () => {
		expect(hourAndMinute(new Date(2026, 6, 14, 23, 59, 59))).toStrictEqual({ hour: 23, minute: 59 });
		expect(hourAndMinute(new Date(2026, 6, 15, 0, 0, 0))).toStrictEqual({ hour: 0, minute: 0 });
	});

	it('builds the instant of a minute of the day, regardless of the time of the moment that names the day', () => {
		expect(atTheMinute(new Date(2026, 6, 15, 17, 45, 30), 8 * 60 + 30)).toEqual(new Date(2026, 6, 15, 8, 30, 0));
		expect(atTheMinute(new Date(2026, 6, 15), 23 * 60 + 59)).toEqual(new Date(2026, 6, 15, 23, 59, 0));
	});

	it('counts the local days between two moments, without looking at the time', () => {
		expect(daysBetween(new Date(2026, 6, 13, 23, 59, 59), new Date(2026, 6, 15, 0, 0, 0))).toBe(2);
		expect(daysBetween(new Date(2026, 6, 15, 0, 0, 0), new Date(2026, 6, 15, 23, 59, 59))).toBe(0);
		expect(daysBetween(new Date(2025, 11, 30, 22), new Date(2026, 0, 2, 8))).toBe(3);
		expect(daysBetween(new Date(2026, 6, 16, 8), new Date(2026, 6, 15, 12))).toBe(-1);
	});

	it('counts whole days even if one does not last 24 hours (time change)', () => {
		expect(daysBetween(new Date(2026, 0, 1), new Date(2026, 6, 1))).toBe(181);
		expect(daysBetween(new Date(2026, 6, 1), new Date(2026, 11, 1))).toBe(153);
	});

	it('knows the number of the day within the month', () => {
		expect(dayOfMonth(new Date(2026, 6, 31, 12))).toBe(31);
	});

	it('knows the last day of each month, with a leap February', () => {
		expect(lastDayOfMonth(new Date(2026, 5, 10))).toBe(30);
		expect(lastDayOfMonth(new Date(2026, 1, 10))).toBe(28);
		expect(lastDayOfMonth(new Date(2028, 1, 10))).toBe(29);
	});
});

describe('ISO date of a day (spec §4.4: coveredOccurrence is a date)', () => {
	it('writes the local day as YYYY-MM-DD, with leading zeros', () => {
		expect(isoDay(new Date(2026, 6, 5))).toBe('2026-07-05');
		expect(isoDay(new Date(987, 11, 31))).toBe('0987-12-31');
	});

	it('reads YYYY-MM-DD as 00:00 local of that day', () => {
		expect(dayFromIso('2026-07-05')).toEqual(new Date(2026, 6, 5));
	});

	it('round trip keeps the day', () => {
		const day = new Date(2028, 1, 29);
		expect(dayFromIso(isoDay(day))).toEqual(day);
	});

	it.each(['2026-7-5', '2026-02-30', '2026-13-01', 'ayer'])('rejects what is not a valid date (%s)', (text) => {
		expect(() => dayFromIso(text)).toThrow();
	});
});

describe('readIsoDay (spec §4.1: the due date has to exist in the calendar)', () => {
	it('reads a date that exists as 00:00 local of that day', () => {
		expect(readIsoDay('2028-02-29')).toEqual(new Date(2028, 1, 29));
	});

	it('reads the years 0001..0099 as such, not as 19xx', () => {
		expect(isoDay(readIsoDay('0026-07-15') as Date)).toBe('0026-07-15');
		expect(isoDay(addDays(readIsoDay('0099-12-31') as Date, 1))).toBe('0100-01-01');
		expect(lastDayOfMonth(readIsoDay('0004-02-10') as Date)).toBe(29);
	});

	it.each(['2026-02-29', '2026-04-31', '2026-13-01', '2026-00-10', '2026-07-00', '2026-7-5', '', 'ayer'])(
		'does not read what is not a date that exists (%j)',
		(text) => {
			expect(readIsoDay(text)).toBeUndefined();
		}
	);
});
