// Spec §6.2 (Etiquetas en el panel).
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { sameName, PALETTE, type Label } from './label';
import { addTyped, removeChosen, suggestions } from './label-panel';

const name = fc.constantFrom('Cocina', 'cocina', ' COCINA ', 'Baño', 'BANO', 'Patio', '   ', 'co', 'x'.repeat(31));
const existings: Label[] = [
	{ id: 'e1', name: 'Cocina', color: PALETTE[0] },
	{ id: 'e2', name: 'Baño', color: PALETTE[1] }
];
/** Lo elegido en el panel: lo que dejan agregar los Enter sucesivos. */
const chosenItems = fc.array(name, { maxLength: 5 }).map((typedItems) =>
	typedItems.reduce<string[]>((currentItems, typed) => {
		const added = addTyped(typed, existings, currentItems);
		return added.ok ? added.names : currentItems;
	}, [])
);
const withoutRepeating = (names: readonly string[]) => names.every((a, i) => names.slice(i + 1).every((b) => !sameName(a, b)));

describe('agregarEscrita (propiedades)', () => {
	it('nunca repite un nombre y agregar dos veces lo mismo es como una', () => {
		fc.assert(
			fc.property(name, chosenItems, (typed, currentItems) => {
				expect(withoutRepeating(currentItems)).toBe(true);
				const one = addTyped(typed, existings, currentItems);
				if (!one.ok) return;
				expect(withoutRepeating(one.names)).toBe(true);
				expect(addTyped(typed, existings, one.names)).toStrictEqual(one);
			})
		);
	});

	it('quitar lo agregado lo saca, sin tocar el resto', () => {
		fc.assert(
			fc.property(name, chosenItems, (typed, currentItems) => {
				const added = addTyped(typed, existings, currentItems);
				if (!added.ok || added.names.length === currentItems.length) return;
				const newValue = added.names[added.names.length - 1];
				expect(removeChosen(newValue, added.names)).toStrictEqual(currentItems);
			})
		);
	});
});

describe('sugerencias (propiedades)', () => {
	it('nunca sugiere una ya elegida ni ofrece crear una que existe', () => {
		fc.assert(
			fc.property(name, chosenItems, (typedOne, currentItems) => {
				const { labels, create } = suggestions(typedOne, existings, currentItems);
				labels.forEach((e) => expect(currentItems.some((n) => sameName(n, e.name))).toBe(false));
				if (create !== undefined) expect(existings.some((e) => sameName(e.name, create))).toBe(false);
			})
		);
	});
});
