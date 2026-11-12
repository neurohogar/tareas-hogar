import { describe, expect, it } from 'vitest';
import type { DatosDeTarea } from './datos-de-tarea';
import {
	barraDeGuardarVisible,
	camposConError,
	destinoAlFallarGuardar,
	PESTANA_AL_ABRIR,
	presentacionDelPanel,
	repeticionAlAbrir,
	seccionesDelPanel,
	seccionesMarcadas
} from './panel-en-pestanas';

describe('presentacionDelPanel (spec §6.2, Presentación del panel)', () => {
	it.each([22.5, 39.9, 40])('%s rem es celular: en pestañas', (ancho) => {
		expect(presentacionDelPanel(ancho)).toBe('pestanas');
	});

	it.each([40.1, 80])('%s rem es pantalla ancha: en secciones seguidas', (ancho) => {
		expect(presentacionDelPanel(ancho)).toBe('secciones');
	});
});

describe('seccionesDelPanel (spec §6.2, Pestañas)', () => {
	it('al crear no aparece Acciones', () => {
		expect(seccionesDelPanel('crear')).toEqual(['Tarea', 'Cuándo']);
	});

	it('al editar aparece siempre, al final', () => {
		expect(seccionesDelPanel('editar')).toEqual(['Tarea', 'Cuándo', 'Acciones']);
	});
});

describe('PESTANA_AL_ABRIR (spec §6.2, Pestañas)', () => {
	it('siempre abre en Tarea', () => {
		expect(PESTANA_AL_ABRIR).toBe('Tarea');
	});
});

describe('seccionesMarcadas (spec §6.2, Errores)', () => {
	it('sin errores no marca ninguna', () => {
		expect(seccionesMarcadas([])).toEqual([]);
	});

	it.each(['Título', 'Etiquetas'] as const)('un error en %s marca Tarea', (campo) => {
		expect(seccionesMarcadas([campo])).toEqual(['Tarea']);
	});

	it.each(['fecha límite', 'Cada', 'días', 'horario'] as const)('un error en %s marca Cuándo', (campo) => {
		expect(seccionesMarcadas([campo])).toEqual(['Cuándo']);
	});

	it('dos errores de la misma sección la marcan una sola vez', () => {
		expect(seccionesMarcadas(['Título', 'Etiquetas'])).toEqual(['Tarea']);
	});

	it('las marcadas van en el orden de las pestañas, no en el de los errores', () => {
		expect(seccionesMarcadas(['horario', 'Título'])).toEqual(['Tarea', 'Cuándo']);
	});
});

describe('destinoAlFallarGuardar (spec §6.2, Errores)', () => {
	it('en pestañas salta a la pestaña del único error', () => {
		expect(destinoAlFallarGuardar(['horario'], 'pestanas')).toEqual({ pestana: 'Cuándo', campo: 'horario' });
	});

	it('Tarea va antes que Cuándo, aunque el error de Cuándo llegue primero', () => {
		expect(destinoAlFallarGuardar(['horario', 'Etiquetas'], 'pestanas')).toEqual({ pestana: 'Tarea', campo: 'Etiquetas' });
	});

	it.each([
		[['Etiquetas', 'Título'], 'Título'],
		[['días', 'fecha límite'], 'fecha límite'],
		[['horario', 'Cada'], 'Cada'],
		[['horario', 'días'], 'días']
	] as const)('de %j el primero es %s: el orden en que se ven los campos', (campos, campo) => {
		expect(destinoAlFallarGuardar(campos, 'pestanas')?.campo).toBe(campo);
	});

	it('en secciones seguidas no hay pestaña: solo el campo', () => {
		expect(destinoAlFallarGuardar(['horario', 'Título'], 'secciones')).toEqual({ pestana: undefined, campo: 'Título' });
	});

	it('sin errores no hay a dónde ir', () => {
		expect(destinoAlFallarGuardar([], 'pestanas')).toBeUndefined();
	});
});

describe('barraDeGuardarVisible (spec §6.2, Teclado en pantalla)', () => {
	it('se oculta con el teclado en pantalla abierto', () => {
		expect(barraDeGuardarVisible(true)).toBe(false);
	});

	it('se ve con el teclado en pantalla cerrado', () => {
		expect(barraDeGuardarVisible(false)).toBe(true);
	});
});

describe('camposConError (spec §6.2, Errores)', () => {
	it('sin errores no hay campos', () => {
		expect(camposConError({}, 'puntual', false)).toEqual([]);
	});

	it('lista los campos con error en el orden de lectura', () => {
		expect(camposConError({ horario: 'incompleto', titulo: 'vacio' }, 'puntual', true)).toEqual(['Título', 'Etiquetas', 'horario']);
	});

	it.each([
		['fecha límite', { fechaLimite: 'invalida' as const }, 'puntual'],
		['Cada', { cada: 'invalido' as const }, 'relativo'],
		['días', { dias: 'faltan' as const }, 'semanal'],
		['días', { dias: 'faltan' as const }, 'mensual']
	] as const)('el error de %s solo cuenta con su opción de Se repite', (campo, errores, repeticion) => {
		expect(camposConError(errores, repeticion, false)).toEqual([campo]);
		const otra = repeticion === 'puntual' ? 'relativo' : 'puntual';
		expect(camposConError(errores, otra, false)).toEqual([]);
	});
});

describe('repeticionAlAbrir (spec §6.2): la opción de Se repite que viene elegida', () => {
	it('al crear, sin datos de una tarea, viene No se repite', () => {
		expect(repeticionAlAbrir()).toBe('puntual');
	});

	it.each<[DatosDeTarea, string]>([
		[{ forma: 'puntual', titulo: 'Pagar' }, 'puntual'],
		[{ forma: 'relativa', titulo: 'Regar', cada: 3, unidad: 'dias' }, 'relativo'],
		[{ forma: 'calendario', titulo: 'Sacar', diasSemana: ['lunes'], diasMes: [] }, 'semanal'],
		[{ forma: 'calendario', titulo: 'Pagar', diasSemana: [], diasMes: [15] }, 'mensual']
	])('al editar, viene la opción de la tarea: %j', (datos, opcion) => {
		expect(repeticionAlAbrir(datos)).toBe(opcion);
	});
});
