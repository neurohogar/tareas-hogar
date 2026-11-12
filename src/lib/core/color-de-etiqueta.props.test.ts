// Spec §4.3 (Color de una etiqueta nueva).
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { colorMenosUsado } from './color-de-etiqueta';
import { PALETA, type Color } from './etiqueta';

const usados = fc.array(fc.constantFrom(...PALETA), { maxLength: 30 });
const veces = (lista: readonly Color[], color: Color) => lista.filter((usado) => usado === color).length;

describe('colorMenosUsado (propiedades)', () => {
	it('es el primero de la paleta entre los menos usados', () => {
		fc.assert(
			fc.property(usados, (lista) => {
				const minimo = Math.min(...PALETA.map((color) => veces(lista, color)));
				expect(colorMenosUsado(lista)).toBe(PALETA.find((color) => veces(lista, color) === minimo));
			})
		);
	});

	it('no depende del orden de las etiquetas existentes', () => {
		fc.assert(
			fc.property(
				usados.chain((lista) => fc.shuffledSubarray(lista, { minLength: lista.length }).map((otra) => [lista, otra] as const)),
				([lista, permutada]) => {
					expect(colorMenosUsado(permutada)).toBe(colorMenosUsado(lista));
				}
			)
		);
	});
});
