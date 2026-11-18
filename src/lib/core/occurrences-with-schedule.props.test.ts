// Spec §5.6 and §5.7: which occurrence (day, window) each completion of a
// recurring task with a schedule covers, exercised through `complete`.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { complete } from './completions';
import { occurrencesOfDay } from './schedule';
import { lastCovered } from './covered-occurrence';
import { isOccurrence } from './occurrences';
import { nextCalendarOccurrence, nextWindowOccurrence } from './occurrences-with-schedule';
import { WEEKDAYS, type Completion, type Schedule, type OccurrenceStart, type RecurringTask } from './task';

const HOUR_MS = 3_600_000;
const hour = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
/** A valid schedule (§4.1) of `n` ordered, non-overlapping windows. */
const scheduleOf = (min: number) =>
	fc
		.integer({ min, max: 4 })
		.chain((n) => fc.uniqueArray(fc.integer({ min: 0, max: 1439 }), { minLength: 2 * n, maxLength: 2 * n }))
		.map((minutes): Schedule => {
			const order = [...minutes].sort((a, b) => a - b);
			return order.flatMap((m, i) => (i % 2 === 0 ? [{ from: hour(m), to: hour(order[i + 1]) }] : []));
		});
const calendar = fc.oneof(
	fc.subarray([...WEEKDAYS], { minLength: 1 }).map((d) => ({ mode: 'calendario' as const, weekdays: d })),
	fc
		.uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 6 })
		.map((d) => ({ mode: 'calendario' as const, monthDays: d.sort((a, b) => a - b) }))
);
/** §5.7: a relative one is completed per window with the interval in days and more than one window. */
const byWindow = fc.integer({ min: 1, max: 30 }).map((every) => ({ mode: 'relativo' as const, every, unit: 'dias' as const }));
const createdAt = fc.tuple(fc.integer({ min: 0, max: 30_000 }), fc.integer({ min: 0, max: 1439 })).map(([day, m]) => new Date(1990, 0, 1 + day, 0, m));

type TaskWithSchedule = RecurringTask & { schedule: Schedule };
const calendarTask = fc
	.tuple(calendar, scheduleOf(1), createdAt)
	.map(([recurrence, schedule, created]): TaskWithSchedule => ({ id: 't', title: 'T', kind: 'periodica', recurrence, schedule, createdAt: created }));
const taskByWindow = fc
	.tuple(byWindow, scheduleOf(2), createdAt)
	.map(([recurrence, schedule, created]): TaskWithSchedule => ({ id: 't', title: 'T', kind: 'periodica', recurrence, schedule, createdAt: created }));
const task = fc.oneof(calendarTask, taskByWindow);

/** Moments relative to createdAt, in hours: up to ~4 months later (and some earlier, another clock). */
const shifts = fc.array(fc.integer({ min: -48, max: 3_000 }), { maxLength: 10 });
const inHours = (t: RecurringTask, hours: number) => new Date(t.createdAt.getTime() + hours * HOUR_MS);

/** Completes the task at each moment, in that order, as the app would. */
function completeAt(t: RecurringTask, moments: readonly Date[]): Completion[] {
	return moments.reduce<Completion[]>((cs, m) => [...cs, complete(t, cs, `c${cs.length}`, m)], []);
}
const coveredStart = (c: Completion) => (c.coveredOccurrence as OccurrenceStart).start.getTime();
/** N: the next occurrence (day, window) according to the recurrence. */
function next({ recurrence, schedule, createdAt: created }: TaskWithSchedule, cs: readonly Completion[]) {
	if (recurrence.mode === 'calendario') return nextCalendarOccurrence(recurrence, schedule, created, cs);
	return nextWindowOccurrence(recurrence, schedule, created, cs);
}

describe('occurrences with a schedule (properties, spec §5.6 and §5.7)', () => {
	it('each completion covers the start of a window of a day that counts', () => {
		fc.assert(
			fc.property(task, shifts, (t, hours) => {
				for (const c of completeAt(t, hours.map((h) => inHours(t, h)))) {
					const start = (c.coveredOccurrence as OccurrenceStart).start;
					expect(occurrencesOfDay(t.schedule, start).map((o) => o.start)).toContain(start.getTime());
					if (t.recurrence.mode === 'calendario') expect(isOccurrence(t.recurrence, start)).toBe(true);
				}
			})
		);
	});

	it('P only grows: each completion covers an occurrence later than P, never earlier than N', () => {
		fc.assert(
			fc.property(task, shifts, (t, hours) => {
				const cs = completeAt(t, hours.map((h) => inHours(t, h)));
				cs.forEach((c, i) => {
					const before = cs.slice(0, i);
					expect(coveredStart(c)).toBeGreaterThan(lastCovered(t.createdAt, before));
					expect(coveredStart(c)).toBeGreaterThanOrEqual(next(t, before).start);
				});
			})
		);
	});

	it('it does not run ahead: it covers N or an occurrence that already started', () => {
		fc.assert(
			fc.property(task, shifts, (t, hours) => {
				const cs = completeAt(t, hours.map((h) => inHours(t, h)));
				cs.forEach((c, i) => {
					const n = next(t, cs.slice(0, i)).start;
					expect(coveredStart(c) === n || coveredStart(c) <= c.completedAt.getTime()).toBe(true);
				});
			})
		);
	});

	it('N starts after P, is a valid window and advances on completing', () => {
		fc.assert(
			fc.property(task, shifts, (t, hours) => {
				const cs = completeAt(t, hours.map((h) => inHours(t, h)));
				const n = next(t, cs);
				expect(n.start).toBeGreaterThan(lastCovered(t.createdAt, cs));
				expect(occurrencesOfDay(t.schedule, new Date(n.start))).toContainEqual(n);
				if (cs.length > 0) expect(n.start).toBeGreaterThan(coveredStart(cs[cs.length - 1]));
			})
		);
	});

	it('P does not depend on the order of the completions', () => {
		fc.assert(
			fc.property(task, shifts, fc.nat(), (t, hours, rotation) => {
				const cs = completeAt(t, hours.map((h) => inHours(t, h)));
				const k = rotation % Math.max(cs.length, 1);
				expect(lastCovered(t.createdAt, [...cs.slice(k), ...cs.slice(0, k)])).toBe(lastCovered(t.createdAt, cs));
				expect(lastCovered(t.createdAt, [...cs].reverse())).toBe(lastCovered(t.createdAt, cs));
			})
		);
	});
});
