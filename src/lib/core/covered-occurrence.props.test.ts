// Spec §5.3: which occurrence each completion covers, exercised through `complete`.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { complete } from './completions';
import { startOfDay, addDays } from './days';
import { recurringCalendarStatus } from './recurring-calendar-status';
import { lastCoveredOccurrence } from './covered-occurrence';
import { isOccurrence, firstLaterOccurrence } from './occurrences';
import { WEEKDAYS, type Completion, type CalendarRecurrence, type RecurringTask } from './task';

const HOUR_MS = 3_600_000;
const recurrence: fc.Arbitrary<CalendarRecurrence> = fc.oneof(
	fc.subarray([...WEEKDAYS], { minLength: 1 }).map((d) => ({ mode: 'calendario' as const, weekdays: d })),
	fc
		.uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 6 })
		.map((d) => ({ mode: 'calendario' as const, monthDays: d.sort((a, b) => a - b) }))
);
const task = fc
	.tuple(recurrence, fc.integer({ min: 0, max: 30_000 }), fc.integer({ min: 0, max: 23 }))
	.map(
		([r, day, hour]): RecurringTask => ({
			id: 't',
			title: 'T',
			kind: 'periodica',
			recurrence: r,
			createdAt: new Date(1990, 0, 1 + day, hour)
		})
	);
/** Moments relative to createdAt, in hours: up to ~4 months later (and some earlier, another clock). */
const shifts = fc.array(fc.integer({ min: -48, max: 3_000 }), { maxLength: 12 });
const inHours = (t: RecurringTask, hours: number) => new Date(t.createdAt.getTime() + hours * HOUR_MS);

/** Completes the task at each moment, in that order, as the app would. */
function completeAt(t: RecurringTask, moments: readonly Date[]): Completion[] {
	return moments.reduce<Completion[]>((cs, m) => [...cs, complete(t, cs, `c${cs.length}`, m)], []);
}
const lastCoveredOf = (t: RecurringTask, cs: readonly Completion[]) => lastCoveredOccurrence(t.createdAt, cs);
const r = (t: RecurringTask) => t.recurrence as CalendarRecurrence;

