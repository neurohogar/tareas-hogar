import { describe, expect, it } from 'vitest';
import type { Label } from './label';
import { chooseLabels, saveChosen } from './typed-labels';

const KITCHEN: Label = { id: 'e1', name: 'Cocina', color: 'azul' };
const BATHROOM: Label = { id: 'e2', name: 'Baño', color: 'gris' };

describe('elegirEtiquetas', () => {
	it('un nombre nuevo es una etiqueta nueva con el color menos usado', () => {
		expect(chooseLabels(['Patio'], [BATHROOM])).toStrictEqual({ ok: true, chosenItems: [{ name: 'Patio', color: 'rojo' }] });
	});

	it('un nombre existente, sin distinguir mayúsculas, usa esa etiqueta con su nombre guardado', () => {
		expect(chooseLabels(['COCINA'], [KITCHEN])).toStrictEqual({ ok: true, chosenItems: [KITCHEN] });
	});

	it('quita los espacios de los extremos antes de buscar o crear', () => {
		expect(chooseLabels(['  cocina  ', ' Ropa sucia '], [KITCHEN])).toStrictEqual({
			ok: true,
			chosenItems: [KITCHEN, { name: 'Ropa sucia', color: 'gris' }]
		});
	});

	it('varias nuevas se colorean en el orden escrito, cada una contando las anteriores', () => {
		expect(chooseLabels(['Patio', 'Cocina'], [BATHROOM])).toStrictEqual({
			ok: true,
			chosenItems: [
				{ name: 'Patio', color: 'rojo' },
				{ name: 'Cocina', color: 'naranja' }
			]
		});
	});

	it('la misma etiqueta escrita dos veces queda una vez, con el primer nombre escrito', () => {
		expect(chooseLabels(['Patio', 'Cocina', 'PATIO'], [])).toStrictEqual({
			ok: true,
			chosenItems: [
				{ name: 'Patio', color: 'gris' },
				{ name: 'Cocina', color: 'rojo' }
			]
		});
		expect(chooseLabels(['cocina', 'Cocina'], [KITCHEN])).toStrictEqual({ ok: true, chosenItems: [KITCHEN] });
	});

	it('un nombre inválido rechaza la elección entera', () => {
		expect(chooseLabels(['Casa', 'Limpieza profunda del baño 1234'], [])).toStrictEqual({ ok: false, error: 'largo' });
		expect(chooseLabels(['   '], [])).toStrictEqual({ ok: false, error: 'vacio' });
	});

	it('sin nombres, ninguna etiqueta', () => {
		expect(chooseLabels([], [KITCHEN])).toStrictEqual({ ok: true, chosenItems: [] });
	});
});

describe('guardarElegidas', () => {
	it('da id a las nuevas y devuelve los ids de todas en el orden elegido', () => {
		const ids = ['n1', 'n2'];
		const result = saveChosen([{ name: 'Patio', color: 'rojo' }, KITCHEN, { name: 'Living', color: 'gris' }], () => ids.shift() as string);

		expect(result).toStrictEqual({
			ids: ['n1', 'e1', 'n2'],
			newLabels: [
				{ id: 'n1', name: 'Patio', color: 'rojo' },
				{ id: 'n2', name: 'Living', color: 'gris' }
			]
		});
	});
});
