import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createRecurringCalendar } from './create-recurring-calendar';
import { WEEKDAYS, type Weekday } from './task';

const NOW = new Date(2026, 6, 15, 8);
const create = (weekdays: readonly Weekday[], monthDays: readonly number[]) =>
	createRecurringCalendar({ title: 'Tarea', weekdays, monthDays }, 'id', NOW);

const weekdays = fc.array(fc.constantFrom(...WEEKDAYS), { maxLength: 10 });
/** Includes values outside 1..31 to exercise the rejection. */
const monthDays = fc.array(fc.integer({ min: -3, max: 35 }), { maxLength: 10 });
const permutation = <T>(xs: readonly T[]) => fc.shuffledSubarray([...xs], { minLength: xs.length });

describe('createRecurringCalendar (properties)', () => {
	it('is valid if and only if there are days of a single kind and the month ones are between 1 and 31', () => {
		fc.assert(
			fc.property(weekdays, monthDays, (week, month) => {
				const onlyOneKind = (week.length > 0) !== (month.length > 0);
				const validMonth = month.every((d) => Number.isInteger(d) && d >= 1 && d <= 31);
				expect(create(week, month).ok).toBe(onlyOneKind && validMonth);
			})
		);
	});

	it('saves the weekdays as a set: without repeats, in week order', () => {
		const weekWithPermutation = weekdays
			.filter((d) => d.length > 0)
			.chain((d) => permutation(d).map((other) => [d, other] as const));
		fc.assert(
			fc.property(weekWithPermutation, ([week, other]) => {
				const result = create(week, []);
				expect(result).toEqual(create(other, []));
				expect(result.ok && result.task.recurrence).toEqual({
					mode: 'calendario',
					weekdays: WEEKDAYS.filter((d) => week.includes(d))
				});
			})
		);
	});

	it('saves the month days as a set: without repeats, from lowest to highest', () => {
		const monthWithPermutation = fc
			.array(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 10 })
			.chain((d) => permutation(d).map((other) => [d, other] as const));
		fc.assert(
			fc.property(monthWithPermutation, ([month, other]) => {
				const result = create([], month);
				expect(result).toEqual(create([], other));
				const savedOnes = result.ok && 'monthDays' in result.task.recurrence ? result.task.recurrence.monthDays : [];
				expect(new Set(savedOnes)).toEqual(new Set(month));
				expect(savedOnes.every((d, i) => i === 0 || savedOnes[i - 1] < d)).toBe(true);
			})
		);
	});
});
