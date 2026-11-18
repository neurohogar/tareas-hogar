import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { taskStatus } from './task-status';
import type { Completion, Task, RecurringTask } from './task';

const instant = fc.integer({ min: 0, max: 4_000_000_000_000 });
const recurring = fc.record({
	every: fc.integer({ min: 1, max: 10_000 }),
	unit: fc.constantFrom('horas' as const, 'dias' as const)
}).map(({ every, unit }): RecurringTask => ({
	id: 'propia',
	title: 'T',
	kind: 'periodica',
	recurrence: { mode: 'relativo', every, unit },
	createdAt: new Date(0)
}));
const oneOff = fc.option(fc.integer({ min: 0, max: 47_000 }), { nil: undefined }).map(
	(days): Task => ({
		id: 'propia',
		title: 'T',
		kind: 'puntual',
		createdAt: new Date(0),
		...(days !== undefined && { dueDate: new Date(1970, 0, 1 + days) })
	})
);
const task = fc.oneof(recurring, oneOff);
const completionsOf = (taskId: string) =>
	fc.array(instant, { maxLength: 6 }).map((moments) =>
		moments.map((ms, i): Completion => ({ id: `${taskId}-${i}`, taskId, completedAt: new Date(ms) }))
	);

describe('taskStatus (properties)', () => {
	it('the completions of other tasks do not change the status', () => {
		fc.assert(
			fc.property(task, completionsOf('propia'), completionsOf('otra'), instant, (t, owns, foreigns, now) => {
				const date = new Date(now);
				expect(taskStatus(t, [...foreigns, ...owns], date)).toEqual(taskStatus(t, owns, date));
			})
		);
	});
});
