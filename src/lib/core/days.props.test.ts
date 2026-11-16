import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { weekday, dayOfMonth, dayFromIso, isoDay, daysBetween, startOfDay, readIsoDay, addDays, lastDayOfMonth } from './days';
import { WEEKDAYS } from './task';

/** Un día local entre 1970 y ~2100; Date normaliza los días que desbordan el mes. */
const day = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
/** Un momento cualquiera de ese día (o del siguiente, si un cambio de hora lo empuja). */
const moment = fc
	.tuple(day, fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }))
	.map(([d, hour, minute]) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute));
const amount = fc.integer({ min: -1_000, max: 1_000 });

describe('días locales (propiedades)', () => {
	it('diasEntre deshace sumarDias, no mira la hora y es antisimétrico', () => {
		fc.assert(
			fc.property(moment, moment, amount, (a, b, n) => {
				expect(daysBetween(a, addDays(a, n))).toBe(n);
				expect(daysBetween(a, b)).toBe(daysBetween(startOfDay(a), startOfDay(b)));
				expect(daysBetween(b, a) + daysBetween(a, b) === 0).toBe(true);
			})
		);
	});

	it('diasEntre es aditivo: de a a c pasando por b', () => {
		fc.assert(
			fc.property(moment, moment, moment, (a, b, c) => {
				expect(daysBetween(a, c)).toBe(daysBetween(a, b) + daysBetween(b, c));
			})
		);
	});

	it('inicioDelDia es idempotente, no es posterior al momento y conserva el día', () => {
		fc.assert(
			fc.property(moment, (m) => {
				const start = startOfDay(m);
				expect(startOfDay(start)).toEqual(start);
				expect(start.getTime()).toBeLessThanOrEqual(m.getTime());
				expect(isoDay(start)).toBe(isoDay(m));
			})
		);
	});

	it('sumarDias compone: sumar a y después b es sumar a + b, y sumar 0 es el inicio del día', () => {
		fc.assert(
			fc.property(moment, amount, amount, (m, a, b) => {
				expect(addDays(addDays(m, a), b)).toEqual(addDays(m, a + b));
				expect(addDays(m, 0)).toEqual(startOfDay(m));
			})
		);
	});

	it('la semana avanza un día por día, de lunes a domingo, y se repite cada 7', () => {
		fc.assert(
			fc.property(day, amount, (d, n) => {
				const index = WEEKDAYS.indexOf(weekday(d));
				const expected = WEEKDAYS[(((index + n) % 7) + 7) % 7];
				expect(weekday(addDays(d, n))).toBe(expected);
			})
		);
	});

	it('el último día del mes está entre 28 y 31 y el día siguiente es un 1', () => {
		fc.assert(
			fc.property(day, (d) => {
				const last = lastDayOfMonth(d);
				expect(last).toBeGreaterThanOrEqual(28);
				expect(last).toBeLessThanOrEqual(31);
				expect(dayOfMonth(addDays(d, last - dayOfMonth(d) + 1))).toBe(1);
			})
		);
	});

	it('AAAA-MM-DD ida y vuelta: el texto lee el inicio del mismo día y vuelve a escribirse igual', () => {
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
/** El último día de un mes (1..12) de un año, sin pasar por Date. */
const daysInMonth = (a: number, m: number) => {
	const leap = (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;
	return [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
};

describe('leerDiaIso (propiedades, spec §4.1)', () => {
	it('toda fecha que existe, de 0001 a 9999, se lee y vuelve a escribirse igual', () => {
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

	it('una fecha con forma AAAA-MM-DD pero inexistente siempre se rechaza', () => {
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

	it('un texto que no tiene la forma AAAA-MM-DD siempre se rechaza', () => {
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
