// Spec §6.2 (Borrar tarea) and §7 (deletion of tasks and orphan completions).
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

describe('deletion (properties)', () => {
	it('deletes all the completions of the task and only those', () => {
		fc.assert(
			fc.property(taskId, completions, (id, cs) => {
				const { taskId: deleted, completionIds } = deletion(id, cs, []);
				expect(deleted).toBe(id);
				expect(completionIds).toEqual(ids(cs.filter((c) => c.taskId === id)));
			})
		);
	});

	it('after deleting a task, its completions and the earlier orphans partition the later orphans', () => {
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

	it('if the batch is applied, no orphan of the deleted task is left', () => {
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

describe('orphanCompletions (properties)', () => {
	it('partitions the completions: orphan if and only if its task does not exist', () => {
		fc.assert(
			fc.property(tasks, completions, (ts, cs) => {
				const orphanItems = orphanCompletions(ts, cs);
				for (const c of cs) expect(orphanItems.includes(c)).toBe(!taskExists(ts, c.taskId));
			})
		);
	});

	it('is idempotent and keeps the order', () => {
		fc.assert(
			fc.property(tasks, completions, (ts, cs) => {
				const orphanItems = orphanCompletions(ts, cs);
				expect(orphanCompletions(ts, orphanItems)).toStrictEqual(orphanItems);
				expect(orphanItems).toStrictEqual(cs.filter((c) => orphanItems.includes(c)));
			})
		);
	});

	it('cleaning them leaves no orphans', () => {
		fc.assert(
			fc.property(tasks, completions, (ts, cs) => {
				const orphanItems = orphanCompletions(ts, cs);
				expect(orphanCompletions(ts, cs.filter((c) => !orphanItems.includes(c)))).toEqual([]);
			})
		);
	});
});
