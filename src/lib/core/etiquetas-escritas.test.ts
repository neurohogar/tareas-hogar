import { describe, expect, it } from 'vitest';
import type { Etiqueta } from './etiqueta';
import { elegirEtiquetas, guardarElegidas } from './etiquetas-escritas';

const COCINA: Etiqueta = { id: 'e1', nombre: 'Cocina', color: 'azul' };
const BANO: Etiqueta = { id: 'e2', nombre: 'Baño', color: 'gris' };

describe('elegirEtiquetas', () => {
	it('un nombre nuevo es una etiqueta nueva con el color menos usado', () => {
		expect(elegirEtiquetas(['Patio'], [BANO])).toStrictEqual({ ok: true, elegidas: [{ nombre: 'Patio', color: 'rojo' }] });
	});

	it('un nombre existente, sin distinguir mayúsculas, usa esa etiqueta con su nombre guardado', () => {
		expect(elegirEtiquetas(['COCINA'], [COCINA])).toStrictEqual({ ok: true, elegidas: [COCINA] });
	});

	it('quita los espacios de los extremos antes de buscar o crear', () => {
		expect(elegirEtiquetas(['  cocina  ', ' Ropa sucia '], [COCINA])).toStrictEqual({
			ok: true,
			elegidas: [COCINA, { nombre: 'Ropa sucia', color: 'gris' }]
		});
	});

	it('varias nuevas se colorean en el orden escrito, cada una contando las anteriores', () => {
		expect(elegirEtiquetas(['Patio', 'Cocina'], [BANO])).toStrictEqual({
			ok: true,
			elegidas: [
				{ nombre: 'Patio', color: 'rojo' },
				{ nombre: 'Cocina', color: 'naranja' }
			]
		});
	});

	it('la misma etiqueta escrita dos veces queda una vez, con el primer nombre escrito', () => {
		expect(elegirEtiquetas(['Patio', 'Cocina', 'PATIO'], [])).toStrictEqual({
			ok: true,
			elegidas: [
				{ nombre: 'Patio', color: 'gris' },
				{ nombre: 'Cocina', color: 'rojo' }
			]
		});
		expect(elegirEtiquetas(['cocina', 'Cocina'], [COCINA])).toStrictEqual({ ok: true, elegidas: [COCINA] });
	});

	it('un nombre inválido rechaza la elección entera', () => {
		expect(elegirEtiquetas(['Casa', 'Limpieza profunda del baño 1234'], [])).toStrictEqual({ ok: false, error: 'largo' });
		expect(elegirEtiquetas(['   '], [])).toStrictEqual({ ok: false, error: 'vacio' });
	});

	it('sin nombres, ninguna etiqueta', () => {
		expect(elegirEtiquetas([], [COCINA])).toStrictEqual({ ok: true, elegidas: [] });
	});
});

describe('guardarElegidas', () => {
	it('da id a las nuevas y devuelve los ids de todas en el orden elegido', () => {
		const ids = ['n1', 'n2'];
		const resultado = guardarElegidas([{ nombre: 'Patio', color: 'rojo' }, COCINA, { nombre: 'Living', color: 'gris' }], () => ids.shift() as string);

		expect(resultado).toStrictEqual({
			ids: ['n1', 'e1', 'n2'],
			nuevas: [
				{ id: 'n1', nombre: 'Patio', color: 'rojo' },
				{ id: 'n2', nombre: 'Living', color: 'gris' }
			]
		});
	});
});
