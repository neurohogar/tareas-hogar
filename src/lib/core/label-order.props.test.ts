// Spec §4.3 (Orden): el mismo en todos lados.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { compareIds } from './compare-ids';
import { PALETTE, type Label } from './label';
import { compareTitles } from './alphabetical-order';
import { sortLabels } from './label-order';

const name = fc.constantFrom('Cocina', 'cocina', 'Baño', 'bano', 'Ñandú', 'Nube', 'Árbol', 'arbol', 'Patio');
const labels = fc.uniqueArray(
	fc.record({
		id: fc.string({ maxLength: 3 }),
		name,
		color: fc.constantFrom(...PALETTE)
	}),
	{
		maxLength: 10,
		selector: ({ id }) => id
	}
) as fc.Arbitrary<Label[]>;
const permutedItems = labels.chain((list) =>
	fc.shuffledSubarray(list, { minLength: list.length }).map((other) => [list, other] as const)
);

describe('ordenarEtiquetas (propiedades)', () => {
	it('es una permutación de la entrada, ordenada por nombre y después por id', () => {
		fc.assert(
			fc.property(labels, (list) => {
				const ordered = sortLabels(list);
				expect([...ordered].sort((a, b) => compareIds(a.id, b.id))).toStrictEqual([...list].sort((a, b) => compareIds(a.id, b.id)));
				for (let i = 1; i < ordered.length; i++) {
					const [a, b] = [ordered[i - 1], ordered[i]];
					const byName = compareTitles(a.name, b.name);
					expect(byName < 0 || (byName === 0 && compareIds(a.id, b.id) < 0)).toBe(true);
				}
			})
		);
	});

	it('es total: no depende del orden de entrada', () => {
		fc.assert(
			fc.property(permutedItems, ([list, other]) => {
				expect(sortLabels(other)).toStrictEqual(sortLabels(list));
			})
		);
	});

	it('no modifica la entrada', () => {
		fc.assert(
			fc.property(labels, (list) => {
				const copy = [...list];
				sortLabels(list);
				expect(list).toStrictEqual(copy);
			})
		);
	});
});
