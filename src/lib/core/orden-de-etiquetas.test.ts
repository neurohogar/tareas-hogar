import { describe, expect, it } from 'vitest';
import type { Etiqueta } from './etiqueta';
import { ordenarEtiquetas } from './orden-de-etiquetas';

const etiqueta = (id: string, nombre: string): Etiqueta => ({ id, nombre, color: 'gris' });

describe('ordenarEtiquetas', () => {
	it('alfabético en español: sin mayúsculas ni acentos, ñ después de n', () => {
		const etiquetas = [etiqueta('1', 'zapatos'), etiqueta('2', 'Ñoquis'), etiqueta('3', 'árbol'), etiqueta('4', 'Nube'), etiqueta('5', 'baño'), etiqueta('6', 'Bano')];

		expect(ordenarEtiquetas(etiquetas).map(({ nombre }) => nombre)).toStrictEqual(['árbol', 'Bano', 'baño', 'Nube', 'Ñoquis', 'zapatos']);
	});

	it('si empatan, va primero la de id menor', () => {
		const etiquetas = [etiqueta('b', 'Arbol'), etiqueta('a', 'Árbol')];

		expect(ordenarEtiquetas(etiquetas).map(({ id }) => id)).toStrictEqual(['a', 'b']);
	});

	it('no modifica la lista recibida', () => {
		const etiquetas = [etiqueta('1', 'b'), etiqueta('2', 'a')];
		ordenarEtiquetas(etiquetas);

		expect(etiquetas.map(({ id }) => id)).toStrictEqual(['1', '2']);
	});
});
