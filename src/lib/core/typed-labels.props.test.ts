// Spec §4.3 (Creación, Color de una etiqueta nueva) y §6.2: guardar el panel con etiquetas escritas.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { leastUsedColor } from './label-color';
import { sameName, PALETTE, type Label } from './label';
import { chooseLabels, saveChosen } from './typed-labels';

const name = fc.constantFrom('Cocina', 'cocina', ' COCINA ', 'Baño', 'baño', 'Patio', 'Árbol', 'arbol');
const existings = fc
	.uniqueArray(
		fc.record({ id: fc.constantFrom('e1', 'e2', 'e3', 'e4'), name: name.map((n) => n.trim()), color: fc.constantFrom(...PALETTE) }),
		{
			maxLength: 4,
			selector: ({ id }) => id
		}
	)
	.filter((list) => list.every((a, i) => list.slice(i + 1).every((b) => !sameName(a.name, b.name))))
	.map((list) => list as Label[]);
const typedItems = fc.array(name, { maxLength: 6 });

describe('elegirEtiquetas (propiedades)', () => {
	it('una por nombre (sin distinguir mayúsculas): la existente si la hay; las nuevas con el color menos usado hasta ese momento', () => {
		fc.assert(
			fc.property(typedItems, existings, (list, already) => {
				const choice = chooseLabels(list, already);
				if (!choice.ok) throw new Error('nombres válidos');
				const { chosenItems } = choice;
				chosenItems.forEach((a, i) => chosenItems.slice(i + 1).forEach((b) => expect(sameName(a.name, b.name)).toBe(false)));
				list.forEach((typed) => expect(chosenItems.some((e) => sameName(e.name, typed.trim()))).toBe(true));
				const colors = already.map(({ color }) => color);
				for (const chosen of chosenItems) {
					const existing = already.find((e) => sameName(e.name, chosen.name));
					if (existing) expect(chosen).toStrictEqual(existing);
					else {
						expect(chosen.color).toBe(leastUsedColor(colors));
						colors.push(chosen.color);
					}
				}
			})
		);
	});

	it('elegir lo ya elegido no cambia nada (volver a guardar el panel)', () => {
		fc.assert(
			fc.property(typedItems, existings, (list, already) => {
				const choice = chooseLabels(list, already);
				if (!choice.ok) throw new Error('nombres válidos');
				const names = choice.chosenItems.map(({ name }) => name);
				expect(chooseLabels(names, already)).toStrictEqual(choice);
			})
		);
	});
});

describe('guardarElegidas (propiedades)', () => {
	it('da un id a cada nueva, conserva el de las existentes y en el mismo orden', () => {
		fc.assert(
			fc.property(typedItems, existings, (list, already) => {
				const choice = chooseLabels(list, already);
				if (!choice.ok) throw new Error('nombres válidos');
				let n = 0;
				const { ids, newLabels } = saveChosen(choice.chosenItems, () => `n${n++}`);
				expect(new Set(ids).size).toBe(ids.length);
				expect(newLabels.map(({ id }) => id)).toStrictEqual(ids.filter((id) => id.startsWith('n')));
				choice.chosenItems.forEach((chosen, i) => {
					if (chosen.id !== undefined) expect(ids[i]).toBe(chosen.id);
				});
			})
		);
	});
});
