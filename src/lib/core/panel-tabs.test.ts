import { describe, expect, it } from 'vitest';
import type { TaskData } from './task-data';
import {
	saveBarVisible,
	fieldsWithError,
	destinationOnSaveFailure,
	TAB_ON_OPEN,
	panelPresentation,
	repetitionOnOpen,
	panelSections,
	markedSections
} from './panel-tabs';

describe('panelPresentation (spec §6.2, Panel presentation)', () => {
	it.each([22.5, 39.9, 40])('%s rem is a phone: in tabs', (width) => {
		expect(panelPresentation(width)).toBe('pestanas');
	});

	it.each([40.1, 80])('%s rem is a wide screen: in consecutive sections', (width) => {
		expect(panelPresentation(width)).toBe('secciones');
	});
});

describe('panelSections (spec §6.2, Tabs)', () => {
	it('when creating, Acciones does not appear', () => {
		expect(panelSections('crear')).toEqual(['Tarea', 'Cuándo']);
	});

	it('when editing it always appears, at the end', () => {
		expect(panelSections('editar')).toEqual(['Tarea', 'Cuándo', 'Acciones']);
	});
});

describe('TAB_ON_OPEN (spec §6.2, Tabs)', () => {
	it('always opens on Tarea', () => {
		expect(TAB_ON_OPEN).toBe('Tarea');
	});
});

describe('markedSections (spec §6.2, Errors)', () => {
	it('without errors it marks none', () => {
		expect(markedSections([])).toEqual([]);
	});

	it('an error in Título marks Tarea', () => {
		expect(markedSections(['Título'])).toEqual(['Tarea']);
	});

	it.each(['fecha límite', 'Cada', 'días', 'horario'] as const)('an error in %s marks Cuándo', (field) => {
		expect(markedSections([field])).toEqual(['Cuándo']);
	});

	it('two errors in the same section mark it only once', () => {
		expect(markedSections(['horario', 'días'])).toEqual(['Cuándo']);
	});

	it('the marked ones go in tab order, not in error order', () => {
		expect(markedSections(['horario', 'Título'])).toEqual(['Tarea', 'Cuándo']);
	});
});

describe('destinationOnSaveFailure (spec §6.2, Errors)', () => {
	it('in tabs it jumps to the tab of the only error', () => {
		expect(destinationOnSaveFailure(['horario'], 'pestanas')).toEqual({ tab: 'Cuándo', field: 'horario' });
	});

	it('Tarea goes before Cuándo, even if the Cuándo error arrives first', () => {
		expect(destinationOnSaveFailure(['horario', 'Título'], 'pestanas')).toEqual({ tab: 'Tarea', field: 'Título' });
	});

	it.each([
		[['días', 'Título'], 'Título'],
		[['días', 'fecha límite'], 'fecha límite'],
		[['horario', 'Cada'], 'Cada'],
		[['horario', 'días'], 'días']
	] as const)('of %j the first is %s: the order in which the fields are seen', (fields, field) => {
		expect(destinationOnSaveFailure(fields, 'pestanas')?.field).toBe(field);
	});

	it('in consecutive sections there is no tab: only the field', () => {
		expect(destinationOnSaveFailure(['horario', 'Título'], 'secciones')).toEqual({ tab: undefined, field: 'Título' });
	});

	it('without errors there is nowhere to go', () => {
		expect(destinationOnSaveFailure([], 'pestanas')).toBeUndefined();
	});
});

describe('saveBarVisible (spec §6.2, On-screen keyboard)', () => {
	it('it is hidden with the on-screen keyboard open', () => {
		expect(saveBarVisible(true)).toBe(false);
	});

	it('it is visible with the on-screen keyboard closed', () => {
		expect(saveBarVisible(false)).toBe(true);
	});
});

describe('fieldsWithError (spec §6.2, Errors)', () => {
	it('without errors there are no fields', () => {
		expect(fieldsWithError({}, 'puntual')).toEqual([]);
	});

	it('lists the fields with an error in reading order', () => {
		expect(fieldsWithError({ schedule: 'incompleto', title: 'vacio' }, 'puntual')).toEqual(['Título', 'horario']);
	});

	it.each([
		['fecha límite', { dueDate: 'invalida' as const }, 'puntual'],
		['Cada', { every: 'invalido' as const }, 'relativo'],
		['días', { days: 'faltan' as const }, 'semanal'],
		['días', { days: 'faltan' as const }, 'mensual']
	] as const)('the error of %s only counts with its Se repite option', (field, errors, repetition) => {
		expect(fieldsWithError(errors, repetition)).toEqual([field]);
		const other = repetition === 'puntual' ? 'relativo' : 'puntual';
		expect(fieldsWithError(errors, other)).toEqual([]);
	});
});

describe('repetitionOnOpen (spec §6.2): the Se repite option that comes selected', () => {
	it('when creating, without task data, it comes as No se repite', () => {
		expect(repetitionOnOpen()).toBe('puntual');
	});

	it.each<[TaskData, string]>([
		[{ shape: 'puntual', title: 'Pagar' }, 'puntual'],
		[{ shape: 'relativa', title: 'Regar', every: 3, unit: 'dias' }, 'relativo'],
		[{ shape: 'calendario', title: 'Sacar', weekdays: ['lunes'], monthDays: [] }, 'semanal'],
		[{ shape: 'calendario', title: 'Pagar', weekdays: [], monthDays: [15] }, 'mensual']
	])('when editing, the task option comes selected: %j', (data, option) => {
		expect(repetitionOnOpen(data)).toBe(option);
	});
});
