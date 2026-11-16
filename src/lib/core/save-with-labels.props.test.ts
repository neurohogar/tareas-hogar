// Spec §6.2, §4.3 y §7: guardar el panel con etiquetas, y los chips de una tarea.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { taskData } from './task-data';
import { applyChange, taskFromDocument } from './task-document';
import { PALETTE, type Label } from './label';
import { taskLabels } from './task-labels';
import { editWithLabels } from './save-with-labels';
import { sortLabels } from './label-order';
import { labelIds, type Task } from './task';

const existings: Label[] = ['Cocina', 'Baño', 'Patio', 'Árbol'].map((name, i) => ({ id: `e${i}`, name, color: PALETTE[i] }));
const task = fc
	.option(fc.uniqueArray(fc.constantFrom('e0', 'e1', 'e2', 'e3', 'borrada'), { maxLength: 4 }), { nil: undefined })
	.map((ids): Task => ({ id: 't1', title: 'Pagar', kind: 'puntual', createdAt: new Date(0), ...(ids && { labels: ids }) }));
const typedItems = fc.array(fc.constantFrom('cocina', 'Baño', ' PATIO ', 'Nueva', 'nueva'), { maxLength: 5 });
let n = 0;
const newId = () => `n${n++}`;

describe('etiquetasDeTarea (propiedades)', () => {
	it('son las existentes que la tarea referencia, en el orden de la §4.3: las rotas se ignoran', () => {
		fc.assert(
			fc.property(task, (t) => {
				const expectedValues = sortLabels(existings.filter(({ id }) => labelIds(t).includes(id)));
				expect(taskLabels(t, existings)).toStrictEqual(expectedValues);
			})
		);
	});
});

describe('editarConEtiquetas (propiedades)', () => {
	it('guardar sin tocar las etiquetas que se ven no escribe el campo', () => {
		fc.assert(
			fc.property(task, (t) => {
				fc.pre(labelIds(t).every((id) => existings.some((e) => e.id === id)));
				const names = taskLabels(t, existings).map(({ name }) => name);
				const result = editWithLabels(t, taskData(t), names, { existings, newId });
				if (!result.ok) throw new Error('datos válidos');
				expect(result.change.labels).toBeUndefined();
				expect(result.newLabels).toStrictEqual([]);
			})
		);
	});

	it('la tarea queda exactamente con las etiquetas escritas, y volver a guardarlas no cambia nada', () => {
		fc.assert(
			fc.property(task, typedItems, (t, list) => {
				const result = editWithLabels(t, taskData(t), list, { existings, newId });
				if (!result.ok) throw new Error('datos válidos');
				const all = [...existings, ...result.newLabels];
				const [edited] = applyChange([t], t.id, result.change).map(taskFromDocument);
				const names = taskLabels(edited, all).map(({ name }) => name.toLowerCase());
				expect([...names].sort()).toStrictEqual([...new Set(list.map((e) => e.trim().toLowerCase()))].sort());
				const again = editWithLabels(edited, taskData(edited), list, { existings: all, newId });
				if (!again.ok) throw new Error('datos válidos');
				expect(again.change.labels).toBeUndefined();
				expect(again.newLabels).toStrictEqual([]);
			})
		);
	});
});
