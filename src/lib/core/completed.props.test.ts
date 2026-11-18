import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { classifyInPending, isCompleted } from './completed';
import { completionsOfTask } from './completions';
import { taskStatus } from './task-status';
import { activePostponement } from './active-postponement';
import type { Completion, Task } from './task';

const instant = fc.integer({ min: 0, max: 4_000_000_000_000 }).map((ms) => new Date(ms));
const postponement = fc
	.tuple(instant, fc.integer({ min: 1, max: 100_000_000 }))
	.map(([from, duration]) => ({ from, to: new Date(from.getTime() + duration) }));
/** One-off or relative recurring, with or without postponement, paused or not. */
const task = fc
	.tuple(
		fc.boolean(),
		instant,
		fc.option(instant, { nil: undefined }),
		fc.integer({ min: 1, max: 100 }),
		fc.constantFrom('horas' as const, 'dias' as const),
		fc.option(postponement, { nil: undefined }),
		fc.boolean()
	)
	.map(([isOneOff, createdAt, dueDate, every, unit, postponed, paused]): Task => {
		const common = { id: 't', title: 'T', createdAt, ...(postponed && { postponed }) };
		if (isOneOff) return { ...common, kind: 'puntual', ...(dueDate && { dueDate }) };
		return { ...common, kind: 'periodica', recurrence: { mode: 'relativo', every, unit }, ...(paused && { paused }) };
	});
const completions = fc.array(
	fc.record({ id: fc.uuid(), taskId: fc.constantFrom('t', 'otra'), completedAt: instant }) as fc.Arbitrary<Completion>,
	{ maxLength: 5 }
);

describe('classifyInPending (properties)', () => {
	it('keeps the status of the task and matches isCompleted', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, cs, now) => {
				const classified = classifyInPending(t, cs, now);
				expect(classified.status).toEqual(taskStatus(t, cs, now));
				expect(classified.completed).toBe(isCompleted(t, cs, now));
			})
		);
	});

	it('a task without completions of its own is never completed', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, cs, now) => {
				fc.pre(completionsOfTask(cs, t.id).length === 0);
				expect(isCompleted(t, cs, now)).toBe(false);
			})
		);
	});

	it('a pending or overdue one is never completed', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, cs, now) => {
				const { kind } = taskStatus(t, cs, now);
				fc.pre(kind === 'pendiente' || kind === 'atrasada');
				expect(isCompleted(t, cs, now)).toBe(false);
			})
		);
	});

	it('a one-off with completions is completed, whether or not it is postponed (§5.1)', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, cs, now) => {
				fc.pre(t.kind === 'puntual' && completionsOfTask(cs, t.id).length > 0);
				expect(isCompleted(t, cs, now)).toBe(true);
			})
		);
	});

	it('an active postponed one whose own rule is pending or overdue is not completed (§5.9)', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, cs, now) => {
				fc.pre(activePostponement(t, now) !== undefined);
				const { postponed: _, ...withoutPostponement } = t;
				const { kind } = taskStatus(withoutPostponement, cs, now);
				fc.pre(kind === 'pendiente' || kind === 'atrasada');
				expect(isCompleted(t, cs, now)).toBe(false);
			})
		);
	});

	it('a paused one is never completed (§5.8)', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, cs, now) => {
				fc.pre(t.kind === 'periodica' && t.paused === true);
				expect(isCompleted(t, cs, now)).toBe(false);
			})
		);
	});
});
