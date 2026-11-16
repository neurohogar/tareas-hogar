import { describe, expect, it } from 'vitest';
import { createRecurringCalendar } from './create-recurring-calendar';
import { createRecurringRelative } from './create-recurring-relative';
import { createOneOff } from './create-one-off';
import { createFromData, taskData } from './task-data';
import { EFFORT_OPTIONS, effortText } from './effort';
import type { Effort, Task } from './task';

const NOW = new Date(2026, 6, 15, 8, 0, 0);

describe('textoDeEsfuerzo', () => {
	it('da el nivel en texto', () => {
		expect(effortText('rapida')).toBe('Rápida');
		expect(effortText('media')).toBe('Media');
		expect(effortText('larga')).toBe('Larga');
	});

	it('sin esfuerzo, nada', () => {
		expect(effortText(undefined)).toBeUndefined();
	});
});

describe('OPCIONES_DE_ESFUERZO', () => {
	it('el selector empieza en "Sin estimar", que es sin el campo, y sigue con los tres niveles', () => {
		expect(EFFORT_OPTIONS).toStrictEqual([
			{ value: undefined, text: 'Sin estimar' },
			{ value: 'rapida', text: 'Rápida (≤ 5 min)' },
			{ value: 'media', text: 'Media (≈ 15 min)' },
			{ value: 'larga', text: 'Larga' }
		]);
	});
});

describe('crear con esfuerzo', () => {
	it.each<Effort>(['rapida', 'media', 'larga'])('una puntual guarda el esfuerzo %s', (effort) => {
		expect(createOneOff({ title: 'Pagar', effort }, 't1', NOW)).toStrictEqual({
			ok: true,
			task: { id: 't1', title: 'Pagar', effort, kind: 'puntual', createdAt: NOW }
		});
	});

	it('sin esfuerzo, la tarea queda sin el campo', () => {
		expect(createOneOff({ title: 'Pagar', effort: undefined }, 't1', NOW)).toStrictEqual({
			ok: true,
			task: { id: 't1', title: 'Pagar', kind: 'puntual', createdAt: NOW }
		});
	});

	it('una periódica relativa guarda el esfuerzo', () => {
		expect(createRecurringRelative({ title: 'Regar', every: 2, unit: 'dias', effort: 'rapida' }, 't1', NOW)).toStrictEqual({
			ok: true,
			task: {
				id: 't1',
				title: 'Regar',
				effort: 'rapida',
				kind: 'periodica',
				recurrence: { mode: 'relativo', every: 2, unit: 'dias' },
				createdAt: NOW
			}
		});
	});

	it('una periódica de calendario guarda el esfuerzo', () => {
		const data = { title: 'Basura', weekdays: ['martes'] as const, monthDays: [], effort: 'larga' as const };

		expect(createRecurringCalendar(data, 't1', NOW)).toStrictEqual({
			ok: true,
			task: {
				id: 't1',
				title: 'Basura',
				effort: 'larga',
				kind: 'periodica',
				recurrence: { mode: 'calendario', weekdays: ['martes'] },
				createdAt: NOW
			}
		});
	});
});

describe('datosDeTarea con esfuerzo', () => {
	const ONE_OFF: Task = { id: 't1', title: 'Pagar', kind: 'puntual', createdAt: NOW };

	it('carga el esfuerzo de la tarea', () => {
		expect(taskData({ ...ONE_OFF, effort: 'media' })).toStrictEqual({ shape: 'puntual', title: 'Pagar', effort: 'media' });
	});

	it('sin esfuerzo, sin la clave', () => {
		expect(taskData(ONE_OFF)).toStrictEqual({ shape: 'puntual', title: 'Pagar' });
	});

	it('es la inversa de crearSegunDatos', () => {
		const task: Task = { ...ONE_OFF, effort: 'larga' };

		expect(createFromData(taskData(task), 't1', NOW)).toStrictEqual({ ok: true, task });
	});
});
