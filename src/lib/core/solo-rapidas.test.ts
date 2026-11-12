import { describe, expect, it } from 'vitest';
import type { FilaDePendientes } from './pendientes';
import { filtrarSoloRapidas, textoDeListaVacia } from './solo-rapidas';
import type { Esfuerzo } from './tarea';

const fila = (id: string, esfuerzo?: Esfuerzo): FilaDePendientes => ({
	tarea: { id, titulo: id, tipo: 'puntual', creadaEn: new Date(2026, 6, 1), ...(esfuerzo && { esfuerzo }) },
	estado: { tipo: 'pendiente' },
	completada: false
});

describe('filtrarSoloRapidas', () => {
	const filas = [fila('foco', 'rapida'), fila('regar', 'media'), fila('pagar'), fila('lavar', 'larga'), fila('barrer', 'rapida')];

	it('apagado deja la lista entera', () => {
		expect(filtrarSoloRapidas(filas, false)).toStrictEqual(filas);
	});

	it('encendido deja solo las rápidas, en el mismo orden', () => {
		expect(filtrarSoloRapidas(filas, true)).toStrictEqual([filas[0], filas[4]]);
	});

	it('también aplica a las completadas', () => {
		const hecha = (id: string, esfuerzo?: Esfuerzo): FilaDePendientes => ({
			tarea: fila(id, esfuerzo).tarea,
			estado: { tipo: 'completada' },
			completada: true
		});
		const completada = hecha('hecha');
		const completadaRapida = hecha('hecha2', 'rapida');

		expect(filtrarSoloRapidas([completada, completadaRapida], true)).toStrictEqual([completadaRapida]);
	});
});

describe('textoDeListaVacia', () => {
	it('encendido y sin etiqueta elegida: "No hay tareas rápidas"', () => {
		expect(textoDeListaVacia(undefined, true)).toBe('No hay tareas rápidas');
	});

	it('con una etiqueta elegida, encendido o apagado: "No hay tareas con esta etiqueta"', () => {
		expect(textoDeListaVacia('e1', true)).toBe('No hay tareas con esta etiqueta');
		expect(textoDeListaVacia('e1', false)).toBe('No hay tareas con esta etiqueta');
	});

	it('apagado y sin etiqueta elegida, ningún texto', () => {
		expect(textoDeListaVacia(undefined, false)).toBeUndefined();
	});
});
