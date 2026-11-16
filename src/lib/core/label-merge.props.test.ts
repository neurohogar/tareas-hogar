// Spec §7 (Etiquetas duplicadas) y §4.3 (Borrar una etiqueta, Etiqueta borrada):
// lo que la app escribe al fusionar, borrar y limpiar, aplicado como el servidor.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { labelDeletion, brokenReferences } from './label-deletion';
import { applyReferenceChanges, taskFromDocument } from './task-document';
import { sameName, PALETTE, type Label } from './label';
import { mergeOfDuplicates } from './label-merge';
import { labelIds, type Task } from './task';

/** Pocos nombres, con variantes de mayúsculas y acentos, para que haya duplicadas. */
const name = fc.constantFrom('Cocina', 'cocina', 'COCINA', 'Baño', 'baño', 'Bano', 'Patio');
const IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'a1', 'a10', 'a2'];
const labels = fc
	.uniqueArray(fc.record({ id: fc.constantFrom(...IDS), name, color: fc.constantFrom(...PALETTE) }), {
		maxLength: 8,
		selector: ({ id }) => id
	})
	.map((list) => list as Label[]);
/** Tareas cuyas etiquetas son ids cualesquiera (algunos pueden no existir), sin repetir. */
const tasks = fc
	.array(fc.option(fc.uniqueArray(fc.constantFrom(...IDS, 'borrada'), { maxLength: 5 }), { nil: undefined }), { maxLength: 6 })
	.map((lists) =>
		lists.map((ids, i): Task => ({
			id: `t${i}`,
			title: `T${i}`,
			kind: 'puntual',
			createdAt: new Date(0),
			...(ids && { labels: ids })
		}))
	);
const permutation = <T>(list: readonly T[]) => fc.shuffledSubarray([...list], { minLength: list.length });

/** El estado tras aplicar la fusión como el servidor. */
function merge(list: readonly Label[], ts: readonly Task[]) {
	const { deletedItems, references } = mergeOfDuplicates(list, ts);
	return {
		labels: list.filter(({ id }) => !deletedItems.includes(id)),
		tasks: applyReferenceChanges(ts, references).map(taskFromDocument)
	};
}

const withoutRepeating = (ids: readonly string[]) => new Set(ids).size === ids.length;
const byId = (ids: readonly string[]) => [...ids].sort();

describe('fusionDeDuplicadas (propiedades)', () => {
	it('nunca pone una etiqueta que quita: cada borrada se reemplaza por una sobreviviente', () => {
		fc.assert(
			fc.property(labels, tasks, (list, ts) => {
				const { deletedItems, references } = mergeOfDuplicates(list, ts);
				references.forEach(({ remove, put }) => {
					remove.forEach((id) => expect(deletedItems).toContain(id));
					put.forEach((id) => expect(deletedItems).not.toContain(id));
				});
			})
		);
	});

	it('deja nombres únicos sin distinguir mayúsculas; las sobrevivientes conservan nombre y color', () => {
		fc.assert(
			fc.property(labels, tasks, (list, ts) => {
				const after = merge(list, ts).labels;
				after.forEach((a, i) => after.slice(i + 1).forEach((b) => expect(sameName(a.name, b.name)).toBe(false)));
				after.forEach((label) => expect(list).toContainEqual(label));
			})
		);
	});

	it('es idempotente: después de fusionar no queda nada que fusionar', () => {
		fc.assert(
			fc.property(labels, tasks, (list, ts) => {
				const after = merge(list, ts);
				expect(mergeOfDuplicates(after.labels, after.tasks)).toStrictEqual({ deletedItems: [], references: [] });
			})
		);
	});

	it('no pierde asignaciones: cada tarea queda con la sobreviviente de cada nombre que tenía, sin repetir', () => {
		fc.assert(
			fc.property(labels, tasks, (list, ts) => {
				const after = merge(list, ts);
				ts.forEach((before, i) => {
					const now = labelIds(after.tasks[i]);
					expect(withoutRepeating(now)).toBe(true);
					for (const id of labelIds(before)) {
						const label = list.find((e) => e.id === id);
						const expectedValue = label ? after.labels.find((e) => sameName(e.name, label.name))?.id : id;
						expect(now).toContain(expectedValue);
					}
					const named = new Set(labelIds(before));
					now.forEach((id) => expect(named.has(id) || after.labels.some((e) => e.id === id)).toBe(true));
				});
			})
		);
	});

	it('no borra tareas ni toca las que no tenían duplicadas', () => {
		fc.assert(
			fc.property(labels, tasks, (list, ts) => {
				const { deletedItems } = mergeOfDuplicates(list, ts);
				const after = merge(list, ts).tasks;
				expect(after.map(({ id }) => id)).toStrictEqual(ts.map(({ id }) => id));
				ts.forEach((task, i) => {
					if (!labelIds(task).some((id) => deletedItems.includes(id))) expect(after[i]).toStrictEqual(task);
				});
			})
		);
	});

	it('no depende del orden de las etiquetas', () => {
		fc.assert(
			fc.property(
				labels.chain((list) => permutation(list).map((other) => [list, other] as const)),
				tasks,
				([list, other], ts) => {
					const one = mergeOfDuplicates(list, ts);
					const otherMerge = mergeOfDuplicates(other, ts);
					expect(byId(otherMerge.deletedItems)).toStrictEqual(byId(one.deletedItems));
					expect(merge(other, ts).tasks.map((t) => byId(labelIds(t)))).toStrictEqual(
						merge(list, ts).tasks.map((t) => byId(labelIds(t)))
					);
				}
			)
		);
	});
});

describe('borradoDeEtiqueta (propiedades)', () => {
	it('la quita de todas las tareas, no borra ninguna y deja las otras etiquetas', () => {
		fc.assert(
			fc.property(tasks, fc.constantFrom(...IDS), (ts, labelId) => {
				const after = applyReferenceChanges(ts, labelDeletion(labelId, ts).references).map(taskFromDocument);
				expect(after.map(({ id }) => id)).toStrictEqual(ts.map(({ id }) => id));
				ts.forEach((task, i) => {
					expect(labelIds(after[i])).toStrictEqual(labelIds(task).filter((id) => id !== labelId));
				});
			})
		);
	});
});

describe('referenciasRotas (propiedades)', () => {
	it('limpiarlas quita solo las que no existen y es idempotente', () => {
		fc.assert(
			fc.property(labels, tasks, (list, ts) => {
				const after = applyReferenceChanges(ts, brokenReferences(ts, list)).map(taskFromDocument);
				ts.forEach((task, i) => {
					const exists = (id: string) => list.some((e) => e.id === id);
					expect(labelIds(after[i])).toStrictEqual(labelIds(task).filter(exists));
				});
				expect(brokenReferences(after, list)).toStrictEqual([]);
			})
		);
	});
});
