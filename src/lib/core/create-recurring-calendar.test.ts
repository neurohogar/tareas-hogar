import { describe, expect, it } from 'vitest';
import { createRecurringCalendar } from './create-recurring-calendar';

const NOW = new Date(2026, 6, 15, 8, 0, 0);

describe('crearPeriodicaCalendario', () => {
	it('crea una semanal con id, creadaEn y solo los días de la semana', () => {
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

	it('crea una mensual con solo los días del mes', () => {
		const result = createRecurringCalendar({ title: 'Pagar', weekdays: [], monthDays: [10, 31] }, 't1', NOW);

		expect(result.ok && result.task.recurrence).toStrictEqual({ mode: 'calendario', monthDays: [10, 31] });
	});

	it('guarda los días como conjunto: en el orden de la semana y sin repetir', () => {
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

	it('guarda los días del mes de menor a mayor y sin repetir', () => {
		const result = createRecurringCalendar({ title: 'T', weekdays: [], monthDays: [20, 5, 20, 31] }, 't1', NOW);

		expect(result.ok && result.task.recurrence).toStrictEqual({ mode: 'calendario', monthDays: [5, 20, 31] });
	});

	it.each(['', '   '])('rechaza el título vacío o de solo espacios (%j)', (title) => {
		expect(createRecurringCalendar({ title, weekdays: ['lunes'], monthDays: [] }, 't1', NOW)).toEqual({
			ok: false,
			errors: { title: 'vacio' }
		});
	});

	it('rechaza la falta de días', () => {
		expect(createRecurringCalendar({ title: 'T', weekdays: [], monthDays: [] }, 't1', NOW)).toEqual({
			ok: false,
			errors: { days: 'faltan' }
		});
	});

	it.each([[[0]], [[32]], [[-1]], [[1.5]], [[Number.NaN]], [[15, 32]], [[0, 10]]])(
		'rechaza toda la tarea si algún día del mes no es entero entre 1 y 31 (%j)',
		(monthDays) => {
			expect(createRecurringCalendar({ title: 'T', weekdays: [], monthDays }, 't1', NOW)).toEqual({
				ok: false,
				errors: { days: 'diaDelMesInvalido' }
			});
		}
	);

	it('acepta los extremos 1 y 31', () => {
		expect(createRecurringCalendar({ title: 'T', weekdays: [], monthDays: [1, 31] }, 't1', NOW).ok).toBe(true);
	});

	it('rechaza combinar días de la semana y del mes', () => {
		expect(createRecurringCalendar({ title: 'T', weekdays: ['martes'], monthDays: [15] }, 't1', NOW)).toEqual({
			ok: false,
			errors: { days: 'combinados' }
		});
	});

	it('informa el título vacío junto con el error de días', () => {
		expect(createRecurringCalendar({ title: ' ', weekdays: [], monthDays: [] }, 't1', NOW)).toEqual({
			ok: false,
			errors: { title: 'vacio', days: 'faltan' }
		});
	});
});
