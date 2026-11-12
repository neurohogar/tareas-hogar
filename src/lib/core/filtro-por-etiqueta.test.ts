import { describe, expect, it } from 'vitest';
import type { Etiqueta } from './etiqueta';
import { filtrarPorEtiqueta, filtroVigente } from './filtro-por-etiqueta';
import type { FilaDePendientes } from './pendientes';
import type { Tarea } from './tarea';

const COCINA: Etiqueta = { id: 'e1', nombre: 'Cocina', color: 'rojo' };
const BANO: Etiqueta = { id: 'e2', nombre: 'Baño', color: 'gris' };

const fila = (id: string, etiquetas?: string[]): FilaDePendientes => ({
	tarea: { id, titulo: id, tipo: 'puntual', creadaEn: new Date(2026, 6, 1), ...(etiquetas && { etiquetas }) } as Tarea,
	estado: { tipo: 'pendiente' },
	completada: false
});

describe('filtroVigente', () => {
	it('"Todas" (sin etiqueta) sigue en "Todas"', () => {
		expect(filtroVigente(undefined, [COCINA])).toBeUndefined();
	});

	it('una etiqueta que existe sigue elegida', () => {
		expect(filtroVigente('e1', [COCINA, BANO])).toBe('e1');
	});

	it('si la etiqueta elegida ya no existe, vuelve a "Todas"', () => {
		expect(filtroVigente('e1', [BANO])).toBeUndefined();
	});
});

describe('filtrarPorEtiqueta', () => {
	const filas = [fila('pagar', ['e1', 'e2']), fila('basura', ['e2']), fila('regar'), fila('lavar', ['e1'])];

	it('"Todas" deja la lista entera', () => {
		expect(filtrarPorEtiqueta(filas, undefined)).toStrictEqual(filas);
	});

	it('una etiqueta deja solo las tareas que la tienen, en el mismo orden', () => {
		expect(filtrarPorEtiqueta(filas, 'e1')).toStrictEqual([filas[0], filas[3]]);
		expect(filtrarPorEtiqueta(filas, 'e2')).toStrictEqual([filas[0], filas[1]]);
	});
});
