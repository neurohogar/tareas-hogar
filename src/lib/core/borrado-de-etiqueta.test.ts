import { describe, expect, it } from 'vitest';
import { borradoDeEtiqueta, referenciasRotas } from './borrado-de-etiqueta';
import type { Etiqueta } from './etiqueta';
import type { TareaPuntual } from './tarea';

const tarea = (id: string, etiquetas?: string[]): TareaPuntual => ({
	id,
	titulo: id,
	tipo: 'puntual',
	creadaEn: new Date(2026, 6, 1),
	...(etiquetas && { etiquetas })
});
const etiqueta = (id: string): Etiqueta => ({ id, nombre: id, color: 'gris' });

describe('borradoDeEtiqueta', () => {
	it('nombra las tareas que tienen la etiqueta, y solo esas', () => {
		const tareas = [tarea('pagar', ['bano', 'cocina']), tarea('regar', ['bano']), tarea('barrer'), tarea('lavar', ['cocina'])];

		expect(borradoDeEtiqueta('cocina', tareas)).toStrictEqual({
			etiquetaId: 'cocina',
			referencias: [
				{ tareaId: 'pagar', quitar: ['cocina'], poner: [] },
				{ tareaId: 'lavar', quitar: ['cocina'], poner: [] }
			]
		});
	});
});

describe('referenciasRotas', () => {
	it('las tareas que referencian etiquetas que no existen, con esas referencias', () => {
		const tareas = [tarea('pagar', ['bano']), tarea('regar', ['cocina', 'bano', 'patio']), tarea('barrer')];

		expect(referenciasRotas(tareas, [etiqueta('bano')])).toStrictEqual([
			{ tareaId: 'regar', quitar: ['cocina', 'patio'], poner: [] }
		]);
	});

	it('sin referencias rotas, nada que limpiar', () => {
		expect(referenciasRotas([tarea('pagar', ['bano'])], [etiqueta('bano')])).toStrictEqual([]);
	});
});
