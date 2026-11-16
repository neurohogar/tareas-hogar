import { describe, expect, it } from 'vitest';
import type { Label } from './label';
import { sortLabels } from './label-order';

const label = (id: string, name: string): Label => ({ id, name, color: 'gris' });

describe('ordenarEtiquetas', () => {
	it('alfabético en español: sin mayúsculas ni acentos, ñ después de n', () => {
		const labels = [label('1', 'zapatos'), label('2', 'Ñoquis'), label('3', 'árbol'), label('4', 'Nube'), label('5', 'baño'), label('6', 'Bano')];

		expect(sortLabels(labels).map(({ name }) => name)).toStrictEqual(['árbol', 'Bano', 'baño', 'Nube', 'Ñoquis', 'zapatos']);
	});

	it('si empatan, va primero la de id menor', () => {
		const labels = [label('b', 'Arbol'), label('a', 'Árbol')];

		expect(sortLabels(labels).map(({ id }) => id)).toStrictEqual(['a', 'b']);
	});

	it('no modifica la lista recibida', () => {
		const labels = [label('1', 'b'), label('2', 'a')];
		sortLabels(labels);

		expect(labels.map(({ id }) => id)).toStrictEqual(['1', '2']);
	});
});
