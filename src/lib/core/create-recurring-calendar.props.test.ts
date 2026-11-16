import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createRecurringCalendar } from './create-recurring-calendar';
import { WEEKDAYS, type Weekday } from './task';

const NOW = new Date(2026, 6, 15, 8);
const create = (weekdays: readonly Weekday[], monthDays: readonly number[]) =>
	createRecurringCalendar({ title: 'Tarea', weekdays, monthDays }, 'id', NOW);

const weekdays = fc.array(fc.constantFrom(...WEEKDAYS), { maxLength: 10 });
/** Incluye valores fuera de 1..31 para ejercitar el rechazo. */
const monthDays = fc.array(fc.integer({ min: -3, max: 35 }), { maxLength: 10 });
const permutation = <T>(xs: readonly T[]) => fc.shuffledSubarray([...xs], { minLength: xs.length });

describe('crearPeriodicaCalendario (propiedades)', () => {
	it('es válida si y solo si hay días de un solo tipo y los del mes están entre 1 y 31', () => {
		fc.assert(
			fc.property(weekdays, monthDays, (week, month) => {
				const onlyOneKind = (week.length > 0) !== (month.length > 0);
				const validMonth = month.every((d) => Number.isInteger(d) && d >= 1 && d <= 31);
				expect(create(week, month).ok).toBe(onlyOneKind && validMonth);
			})
		);
	});

	it('guarda los días semanales como conjunto: sin repetir, en el orden de la semana', () => {
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

	it('guarda los días del mes como conjunto: sin repetir, de menor a mayor', () => {
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