describe('covered occurrence (properties)', () => {
	it('always covers a real occurrence of the pattern, at 00:00 local', () => {
		fc.assert(
			fc.property(task, shifts, (t, hours) => {
				for (const c of completeAt(t, hours.map((h) => inHours(t, h)))) {
					const covered = c.coveredOccurrence as Date;
					expect(startOfDay(covered)).toEqual(covered);
					expect(isOccurrence(r(t), covered)).toBe(true);
				}
			})
		);
	});

	it('P only grows: each new completion covers an occurrence after P', () => {
		fc.assert(
			fc.property(task, shifts, (t, hours) => {
				const cs = completeAt(t, hours.map((h) => inHours(t, h)));
				cs.forEach((c, i) => {
					expect((c.coveredOccurrence as Date) > lastCoveredOf(t, cs.slice(0, i))).toBe(true);
				});
			})
		);
	});

	it('completing k times without lateness (each time on day N) covers k consecutive occurrences', () => {
		fc.assert(
			fc.property(task, fc.array(fc.integer({ min: 0, max: 23 }), { minLength: 1, maxLength: 10 }), (t, hoursOfDay) => {
				let expectedValue = addDays(startOfDay(t.createdAt), -1);
				const cs: Completion[] = [];
				for (const hour of hoursOfDay) {
					expectedValue = firstLaterOccurrence(r(t), expectedValue);
					const now = new Date(expectedValue.getTime() + hour * HOUR_MS);
					expect(recurringCalendarStatus(r(t), t.createdAt, cs, now).kind).toBe('pendiente');
					cs.push(complete(t, cs, `c${cs.length}`, now));
					expect(cs.at(-1)?.coveredOccurrence).toEqual(expectedValue);
				}
			})
		);
	});

	it('each extra completion at the same moment advances exactly one occurrence', () => {
		fc.assert(
			fc.property(task, shifts, fc.integer({ min: 0, max: 3_000 }), fc.integer({ min: 2, max: 6 }), (t, hours, h, extras) => {
				const now = inHours(t, h);
				const priorCount = hours.length;
				const cs = completeAt(t, [...hours.map((x) => inHours(t, x)), ...Array<Date>(extras).fill(now)]);
				for (let i = priorCount + 1; i < cs.length; i++)
					expect(cs[i].coveredOccurrence).toEqual(firstLaterOccurrence(r(t), cs[i - 1].coveredOccurrence as Date));
			})
		);
	});

	it('the order of the stored completions does not change the occurrence the next one covers', () => {
		const withPermutation = fc
			.tuple(task, shifts)
			.map(([t, hours]) => [t, completeAt(t, hours.map((h) => inHours(t, h)))] as const)
			.chain(([t, cs]) => fc.shuffledSubarray(cs, { minLength: cs.length }).map((another) => [t, cs, another] as const));
		fc.assert(
			fc.property(withPermutation, fc.integer({ min: -48, max: 3_000 }), ([t, cs, another], h) => {
				const now = inHours(t, h);
				expect(complete(t, another, 'x', now)).toEqual(complete(t, cs, 'x', now));
			})
		);
	});

	it('after completing, at that same moment the task is waiting', () => {
		fc.assert(
			fc.property(task, shifts, fc.integer({ min: 0, max: 3_000 }), (t, hours, h) => {
				const now = inHours(t, Math.max(h, ...hours));
				const cs = completeAt(t, [...hours.map((x) => inHours(t, x)), now]);
				expect(recurringCalendarStatus(r(t), t.createdAt, cs, now)).toEqual({ kind: 'en espera', progress: 0 });
			})
		);
	});
});

describe('P with completions from before being a calendar task (properties)', () => {
	/** Mixed completions: calendar ones (with coveredOccurrence) and ones from when it was relative or one-off (without it). */
	const completions = fc.array(
		fc.record(
			{
				id: fc.uuid(),
				taskId: fc.constant('t'),
				completedAt: fc.date({ min: new Date(1990, 0, 1), max: new Date(2100, 0, 1), noInvalidDate: true }),
				coveredOccurrence: fc
					.date({ min: new Date(1990, 0, 1), max: new Date(2100, 0, 1), noInvalidDate: true })
					.map(startOfDay)
			},
			{ requiredKeys: ['id', 'taskId', 'completedAt'] }
		),
		{ minLength: 1, maxLength: 8 }
	);
	/** The completions of these properties cover dates (without a time). */
	const dayOf = (c: Completion) => (c.coveredOccurrence as Date | undefined) ?? startOfDay(c.completedAt);
	const created = new Date(1990, 0, 1);

	it('P is the day covered by one of them and none covers a later one', () => {
		fc.assert(
			fc.property(completions, (cs) => {
				const p = lastCoveredOccurrence(created, cs);
				expect(cs.some((c) => dayOf(c).getTime() === p.getTime())).toBe(true);
				expect(cs.every((c) => dayOf(c).getTime() <= p.getTime())).toBe(true);
				expect(startOfDay(p)).toEqual(p);
			})
		);
	});

	it('P does not depend on the order of the completions', () => {
		fc.assert(
			fc.property(completions, (cs) => {
				expect(lastCoveredOccurrence(created, [...cs].reverse())).toEqual(lastCoveredOccurrence(created, cs));
			})
		);
	});

	it('one more completion never lowers P', () => {
		fc.assert(
			fc.property(completions, completions, (cs, more) => {
				const before = lastCoveredOccurrence(created, cs);
				expect(lastCoveredOccurrence(created, [...cs, more[0]]).getTime()).toBeGreaterThanOrEqual(before.getTime());
			})
		);
	});
});
