import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { checkboxAction } from './checkbox';
import { isCompleted } from './completed';
import { completionsOfTask, complete, lastCompletedAt } from './completions';
import { startOfDay } from './days';
import type { Completion, CalendarRecurrence, RelativeRecurrence, Task } from './task';

const instant = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
const day = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
const relative: fc.Arbitrary<RelativeRecurrence> = fc.record({
	mode: fc.constant('relativo' as const),
	every: fc.integer({ min: 1, max: 1000 }),
	unit: fc.constantFrom('horas' as const, 'dias' as const)
});
const calendar: fc.Arbitrary<CalendarRecurrence> = fc.record({
	mode: fc.constant('calendario' as const),
	monthDays: fc.uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 3 }).map((d) => d.sort((a, b) => a - b))
});
const oneOff = fc
	.tuple(fc.option(day, { nil: undefined }), day)
	.map(([dueDate, createdAt]): Task => ({ id: 't', title: 'T', kind: 'puntual', createdAt, ...(dueDate && { dueDate }) }));
const recurring = (recurrence: fc.Arbitrary<RelativeRecurrence | CalendarRecurrence>) =>
	fc.tuple(recurrence, day).map(([recurrence, createdAt]): Task => ({ id: 't', title: 'T', kind: 'periodica', recurrence, createdAt }));
const task = fc.oneof(oneOff, recurring(relative), recurring(calendar));
/** Completions of task t and of another, so that filtering by task is exercised. */
const completions = fc
	.array(fc.tuple(fc.constantFrom('t', 'otra'), instant), { maxLength: 6 })
	.map((list) => list.map(([taskId, completedAt], i): Completion => ({ id: `c${i}`, taskId, completedAt })));

describe('checkboxAction (properties)', () => {
	it('a task that is not completed is always completed', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, doneOnes, now) => {
				fc.pre(!isCompleted(t, doneOnes, now));
				expect(checkboxAction(t, doneOnes, now)).toEqual({ kind: 'complete' });
			})
		);
	});

	it('if it deletes, it deletes the most recent completion of the task itself', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, doneOnes, now) => {
				const action = checkboxAction(t, doneOnes, now);
				if (action.kind !== 'remove') return;
				const owns = completionsOfTask(doneOnes, t.id);
				expect(owns).toContain(action.completion);
				expect(action.completion.completedAt.getTime()).toBe(lastCompletedAt(owns));
			})
		);
	});

	it('a completed one-off always deletes', () => {
		fc.assert(
			fc.property(oneOff, completions, instant, (t, doneOnes, now) => {
				fc.pre(completionsOfTask(doneOnes, t.id).length > 0);
				expect(checkboxAction(t, doneOnes, now).kind).toBe('remove');
			})
		);
	});

	it('a recurring task whose last completion is from an earlier day is completed again', () => {
		fc.assert(
			fc.property(fc.oneof(recurring(relative), recurring(calendar)), completions, instant, (t, doneOnes, now) => {
				const owns = completionsOfTask(doneOnes, t.id);
				fc.pre(owns.length > 0 && lastCompletedAt(owns) < startOfDay(now).getTime());
				expect(checkboxAction(t, doneOnes, now)).toEqual({ kind: 'complete' });
			})
		);
	});

	it('round trip: tapping after completing now deletes exactly that completion', () => {
		fc.assert(
			fc.property(fc.oneof(oneOff, recurring(relative)), completions, instant, (t, doneOnes, now) => {
				const previousItems = doneOnes.filter(({ completedAt }) => completedAt.getTime() < now.getTime());
				const newValue = complete(t, previousItems, 'nuevo', now);
				expect(checkboxAction(t, [...previousItems, newValue], now)).toEqual({ kind: 'remove', completion: newValue });
			})
		);
	});
});
