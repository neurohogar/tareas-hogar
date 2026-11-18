import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { weekday, dayOfMonth, dayFromIso, isoDay, daysBetween, startOfDay, readIsoDay, addDays, lastDayOfMonth } from './days';
import { WEEKDAYS } from './task';

/** A local day between 1970 and ~2100; Date normalizes the days that overflow the month. */
const day = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
/** Any moment of that day (or of the next one, if a time change pushes it). */
const moment = fc
	.tuple(day, fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }))
	.map(([d, hour, minute]) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute));
const amount = fc.integer({ min: -1_000, max: 1_000 });

describe('local days (properties)', () => {
	it('daysBetween undoes addDays, does not look at the time and is antisymmetric', () => {
		fc.assert(
			fc.property(moment, moment, amount, (a, b, n) => {
				expect(daysBetween(a, addDays(a, n))).toBe(n);
				expect(daysBetween(a, b)).toBe(daysBetween(startOfDay(a), startOfDay(b)));
				expect(daysBetween(b, a) + daysBetween(a, b) === 0).toBe(true);
			})
		);
	});

	it('daysBetween is additive: from a to c through b', () => {
		fc.assert(
			fc.property(moment, moment, moment, (a, b, c) => {
				expect(daysBetween(a, c)).toBe(daysBetween(a, b) + daysBetween(b, c));
			})
		);
	});

	it('startOfDay is idempotent, is not later than the moment and keeps the day', () => {
		fc.assert(
			fc.property(moment, (m) => {
				const start = startOfDay(m);
				expect(startOfDay(start)).toEqual(start);
				expect(start.getTime()).toBeLessThanOrEqual(m.getTime());
				expect(isoDay(start)).toBe(isoDay(m));
			})
		);
	});

	it('addDays composes: adding a and then b is adding a + b, and adding 0 is the start of the day', () => {
		fc.assert(
			fc.property(moment, amount, amount, (m, a, b) => {
				expect(addDays(addDays(m, a), b)).toEqual(addDays(m, a + b));
				expect(addDays(m, 0)).toEqual(startOfDay(m));
			})
		);
	});

	it('the week advances one day per day, from Monday to Sunday, and repeats every 7', () => {
		fc.assert(
			fc.property(day, amount, (d, n) => {
				const index = WEEKDAYS.indexOf(weekday(d));
				const expected = WEEKDAYS[(((index + n) % 7) + 7) % 7];
				expect(weekday(addDays(d, n))).toBe(expected);
			})
		);
	});

	it('the last day of the month is between 28 and 31 and the next day is a 1', () => {
		fc.assert(
			fc.property(day, (d) => {
				const last = lastDayOfMonth(d);
				expect(last).toBeGreaterThanOrEqual(28);
				expect(last).toBeLessThanOrEqual(31);
				expect(dayOfMonth(addDays(d, last - dayOfMonth(d) + 1))).toBe(1);
			})
		);
	});

	it('YYYY-MM-DD round trip: the text reads the start of the same day and is written back the same', () => {
		fc.assert(
			fc.property(moment, (m) => {
				const text = isoDay(m);
				expect(dayFromIso(text)).toEqual(startOfDay(m));
				expect(isoDay(dayFromIso(text))).toBe(text);
			})
		);
	});
});

const twoDigits = (n: number) => String(n).padStart(2, '0');
const year = fc.integer({ min: 1, max: 9999 });
const month = fc.integer({ min: 1, max: 12 });
const text = (a: number, m: number, d: number) => `${String(a).padStart(4, '0')}-${twoDigits(m)}-${twoDigits(d)}`;
/** The last day of a month (1..12) of a year, without going through Date. */
const daysInMonth = (a: number, m: number) => {
	const leap = (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;
	return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
};

describe('readIsoDay (properties, spec §4.1)', () => {
	it('every date that exists, from 0001 to 9999, is read and written back the same', () => {
		fc.assert(
			fc.property(
				year.chain((a) => month.chain((m) => fc.integer({ min: 1, max: daysInMonth(a, m) }).map((d) => text(a, m, d)))),
				(date) => {
					const read = readIsoDay(date);
					expect(read).toBeDefined();
					expect(isoDay(read as Date)).toBe(date);
					expect(startOfDay(read as Date)).toEqual(read);
				}
			)
		);
	});

	it('a date shaped YYYY-MM-DD but nonexistent is always rejected', () => {
		const dayOutsideMonth = year.chain((a) =>
			month.chain((m) => fc.integer({ min: daysInMonth(a, m) + 1, max: 99 }).map((d) => text(a, m, d)))
		);
		const nonexistentMonth = fc
			.tuple(year, fc.oneof(fc.constant(0), fc.integer({ min: 13, max: 99 })), fc.integer({ min: 1, max: 28 }))
			.map(([a, m, d]) => text(a, m, d));
		const dayZero = fc.tuple(year, month).map(([a, m]) => text(a, m, 0));
		fc.assert(
			fc.property(fc.oneof(dayOutsideMonth, nonexistentMonth, dayZero), (date) => {
				expect(readIsoDay(date)).toBeUndefined();
			})
		);
	});

	it('a text that does not have the YYYY-MM-DD shape is always rejected', () => {
		fc.assert(
			fc.property(
				fc.string().filter((s) => !/^\d{4}-\d{2}-\d{2}$/.test(s)),
				(s) => {
					expect(readIsoDay(s)).toBeUndefined();
				}
			)
		);
	});
});
