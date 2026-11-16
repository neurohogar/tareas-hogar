// Spec §6.2 (Borrar tarea) y §7 (Borrado de tareas y completados huérfanos).
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { deletion, orphanCompletions, taskExists } from './deletion';
import type { Completion, Task } from './task';

const IDS = ['t1', 't2', 't3', 't4'];
const taskId = fc.constantFrom(...IDS);
const tasks = fc
	.subarray(IDS)
	.map((ids) => ids.map((id): Task => ({ id, title: id, kind: 'puntual', createdAt: new Date(0) })));
const completions = fc
	.uniqueArray(fc.record({ id: fc.uuid(), taskId, completedAt: fc.date({ noInvalidDate: true }) }), {
		maxLength: 15,
		selector: ({ id }) => id
	})
	.map((cs) => cs as Completion[]);
const ids = (cs: readonly Completion[]) => cs.map(({ id }) => id);

describe('borrado (propiedades)', () => {
	it('borra todos los completados de la tarea y solo esos', () => {
		fc.assert(
			fc.property(taskId, completions, (id, cs) => {
				const { taskId: deleted, completionIds } = deletion(id, cs, []);
				expect(deleted).toBe(id);
				expect(completionIds).toEqual(ids(cs.filter((c) => c.taskId === id)));
			})
		);
	});

	it('tras borrar una tarea, sus completados y los huérfanos de antes particionan los huérfanos de después', () => {
		fc.assert(
			fc.property(tasks, completions, (ts, cs) => {
				fc.pre(ts.length > 0);
				const [deleted, ...remaining] = ts;
				const { completionIds } = deletion(deleted.id, cs, []);
				const before = ids(orphanCompletions(ts, cs));
				const after = ids(orphanCompletions(remaining, cs));
				expect(completionIds.filter((id) => before.includes(id))).toEqual([]);
				expect([...completionIds, ...before].sort()).toEqual([...after].sort());
			})
		);
	});

	it('si el batch se aplica, no queda ningún huérfano de la tarea borrada', () => {
		fc.assert(
			fc.property(tasks, completions, (ts, cs) => {
				fc.pre(ts.length > 0);
				const [deleted, ...remaining] = ts;
				const { completionIds } = deletion(deleted.id, cs, []);
				const remain = cs.filter(({ id }) => !completionIds.includes(id));
				expect(orphanCompletions(remaining, remain)).toStrictEqual(orphanCompletions(ts, cs));
			})
		);
	});
});

describe('completadosHuerfanos (propiedades)', () => {
	it('particiona los completados: huérfano si y solo si su tarea no existe', () => {
		fc.assert(
			fc.property(tasks, completions, (ts, cs) => {
				const orphanItems = orphanCompletions(ts, cs);
				for (const c of cs) expect(orphanItems.includes(c)).toBe(!taskExists(ts, c.taskId));
			})
		);
	});

	it('es idempotente y conserva el orden', () => {
		fc.assert(
			fc.property(tasks, completions, (ts, cs) => {
				const orphanItems = orphanCompletions(ts, cs);
				expect(orphanCompletions(ts, orphanItems)).toStrictEqual(orphanItems);
				expect(orphanItems).toStrictEqual(cs.filter((c) => orphanItems.includes(c)));
			})
		);
	});

	it('limpiarlos deja sin huérfanos', () => {
		fc.assert(
			fc.property(tasks, completions, (ts, cs) => {
				const orphanItems = orphanCompletions(ts, cs);
				expect(orphanCompletions(ts, cs.filter((c) => !orphanItems.includes(c)))).toEqual([]);
			})
		);
	});
});
