// Spec §4.3 (Color de una etiqueta nueva).
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { leastUsedColor } from './label-color';
import { PALETTE, type Color } from './label';

const usedOnes = fc.array(fc.constantFrom(...PALETTE), { maxLength: 30 });
const times = (list: readonly Color[], color: Color) => list.filter((used) => used === color).length;

describe('colorMenosUsado (propiedades)', () => {
	it('es el primero de la paleta entre los menos usados', () => {
		fc.assert(
			fc.property(usedOnes, (list) => {
				const minimum = Math.min(...PALETTE.map((color) => times(list, color)));
				expect(leastUsedColor(list)).toBe(PALETTE.find((color) => times(list, color) === minimum));
			})
		);
	});

	it('no depende del orden de las etiquetas existentes', () => {
		fc.assert(
			fc.property(
				usedOnes.chain((list) => fc.shuffledSubarray(list, { minLength: list.length }).map((other) => [list, other] as const)),
				([list, permuted]) => {
					expect(leastUsedColor(permuted)).toBe(leastUsedColor(list));
				}
			)
		);
	});
});
