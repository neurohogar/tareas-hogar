import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { dayOfMonth, startOfDay, addDays, lastDayOfMonth } from './days';
import { isOccurrence, firstLaterOccurrence, lastOccurrenceBetween } from './occurrences';
import { WEEKDAYS, type CalendarRecurrence } from './task';

const day = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
const moment = fc
	.tuple(day, fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }))
	.map(([d, hour, minute]) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute));
const weekdays = fc.subarray([...WEEKDAYS], { minLength: 1 });
const monthDays = fc
	.uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 6 })
	.map((days) => days.sort((a, b) => a - b));
const recurrence: fc.Arbitrary<CalendarRecurrence> = fc.oneof(
	weekdays.map((d) => ({ mode: 'calendario' as const, weekdays: d })),
	monthDays.map((d) => ({ mode: 'calendario' as const, monthDays: d }))
);

/** The day starts in (from, to]. */
function daysBetween(from: Date, to: Date): Date[] {
	const days: Date[] = [];
	for (let d = addDays(from, 1); d <= to; d = addDays(d, 1)) days.push(d);
	return days;
}

describe('occurrences (properties)', () => {
	it('the first later occurrence is a day start, occurs, and there is no earlier one (at most 31 days)', () => {
		fc.assert(
			fc.property(recurrence, moment, (r, m) => {
				const n = firstLaterOccurrence(r, m);
				const from = startOfDay(m);
				expect(startOfDay(n)).toEqual(n);
				expect(n > from).toBe(true);
				expect(n <= addDays(from, 31)).toBe(true);
				expect(isOccurrence(r, n)).toBe(true);
				expect(daysBetween(from, addDays(n, -1)).some((d) => isOccurrence(r, d))).toBe(false);
			})
		);
	});

	it('the last occurrence between (from, to] is the most recent, or there is none', () => {
		fc.assert(
			fc.property(recurrence, day, fc.integer({ min: -3, max: 70 }), fc.integer({ min: 0, max: 23 }), (r, from, n, hour) => {
				const to = new Date(addDays(from, n).getTime() + hour * 3_600_000);
				const occurrences = daysBetween(from, startOfDay(to)).filter((d) => isOccurrence(r, d));
				expect(lastOccurrenceBetween(r, from, to)).toEqual(occurrences.at(-1));
			})
		);
	});

	it('in each month, each chosen day occurs exactly once; one that does not exist falls on the last day', () => {
		fc.assert(
			fc.property(day, fc.integer({ min: 1, max: 31 }), (d, chosenOne) => {
				const last = lastDayOfMonth(d);
				const ofMonth = daysBetween(addDays(d, -dayOfMonth(d)), addDays(d, last - dayOfMonth(d)));
				const occurrences = ofMonth.filter((x) => isOccurrence({ mode: 'calendario', monthDays: [chosenOne] }, x));
				expect(occurrences.map(dayOfMonth)).toEqual([Math.min(chosenOne, last)]);
			})
		);
	});

	it('in any running week there are as many occurrences as chosen weekdays', () => {
		fc.assert(
			fc.property(weekdays, day, (chosenOnes, d) => {
				const week = daysBetween(addDays(d, -1), addDays(d, 6));
				const r: CalendarRecurrence = { mode: 'calendario', weekdays: chosenOnes };
				expect(week.filter((x) => isOccurrence(r, x))).toHaveLength(chosenOnes.length);
			})
		);
	});

	it('the order and repetitions of the days do not change which days occur', () => {
		const withOtherOrder = recurrence.chain((r) => {
			const days: readonly (string | number)[] = 'weekdays' in r ? r.weekdays : r.monthDays;
			const repeatedItems = [...days, ...days];
			return fc
				.shuffledSubarray(repeatedItems, { minLength: repeatedItems.length })
				.map((others) => [r, { ...r, ['weekdays' in r ? 'weekdays' : 'monthDays']: others } as CalendarRecurrence] as const);
		});
		fc.assert(
			fc.property(withOtherOrder, day, ([r, other], d) => {
				expect(isOccurrence(other, d)).toBe(isOccurrence(r, d));
			})
		);
	});
});
