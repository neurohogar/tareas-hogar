import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { latestCompletion, completionsOfTask, complete, lastCompletedAt } from './completions';
import type { Completion, RecurringTask } from './task';

const taskId = fc.constantFrom('t1', 't2', 't3');
const completion = fc.record({
	id: fc.uuid(),
	taskId,
	completedAt: fc.date({ noInvalidDate: true })
}) as fc.Arbitrary<Completion>;
const list = fc.array(completion, { maxLength: 20 });

describe('complete (properties)', () => {
	it('records the given task, id and moment, without a covered occurrence', () => {
		fc.assert(
			fc.property(fc.uuid(), fc.uuid(), fc.date({ noInvalidDate: true }), (taskIdValue, id, now) => {
				const task: RecurringTask = {
					id: taskIdValue,
					title: 'T',
					kind: 'periodica',
					recurrence: { mode: 'relativo', every: 1, unit: 'horas' },
					createdAt: new Date(0)
				};
				expect(complete(task, [], id, now)).toStrictEqual({ id, taskId: taskIdValue, completedAt: now });
			})
		);
	});
});

describe('completionsOfTask (properties)', () => {
	it('returns exactly those of the task, in the original order', () => {
		fc.assert(
			fc.property(list, taskId, (cs, id) => {
				const ofTask = completionsOfTask(cs, id);
				expect(ofTask.every((c) => c.taskId === id)).toBe(true);
				expect(ofTask).toEqual(cs.filter((c) => c.taskId === id));
			})
		);
	});

	it('is idempotent', () => {
		fc.assert(
			fc.property(list, taskId, (cs, id) => {
				expect(completionsOfTask(completionsOfTask(cs, id), id)).toEqual(completionsOfTask(cs, id));
			})
		);
	});

	it('partitions: each completion belongs to exactly one task', () => {
		fc.assert(
			fc.property(list, (cs) => {
				const total = ['t1', 't2', 't3'].reduce((sum, id) => sum + completionsOfTask(cs, id).length, 0);
				expect(total).toBe(cs.length);
			})
		);
	});
});

describe('latestCompletion (properties)', () => {
	const notEmpty = fc.array(completion, { minLength: 1, maxLength: 20 });

	it('is one of the completions, none is later and it gives lastCompletedAt', () => {
		fc.assert(
			fc.property(notEmpty, (cs) => {
				const mostRecent = latestCompletion(cs);
				expect(cs).toContain(mostRecent);
				for (const c of cs) expect(c.completedAt.getTime()).toBeLessThanOrEqual(mostRecent.completedAt.getTime());
				expect(lastCompletedAt(cs)).toBe(mostRecent.completedAt.getTime());
			})
		);
	});

	it('the instant does not depend on the order of the completions', () => {
		const permuted = notEmpty.chain((cs) => fc.tuple(fc.constant(cs), fc.shuffledSubarray(cs, { minLength: cs.length })));
		fc.assert(
			fc.property(permuted, ([cs, permutedOnes]) => {
				expect(lastCompletedAt(permutedOnes)).toBe(lastCompletedAt(cs));
			})
		);
	});
});
