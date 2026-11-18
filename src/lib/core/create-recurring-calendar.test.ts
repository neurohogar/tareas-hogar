import { describe, expect, it } from 'vitest';
import { createRecurringCalendar } from './create-recurring-calendar';

const NOW = new Date(2026, 6, 15, 8, 0, 0);

describe('createRecurringCalendar', () => {
	it('creates a weekly one with id, createdAt and only the weekdays', () => {
		const result = createRecurringCalendar(
			{ title: ' Sacar la basura ', weekdays: ['martes', 'jueves'], monthDays: [] },
			't1',
			NOW
		);

		expect(result).toStrictEqual({
			ok: true,
			task: {
				id: 't1',
				title: 'Sacar la basura',
				kind: 'periodica',
				recurrence: { mode: 'calendario', weekdays: ['martes', 'jueves'] },
				createdAt: NOW
			}
		});
	});

	it('creates a monthly one with only the month days', () => {
		const result = createRecurringCalendar({ title: 'Pagar', weekdays: [], monthDays: [10, 31] }, 't1', NOW);

		expect(result.ok && result.task.recurrence).toStrictEqual({ mode: 'calendario', monthDays: [10, 31] });
	});

	it('saves the days as a set: in week order and without repeats', () => {
		const result = createRecurringCalendar(
			{ title: 'T', weekdays: ['domingo', 'jueves', 'lunes', 'jueves'], monthDays: [] },
			't1',
			NOW
		);

		expect(result.ok && result.task.recurrence).toStrictEqual({
			mode: 'calendario',
			weekdays: ['lunes', 'jueves', 'domingo']
		});
	});

	it('saves the month days from lowest to highest and without repeats', () => {
		const result = createRecurringCalendar({ title: 'T', weekdays: [], monthDays: [20, 5, 20, 31] }, 't1', NOW);

		expect(result.ok && result.task.recurrence).toStrictEqual({ mode: 'calendario', monthDays: [5, 20, 31] });
	});

	it.each(['', '   '])('rejects an empty title or one of only spaces (%j)', (title) => {
		expect(createRecurringCalendar({ title, weekdays: ['lunes'], monthDays: [] }, 't1', NOW)).toEqual({
			ok: false,
			errors: { title: 'vacio' }
		});
	});

	it('rejects the lack of days', () => {
		expect(createRecurringCalendar({ title: 'T', weekdays: [], monthDays: [] }, 't1', NOW)).toEqual({
			ok: false,
			errors: { days: 'faltan' }
		});
	});

	it.each([[[0]], [[32]], [[-1]], [[1.5]], [[Number.NaN]], [[15, 32]], [[0, 10]]])(
		'rejects the whole task if some month day is not an integer between 1 and 31 (%j)',
		(monthDays) => {
			expect(createRecurringCalendar({ title: 'T', weekdays: [], monthDays }, 't1', NOW)).toEqual({
				ok: false,
				errors: { days: 'diaDelMesInvalido' }
			});
		}
	);

	it('accepts the extremes 1 and 31', () => {
		expect(createRecurringCalendar({ title: 'T', weekdays: [], monthDays: [1, 31] }, 't1', NOW).ok).toBe(true);
	});

	it('rejects combining weekdays and month days', () => {
		expect(createRecurringCalendar({ title: 'T', weekdays: ['martes'], monthDays: [15] }, 't1', NOW)).toEqual({
			ok: false,
			errors: { days: 'combinados' }
		});
	});

	it('reports the empty title together with the days error', () => {
		expect(createRecurringCalendar({ title: ' ', weekdays: [], monthDays: [] }, 't1', NOW)).toEqual({
			ok: false,
			errors: { title: 'vacio', days: 'faltan' }
		});
	});
});
