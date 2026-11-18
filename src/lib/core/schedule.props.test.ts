import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { addDays } from './days';
import { endOfDay, withinSchedule, readSchedule, occurrencesOfDay, scheduleText, lastClosing, availableWindow } from './schedule';
import type { Schedule } from './task';

const hour = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const minutesOfDay = fc.integer({ min: 0, max: 1439 });
/** A valid schedule (§4.1): from one to four ordered, non-overlapping windows. */
const schedule: fc.Arbitrary<Schedule> = fc
	.integer({ min: 1, max: 4 })
	.chain((n) => fc.uniqueArray(minutesOfDay, { minLength: 2 * n, maxLength: 2 * n }))
	.map((minutes) => {
		const order = [...minutes].sort((a, b) => a - b);
		return order.flatMap((m, i) => (i % 2 === 0 ? [{ from: hour(m), to: hour(order[i + 1]) }] : []));
	});
const instant = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
/** Local minutes since 00:00 of the moment (only to compare with the HH:MM times). */
const localMinute = (moment: Date) => moment.getHours() * 60 + moment.getMinutes();
const minutesOf = (text: string) => Number(text.slice(0, 2)) * 60 + Number(text.slice(3));

describe('readSchedule (properties)', () => {
	it('a valid schedule is read as is: reading is idempotent over what is stored', () => {
		fc.assert(
			fc.property(schedule, (h) => {
				expect(readSchedule(h)).toEqual({ ok: true, schedule: h });
			})
		);
	});

	it('two times with from ≥ to: the end one is not later', () => {
		fc.assert(
			fc.property(minutesOfDay, minutesOfDay, (a, b) => {
				fc.pre(a >= b);
				expect(readSchedule([{ from: hour(a), to: hour(b) }])).toEqual({
					ok: false,
					error: 'endNotAfterStart'
				});
			})
		);
	});

	it('if one of the two times is missing, it is incomplete', () => {
		fc.assert(
			fc.property(minutesOfDay, fc.boolean(), fc.constantFrom(undefined, ''), (m, missingFrom, missing) => {
				const typedOne = missingFrom ? { from: missing, to: hour(m) } : { from: hour(m), to: missing };
				expect(readSchedule([typedOne])).toEqual({
					ok: false,
					error: 'incomplete'
				});
			})
		);
	});

	it('the order in which the windows are written does not matter: they are stored ordered by from', () => {
		fc.assert(
			fc.property(
				schedule.chain((h) => fc.tuple(fc.constant(h), fc.shuffledSubarray(h, { minLength: h.length, maxLength: h.length }))),
				([h, typedOne]) => {
					expect(readSchedule(typedOne)).toEqual({ ok: true, schedule: h });
				}
			)
		);
	});

	it('two windows that overlap are overlapping, in any order', () => {
		fc.assert(
			fc.property(fc.uniqueArray(minutesOfDay, { minLength: 3, maxLength: 3 }), minutesOfDay, fc.boolean(), (three, extra, invert) => {
				// a < b < c ≤ max(c, extra): [a, c) and [b, max(c, extra)) share [b, c).
				const [a, b, c] = [...three].sort((x, y) => x - y);
				const timeWindows = [
					{ from: hour(a), to: hour(c) },
					{ from: hour(b), to: hour(Math.max(c, extra)) }
				];
				expect(readSchedule(invert ? timeWindows.reverse() : timeWindows)).toEqual({ ok: false, error: 'overlapping' });
			})
		);
	});

	it('the row text names each window, in order, separated by " · "', () => {
		fc.assert(
			fc.property(schedule, (h) => {
				const parts = scheduleText(h).split(' · ');
				expect(parts).toEqual(h.map(({ from, to }) => `${from}–${to}`));
			})
		);
	});
});

describe('schedule window (properties)', () => {
	it('inside the schedule: the local minute is in [from, to) of some window', () => {
		fc.assert(
			fc.property(schedule, instant, (h, now) => {
				const minute = localMinute(now);
				expect(withinSchedule(h, now)).toBe(h.some(({ from, to }) => minute >= minutesOf(from) && minute < minutesOf(to)));
			})
		);
	});

	it('A is the first instant ≥ from inside a window, and C the to of that window', () => {
		fc.assert(
			fc.property(schedule, instant, (h, from) => {
				const { available, closing } = availableWindow(h, from);
				expect(available).toBeGreaterThanOrEqual(from.getTime());
				expect(withinSchedule(h, new Date(available))).toBe(true);
				// C is the to of the window of the day of A that contains A.
				const timeWindow = occurrencesOfDay(h, new Date(available)).find(({ start, closing }) => start <= available && available < closing);
				expect(closing).toBe(timeWindow?.closing);
				// Between from and A there is no instant inside a window: A is the first.
				if (available > from.getTime()) expect(withinSchedule(h, new Date(available - 1))).toBe(false);
			})
		);
	});

	it('A is idempotent: from A, the available window is the same', () => {
		fc.assert(
			fc.property(schedule, instant, (h, from) => {
				const timeWindow = availableWindow(h, from);
				expect(availableWindow(h, new Date(timeWindow.available))).toEqual(timeWindow);
			})
		);
	});

	it('the last close has already passed and there is no other close between it and now', () => {
		fc.assert(
			fc.property(schedule, instant, (h, now) => {
				const closing = lastClosing(h, now);
				expect(closing).toBeLessThanOrEqual(now.getTime());
				const closings = [-1, 0, 1].flatMap((d) => occurrencesOfDay(h, addDays(now, d)).map((o) => o.closing));
				expect(closings).toContain(closing);
				expect(closings.filter((c) => c > closing && c <= now.getTime())).toEqual([]);
			})
		);
	});

	it('the close of the day is the to of its last window', () => {
		fc.assert(
			fc.property(schedule, instant, (h, day) => {
				expect(endOfDay(h, day)).toBe(Math.max(...occurrencesOfDay(h, day).map((o) => o.closing)));
			})
		);
	});
});
