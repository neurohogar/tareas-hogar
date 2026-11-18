// Spec §5.6 and §5.7: occurrences of a recurring task with a schedule.
import { describe, expect, it } from 'vitest';
import {
	calendarOccurrenceThatCovers,
	windowOccurrenceThatCovers,
	nextCalendarOccurrence,
	nextWindowOccurrence,
	completesByWindow
} from './occurrences-with-schedule';
import type { Completion, Schedule, CalendarRecurrence, RelativeRecurrence } from './task';

const MORNING_AND_AFTERNOON: Schedule = [
	{ from: '07:00', to: '10:00' },
	{ from: '18:00', to: '21:00' }
];
const at = (day: number, hour = 0, minute = 0, secondOne = 0) => new Date(2026, 6, day, hour, minute, secondOne);
const ms = (day: number, hour = 0, minute = 0) => at(day, hour, minute).getTime();
const occurrence = (day: number, from: number, to: number) => ({ start: ms(day, from), closing: ms(day, to) });
const completion = (completedAt: Date, coveredOccurrence?: Completion['coveredOccurrence']): Completion => ({
	id: `c-${completedAt.getTime()}`,
	taskId: 't',
	completedAt,
	...(coveredOccurrence && { coveredOccurrence })
});
const coversStart = (completedAt: Date, start: Date) => completion(completedAt, { start });

/** Wednesday 15 and Thursday 16 July 2026. */
const WEDNESDAY_AND_THURSDAY: CalendarRecurrence = { mode: 'calendario', weekdays: ['miércoles', 'jueves'] };
const EVERY_2_DAYS: RelativeRecurrence = { mode: 'relativo', every: 2, unit: 'dias' };

describe('next calendar occurrence with a schedule (spec §5.6)', () => {
	it('with the morning covered, it is the afternoon of the same day', () => {
		const n = nextCalendarOccurrence(WEDNESDAY_AND_THURSDAY, MORNING_AND_AFTERNOON, at(1), [coversStart(at(15, 8), at(15, 7))]);
		expect(n).toStrictEqual(occurrence(15, 18, 21));
	});

	it('with the afternoon covered, it is the morning of the next occurrence day', () => {
		const n = nextCalendarOccurrence(WEDNESDAY_AND_THURSDAY, MORNING_AND_AFTERNOON, at(1), [coversStart(at(9, 19), at(9, 18))]);
		expect(n).toStrictEqual(occurrence(15, 7, 10));
	});

	it('with the whole day covered, it is the morning of the next occurrence day', () => {
		const n = nextCalendarOccurrence(WEDNESDAY_AND_THURSDAY, MORNING_AND_AFTERNOON, at(1), [completion(at(15, 8), at(15))]);
		expect(n).toStrictEqual(occurrence(16, 7, 10));
	});

	it('without completions, created on an occurrence day, it is the first window of that day even if it has already passed', () => {
		expect(nextCalendarOccurrence(WEDNESDAY_AND_THURSDAY, MORNING_AND_AFTERNOON, at(15, 12), [])).toStrictEqual(occurrence(15, 7, 10));
	});

	it('with a window that starts at 00:00 right after a fully covered day, it is that one', () => {
		const midnight: Schedule = [{ from: '00:00', to: '02:00' }];
		const n = nextCalendarOccurrence(WEDNESDAY_AND_THURSDAY, midnight, at(1), [completion(at(15, 1), at(15))]);
		expect(n).toStrictEqual(occurrence(16, 0, 2));
	});
});

