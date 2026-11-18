import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { checkboxEnabled } from './checkbox';
import { isCompleted } from './completed';
import { taskStatus } from './task-status';
import { endOfDay, withinSchedule } from './schedule';
import { WEEKDAYS, type Completion, type Schedule, type Task } from './task';
import { urgencyInstant } from './urgency';

const hour = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
/** A valid schedule (§4.1): from one to four ordered, non-overlapping windows. */
const schedule: fc.Arbitrary<Schedule> = fc
	.integer({ min: 1, max: 4 })
	.chain((n) => fc.uniqueArray(fc.integer({ min: 0, max: 1439 }), { minLength: 2 * n, maxLength: 2 * n }))
	.map((minutes) => {
		const order = [...minutes].sort((a, b) => a - b);
		return order.flatMap((m, i) => (i % 2 === 0 ? [{ from: hour(m), to: hour(order[i + 1]) }] : []));
	});
const instant = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
const day = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
const recurrence = fc.oneof(
	fc.record({
		mode: fc.constant('relativo' as const),
		every: fc.integer({ min: 1, max: 1000 }),
		unit: fc.constantFrom('horas' as const, 'dias' as const)
	}),
	fc.record({
		mode: fc.constant('calendario' as const),
		monthDays: fc
			.uniqueArray(fc.integer({ min: 1, max: 31 }), {
				minLength: 1,
				maxLength: 3
			})
			.map((d) => d.sort((a, b) => a - b))
	}),
	fc.record({
		mode: fc.constant('calendario' as const),
		weekdays: fc.subarray([...WEEKDAYS], { minLength: 1 })
	})
);
/** A task with a schedule, of any kind and recurrence. */
const task = fc.tuple(schedule, fc.option(day, { nil: undefined }), fc.option(recurrence, { nil: undefined }), instant).map(
	([schedule, dueDate, recurrence, createdAt]): Task & {
		schedule: Schedule;
	} => {
		const common = { id: 't', title: 'T', schedule, createdAt };
		// §4.1: a relative task in hours has a single window.
		if (recurrence?.mode === 'relativo' && recurrence.unit === 'horas') return { ...common, schedule: [schedule[0]], kind: 'periodica', recurrence };
		if (recurrence) return { ...common, kind: 'periodica', recurrence };
		return { ...common, kind: 'puntual', ...(dueDate && { dueDate }) };
	}
);
const completions = fc.array(instant, { maxLength: 4 }).map((list) =>
	list.map((completedAt, i): Completion => ({
		id: `c${i}`,
		taskId: 't',
		completedAt
	}))
);

const withoutSchedule = ({ schedule: _, ...rest }: Task): Task => rest as Task;

describe('status with a schedule (properties, spec §5.5)', () => {
	it('outside its window, a task with a schedule is never pending', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, cs, now) => {
				if (!withinSchedule(t.schedule, now)) expect(taskStatus(t, cs, now).kind).not.toBe('pendiente');
			})
		);
	});

	it('with or without a schedule, the task is completed in the same cases', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, cs, now) => {
				const withSchedule = taskStatus(t, cs, now);
				const without = taskStatus(withoutSchedule(t), cs, now);
				expect(withSchedule.kind === 'completada').toBe(without.kind === 'completada');
			})
		);
	});

	it('a one-off with a schedule that is not completed becomes overdue right at the close of the last window of its due date', () => {
		fc.assert(
			fc.property(task, instant, (t, now) => {
				fc.pre(t.kind === 'puntual');
				const lateness = t.kind === 'puntual' && t.dueDate ? endOfDay(t.schedule, t.dueDate) : Number.POSITIVE_INFINITY;
				expect(taskStatus(t, [], now).kind === 'atrasada').toBe(now.getTime() >= lateness);
			})
		);
	});

	// While waiting, the instant is A (§5.5): it no longer waits there, even though the lateness may have come earlier.
	it('the urgency instant is A for a waiting one and since when it is overdue for an overdue one', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, cs, now) => {
				const status = taskStatus(t, cs, now);
				if (status.kind !== 'en espera' && status.kind !== 'atrasada') return;
				const moment = urgencyInstant(t, cs, status, now) as Date;
				const at = taskStatus(t, cs, moment).kind;
				if (status.kind === 'en espera') {
					expect(moment.getTime()).toBeGreaterThan(now.getTime());
					expect(at).not.toBe('en espera');
				} else {
					const before = taskStatus(t, cs, new Date(moment.getTime() - 1)).kind;
					expect(moment.getTime()).toBeLessThanOrEqual(now.getTime());
					expect([before === 'atrasada', at]).toEqual([false, 'atrasada']);
				}
			})
		);
	});
});

describe('checkbox with a schedule (properties, spec §5.5 and §6.1)', () => {
	it('inside the window the checkbox is always enabled', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, cs, now) => {
				fc.pre(withinSchedule(t.schedule, now));
				expect(checkboxEnabled(t, cs, now)).toBe(true);
			})
		);
	});

	it('outside the window, it is only enabled to delete a completion', () => {
		fc.assert(
			fc.property(task, completions, instant, (t, cs, now) => {
				fc.pre(!withinSchedule(t.schedule, now));
				const completed = isCompleted(t, cs, now);
				if (!completed) expect(checkboxEnabled(t, cs, now)).toBe(false);
			})
		);
	});
});
