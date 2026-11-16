// Spec §6.1 (Filtro por etiqueta).
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { PALETTE, type Label } from './label';
import { filterByLabel, activeFilter } from './label-filter';
import type { PendingRow } from './pending';
import { hasLabel } from './task';

const IDS = ['a', 'b', 'c'];
const rows = fc.array(fc.uniqueArray(fc.constantFrom(...IDS), { maxLength: 3 }), { maxLength: 8 }).map((lists) =>
	lists.map((labels, i): PendingRow => ({
		task: { id: `t${i}`, title: `T${i}`, kind: 'puntual', createdAt: new Date(0), labels },
		status: { kind: 'pendiente' },
		completed: false
	}))
);
const chosen = fc.option(fc.constantFrom(...IDS), { nil: undefined });

describe('filtrarPorEtiqueta (propiedades)', () => {
	it('es la subsecuencia de las filas con esa etiqueta: mismo orden de urgencia, ninguna de más ni de menos', () => {
		fc.assert(
			fc.property(rows, chosen, (list, labelId) => {
				const filtered = filterByLabel(list, labelId);
				const expectedValues = labelId === undefined ? list : list.filter(({ task }) => hasLabel(task, labelId));
				expect(filtered).toStrictEqual(expectedValues);
			})
		);
	});

	it('filtrar dos veces por la misma es lo mismo que una', () => {
		fc.assert(
			fc.property(rows, chosen, (list, labelId) => {
				const one = filterByLabel(list, labelId);
				expect(filterByLabel(one, labelId)).toStrictEqual(one);
			})
		);
	});
});

describe('filtroVigente (propiedades)', () => {
	it('es la elegida si existe; si no, "Todas"', () => {
		const labels = fc.subarray(IDS).map((ids) => ids.map((id): Label => ({ id, name: id, color: PALETTE[0] })));
		fc.assert(
			fc.property(chosen, labels, (labelId, list) => {
				const exists = list.some(({ id }) => id === labelId);
				expect(activeFilter(labelId, list)).toBe(exists ? labelId : undefined);
			})
		);
	});
});