describe('which occurrence a calendar completion with a schedule covers (spec §5.6)', () => {
	const thursdayAfternoon9 = [coversStart(at(9, 19), at(9, 18))];

	it('in the morning, the morning', () => {
		expect(calendarOccurrenceThatCovers(WEDNESDAY_AND_THURSDAY, MORNING_AND_AFTERNOON, at(1), thursdayAfternoon9, at(15, 8))).toStrictEqual(at(15, 7));
	});

	it('with the morning missed, in the afternoon it covers the afternoon (the morning is dropped)', () => {
		expect(calendarOccurrenceThatCovers(WEDNESDAY_AND_THURSDAY, MORNING_AND_AFTERNOON, at(1), thursdayAfternoon9, at(15, 18, 30))).toStrictEqual(
			at(15, 18)
		);
	});

	it('overdue between windows, the most recent uncovered one', () => {
		expect(calendarOccurrenceThatCovers(WEDNESDAY_AND_THURSDAY, MORNING_AND_AFTERNOON, at(1), thursdayAfternoon9, at(15, 12))).toStrictEqual(at(15, 7));
	});

	it('before N, it covers N', () => {
		const wednesdayAfternoon = [coversStart(at(15, 19), at(15, 18))];
		const recurrence: CalendarRecurrence = { mode: 'calendario', weekdays: ['miércoles'] };
		expect(calendarOccurrenceThatCovers(recurrence, MORNING_AND_AFTERNOON, at(1), wednesdayAfternoon, at(16, 8))).toStrictEqual(at(22, 7));
	});
});

describe('relative with several windows (spec §5.7)', () => {
	it('is completed per window only with more than one window and the interval in days', () => {
		expect(completesByWindow(EVERY_2_DAYS, MORNING_AND_AFTERNOON)).toBe(true);
		expect(completesByWindow(EVERY_2_DAYS, [MORNING_AND_AFTERNOON[0]])).toBe(false);
		expect(completesByWindow({ mode: 'relativo', every: 8, unit: 'horas' }, MORNING_AND_AFTERNOON)).toBe(false);
	});

	it('never completed, N is the first window whose to is later than createdAt', () => {
		expect(nextWindowOccurrence(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(13, 6), [])).toStrictEqual(occurrence(13, 7, 10));
		expect(nextWindowOccurrence(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(13, 8), [])).toStrictEqual(occurrence(13, 7, 10));
		expect(nextWindowOccurrence(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(13, 10), [])).toStrictEqual(occurrence(13, 18, 21));
		expect(nextWindowOccurrence(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(13, 21), [])).toStrictEqual(occurrence(14, 7, 10));
	});

	it('with the morning covered, the day round continues', () => {
		expect(nextWindowOccurrence(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(1), [coversStart(at(13, 8), at(13, 7))])).toStrictEqual(
			occurrence(13, 18, 21)
		);
	});

	it('with the round complete, the first window every `every` days', () => {
		expect(nextWindowOccurrence(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(1), [coversStart(at(13, 19), at(13, 18))])).toStrictEqual(
			occurrence(15, 7, 10)
		);
		const every3: RelativeRecurrence = { mode: 'relativo', every: 3, unit: 'dias' };
		expect(nextWindowOccurrence(every3, MORNING_AND_AFTERNOON, at(1), [coversStart(at(13, 19), at(13, 18))])).toStrictEqual(
			occurrence(16, 7, 10)
		);
	});

	it('a completion without coveredOccurrence covers the whole day of its completedAt', () => {
		expect(nextWindowOccurrence(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(1), [completion(at(13, 8))])).toStrictEqual(occurrence(15, 7, 10));
	});

	it('before the close of N, a completion covers N', () => {
		const mondayRound = [coversStart(at(13, 19), at(13, 18))];
		expect(windowOccurrenceThatCovers(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(1), mondayRound, at(14, 19))).toStrictEqual(at(15, 7));
		expect(windowOccurrenceThatCovers(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(1), mondayRound, at(15, 8))).toStrictEqual(at(15, 7));
	});

	it('overdue, it covers the window with the most recent start, of any day', () => {
		const mondayRound = [coversStart(at(13, 19), at(13, 18))];
		expect(windowOccurrenceThatCovers(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(1), mondayRound, at(16, 8))).toStrictEqual(at(16, 7));
		expect(windowOccurrenceThatCovers(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(1), mondayRound, at(15, 19))).toStrictEqual(at(15, 18));
		expect(windowOccurrenceThatCovers(EVERY_2_DAYS, MORNING_AND_AFTERNOON, at(1), mondayRound, at(16, 5))).toStrictEqual(at(15, 18));
	});
});
