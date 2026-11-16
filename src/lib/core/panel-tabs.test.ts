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

describe('presentacionDelPanel (spec §6.2, Presentación del panel)', () => {
	it.each([22.5, 39.9, 40])('%s rem es celular: en pestañas', (width) => {
		expect(panelPresentation(width)).toBe('pestanas');
	});

	it.each([40.1, 80])('%s rem es pantalla ancha: en secciones seguidas', (width) => {
		expect(panelPresentation(width)).toBe('secciones');
	});
});

describe('seccionesDelPanel (spec §6.2, Pestañas)', () => {
	it('al crear no aparece Acciones', () => {
		expect(panelSections('crear')).toEqual(['Tarea', 'Cuándo']);
	});

	it('al editar aparece siempre, al final', () => {
		expect(panelSections('editar')).toEqual(['Tarea', 'Cuándo', 'Acciones']);
	});
});

describe('PESTANA_AL_ABRIR (spec §6.2, Pestañas)', () => {
	it('siempre abre en Tarea', () => {
		expect(TAB_ON_OPEN).toBe('Tarea');
	});
});

describe('seccionesMarcadas (spec §6.2, Errores)', () => {
	it('sin errores no marca ninguna', () => {
		expect(markedSections([])).toEqual([]);
	});

	it.each(['Título', 'Etiquetas'] as const)('un error en %s marca Tarea', (field) => {
		expect(markedSections([field])).toEqual(['Tarea']);
	});

	it.each(['fecha límite', 'Cada', 'días', 'horario'] as const)('un error en %s marca Cuándo', (field) => {
		expect(markedSections([field])).toEqual(['Cuándo']);
	});

	it('dos errores de la misma sección la marcan una sola vez', () => {
		expect(markedSections(['Título', 'Etiquetas'])).toEqual(['Tarea']);
	});

	it('las marcadas van en el orden de las pestañas, no en el de los errores', () => {
		expect(markedSections(['horario', 'Título'])).toEqual(['Tarea', 'Cuándo']);
	});
});

describe('destinoAlFallarGuardar (spec §6.2, Errores)', () => {
	it('en pestañas salta a la pestaña del único error', () => {
		expect(destinationOnSaveFailure(['horario'], 'pestanas')).toEqual({ tab: 'Cuándo', field: 'horario' });
	});

	it('Tarea va antes que Cuándo, aunque el error de Cuándo llegue primero', () => {
		expect(destinationOnSaveFailure(['horario', 'Etiquetas'], 'pestanas')).toEqual({ tab: 'Tarea', field: 'Etiquetas' });
	});

	it.each([
		[['Etiquetas', 'Título'], 'Título'],
		[['días', 'fecha límite'], 'fecha límite'],
		[['horario', 'Cada'], 'Cada'],
		[['horario', 'días'], 'días']
	] as const)('de %j el primero es %s: el orden en que se ven los campos', (fields, field) => {
		expect(destinationOnSaveFailure(fields, 'pestanas')?.field).toBe(field);
	});

	it('en secciones seguidas no hay pestaña: solo el campo', () => {
		expect(destinationOnSaveFailure(['horario', 'Título'], 'secciones')).toEqual({ tab: undefined, field: 'Título' });
	});

	it('sin errores no hay a dónde ir', () => {
		expect(destinationOnSaveFailure([], 'pestanas')).toBeUndefined();
	});
});

describe('barraDeGuardarVisible (spec §6.2, Teclado en pantalla)', () => {
	it('se oculta con el teclado en pantalla abierto', () => {
		expect(saveBarVisible(true)).toBe(false);
	});

	it('se ve con el teclado en pantalla cerrado', () => {
		expect(saveBarVisible(false)).toBe(true);
	});
});

describe('camposConError (spec §6.2, Errores)', () => {
	it('sin errores no hay campos', () => {
		expect(fieldsWithError({}, 'puntual', false)).toEqual([]);
	});

	it('lista los campos con error en el orden de lectura', () => {
		expect(fieldsWithError({ schedule: 'incompleto', title: 'vacio' }, 'puntual', true)).toEqual(['Título', 'Etiquetas', 'horario']);
	});

	it.each([
		['fecha límite', { dueDate: 'invalida' as const }, 'puntual'],
		['Cada', { every: 'invalido' as const }, 'relativo'],
		['días', { days: 'faltan' as const }, 'semanal'],
		['días', { days: 'faltan' as const }, 'mensual']
	] as const)('el error de %s solo cuenta con su opción de Se repite', (field, errors, repetition) => {
		expect(fieldsWithError(errors, repetition, false)).toEqual([field]);
		const other = repetition === 'puntual' ? 'relativo' : 'puntual';
		expect(fieldsWithError(errors, other, false)).toEqual([]);
	});
});

describe('repeticionAlAbrir (spec §6.2): la opción de Se repite que viene elegida', () => {
	it('al crear, sin datos de una tarea, viene No se repite', () => {
		expect(repetitionOnOpen()).toBe('puntual');
	});

	it.each<[TaskData, string]>([
		[{ shape: 'puntual', title: 'Pagar' }, 'puntual'],
		[{ shape: 'relativa', title: 'Regar', every: 3, unit: 'dias' }, 'relativo'],
		[{ shape: 'calendario', title: 'Sacar', weekdays: ['lunes'], monthDays: [] }, 'semanal'],
		[{ shape: 'calendario', title: 'Pagar', weekdays: [], monthDays: [15] }, 'mensual']
	])('al editar, viene la opción de la tarea: %j', (data, option) => {
		expect(repetitionOnOpen(data)).toBe(option);
	});
});
