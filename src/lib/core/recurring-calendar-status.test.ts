import { describe, expect, it } from 'vitest';
import { recurringCalendarStatus } from './recurring-calendar-status';
import type { Completion, CalendarRecurrence } from './task';

const TUESDAY_AND_THURSDAY: CalendarRecurrence = { mode: 'calendario', weekdays: ['martes', 'jueves'] };
const THE_31ST: CalendarRecurrence = { mode: 'calendario', monthDays: [31] };
const moment = (month: number, day: number, hour = 0, minute = 0, secondOne = 0) =>
	new Date(2026, month - 1, day, hour, minute, secondOne);
const covers = (id: string, completedAt: Date, coveredOccurrence: Date): Completion => ({
	id,
	taskId: 't1',
	completedAt,
	coveredOccurrence
});

describe('estadoPeriodicaCalendario, nunca completada (P = el día anterior a creadaEn)', () => {
	const createdOnMonday = moment(7, 13, 8);

	it('está en espera antes de la primera ocurrencia, con progreso desde creadaEn', () => {
		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdOnMonday, [], moment(7, 13, 16))).toEqual({
			kind: 'en espera',
			progress: 0.5
		});
	});

	it('está pendiente el día de la primera ocurrencia, de 00:00:00 a 23:59:59', () => {
		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdOnMonday, [], moment(7, 14))).toEqual({ kind: 'pendiente' });
		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdOnMonday, [], moment(7, 14, 23, 59, 59))).toEqual({
			kind: 'pendiente'
		});
	});

	it('creada en un día de ocurrencia, ya está pendiente ese día', () => {
		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, moment(7, 14, 8), [], moment(7, 14, 8))).toEqual({
			kind: 'pendiente'
		});
	});

	it('está atrasada una sola vez pasado el día de la primera ocurrencia', () => {
		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdOnMonday, [], moment(7, 15))).toEqual({ kind: 'atrasada' });
		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdOnMonday, [], moment(8, 20, 10))).toEqual({
			kind: 'atrasada'
		});
	});
});

describe('estadoPeriodicaCalendario, completada (P = la mayor ocurrencia cubierta)', () => {
	const createdAt = moment(1, 1);

	it('usa la ocurrencia cubierta, no el día del completado', () => {
		// Completada el lunes cubriendo el martes: el martes ya no está pendiente.
		const completions = [covers('c1', moment(7, 13, 12), moment(7, 14))];

		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdAt, completions, moment(7, 14, 18))).toEqual({
			kind: 'en espera',
			progress: 0.5
		});
	});

	it('toma la mayor ocurrencia cubierta aunque se haya registrado antes', () => {
		const completions = [covers('c1', moment(7, 16, 10), moment(7, 16)), covers('c2', moment(7, 14, 10), moment(7, 14))];

		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdAt, completions, moment(7, 17, 10)).kind).toBe('en espera');
	});

	it('mide la espera desde el completadoEn más reciente, aunque se haya registrado antes', () => {
		const completions = [covers('c1', moment(7, 14, 12), moment(7, 14)), covers('c2', moment(7, 13, 12), moment(7, 14))];

		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdAt, completions, moment(7, 14, 21))).toEqual({
			kind: 'en espera',
			progress: 0.25
		});
	});

	it('pendiente el día de N y atrasada al día siguiente, con el 31 en el último día del mes', () => {
		const completions = [covers('c1', moment(5, 31), moment(5, 31))];

		expect(recurringCalendarStatus(THE_31ST, createdAt, completions, moment(6, 29, 23, 59, 59)).kind).toBe('en espera');
		expect(recurringCalendarStatus(THE_31ST, createdAt, completions, moment(6, 30))).toEqual({ kind: 'pendiente' });
		expect(recurringCalendarStatus(THE_31ST, createdAt, completions, moment(7, 1))).toEqual({ kind: 'atrasada' });
	});

	it('ignora los completados sin ocurrencia cubierta para P, pero no para el inicio de espera', () => {
		const completions = [
			covers('c1', moment(7, 14, 0), moment(7, 14)),
			{ id: 'c2', taskId: 't1', completedAt: moment(7, 15, 0) }
		];

		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdAt, completions, moment(7, 15, 12))).toEqual({
			kind: 'en espera',
			progress: 0.5
		});
	});

	it('con P posterior a hoy, la tarea está en espera con progreso entre 0 y 1', () => {
		const completions = [covers('c1', moment(7, 20, 12), moment(7, 21))];

		expect(recurringCalendarStatus(TUESDAY_AND_THURSDAY, createdAt, completions, moment(7, 18, 0))).toEqual({
			kind: 'en espera',
			progress: 0
		});
	});
});
