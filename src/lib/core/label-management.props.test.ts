// Spec §4.3 y §6.4 (Renombrar).
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { sameName, PALETTE, type Label } from './label';
import { applyLabelChange, rename } from './label-management';

const name = fc.constantFrom('Cocina', 'cocina', ' COCINA ', 'Baño', 'Patio', '  ', 'x'.repeat(31));
const labels = fc
	.uniqueArray(fc.constantFrom('Cocina', 'Baño', 'Patio', 'Árbol'), { minLength: 1, maxLength: 4 })
	.map((names) => names.map((n, i): Label => ({ id: `e${i}`, name: n, color: PALETTE[i] })));

describe('renombrar (propiedades)', () => {
	it('un renombrado aceptado nunca deja dos etiquetas con el mismo nombre (sin distinguir mayúsculas)', () => {
		fc.assert(
			fc.property(labels, fc.nat(), name, (list, index, typedOne) => {
				const label = list[index % list.length];
				const result = rename(label, typedOne, list);
				if (!result.ok) return;
				const after = applyLabelChange(list, label.id, result.change);
				after.forEach((a, i) => after.slice(i + 1).forEach((b) => expect(sameName(a.name, b.name)).toBe(false)));
				expect(after.find(({ id }) => id === label.id)?.color).toBe(label.color);
			})
		);
	});
});
