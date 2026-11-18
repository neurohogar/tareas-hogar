import { describe, expect, it } from 'vitest';
import {
	endOfDay,
	withinSchedule,
	savedSchedule,
	readSchedule,
	occurrencesOfDay,
	scheduleText,
	lastClosing,
	availableWindow
} from './schedule';
import type { Schedule } from './task';

const MORNING: Schedule = [{ from: '08:00', to: '11:00' }];
const MORNING_AND_AFTERNOON: Schedule = [
	{ from: '07:00', to: '10:00' },
	{ from: '18:00', to: '21:00' }
];
const ms = (...parts: [number, number, number, number?, number?, number?]) => new Date(...parts).getTime();

describe('readSchedule (spec §4.1)', () => {
	it('without a schedule written, the task has no schedule', () => {
		expect(readSchedule(undefined)).toStrictEqual({ ok: true });
		expect(readSchedule([])).toStrictEqual({ ok: true });
	});

	it.each([
		['08:00', '11:00'],
		['00:00', '23:59'],
		['09:00', '09:01']
	])('with from < to (%s to %s) it is valid and stored as is', (from, to) => {
		expect(readSchedule([{ from, to }])).toStrictEqual({ ok: true, schedule: [{ from, to }] });
	});

	it.each([
		['11:00', '08:00'],
		['09:00', '09:00'],
		['22:00', '02:00']
	])('with from ≥ to (%s to %s) the end time is not later', (from, to) => {
		expect(readSchedule([{ from, to }])).toStrictEqual({ ok: false, error: 'finNoPosterior' });
	});

	it.each([{ from: '08:00' }, { to: '11:00' }, { from: '08:00', to: '' }, { from: '', to: '' }, { from: '8:00', to: '11:00' }, { from: '24:00', to: '11:00' }])(
		'with a time that is missing or is not HH:MM it is incomplete (%o)',
		(typedOne) => {
			expect(readSchedule([typedOne])).toStrictEqual({ ok: false, error: 'incompleto' });
		}
	);

	it('several windows are stored ordered by from', () => {
		expect(readSchedule([MORNING_AND_AFTERNOON[1], MORNING_AND_AFTERNOON[0]])).toStrictEqual({ ok: true, schedule: MORNING_AND_AFTERNOON });
	});

	it('a window that starts right when another ends is valid', () => {
		const contiguous = [
			{ from: '10:00', to: '12:00' },
			{ from: '08:00', to: '10:00' }
		];
		expect(readSchedule(contiguous)).toStrictEqual({ ok: true, schedule: [contiguous[1], contiguous[0]] });
	});

	it.each([
		[{ from: '08:00', to: '11:00' }, { from: '10:00', to: '12:00' }],
		[{ from: '08:00', to: '11:00' }, { from: '08:00', to: '11:00' }],
		[{ from: '08:00', to: '12:00' }, { from: '09:00', to: '10:00' }],
		[{ from: '10:00', to: '12:00' }, { from: '08:00', to: '10:01' }]
	])('overlapping windows are rejected (%o and %o)', (one, other) => {
		expect(readSchedule([one, other])).toStrictEqual({ ok: false, error: 'superpuestos' });
	});

	it('a second window that is incomplete or has from ≥ to rejects the whole schedule', () => {
		expect(readSchedule([MORNING_AND_AFTERNOON[0], { from: '18:00' }])).toStrictEqual({ ok: false, error: 'incompleto' });
		expect(readSchedule([MORNING_AND_AFTERNOON[0], { from: '21:00', to: '18:00' }])).toStrictEqual({ ok: false, error: 'finNoPosterior' });
	});
});

describe('savedSchedule (spec §4.1)', () => {
	it('a document with a single window (previous format) is read as a list of one', () => {
		expect(savedSchedule({ from: '08:00', to: '11:00' })).toStrictEqual(MORNING);
	});

	it('a list is read as is', () => {
		expect(savedSchedule(MORNING_AND_AFTERNOON)).toStrictEqual(MORNING_AND_AFTERNOON);
	});
});

describe('schedule windows (spec §5.5)', () => {
	it('before the window of its day, available from the from of that day and closing at its to', () => {
		expect(availableWindow(MORNING, new Date(2026, 6, 15, 6, 0, 0))).toStrictEqual({
			available: ms(2026, 6, 15, 8),
			closing: ms(2026, 6, 15, 11)
		});
	});

	it('inside the window, available at that same instant (from inclusive)', () => {
		expect(availableWindow(MORNING, new Date(2026, 6, 15, 8, 0, 0))).toStrictEqual({
			available: ms(2026, 6, 15, 8),
			closing: ms(2026, 6, 15, 11)
		});
		expect(availableWindow(MORNING, new Date(2026, 6, 15, 10, 59, 59)).available).toBe(ms(2026, 6, 15, 10, 59, 59));
	});

	it('from the to (exclusive), available in the window of the next day', () => {
		expect(availableWindow(MORNING, new Date(2026, 6, 15, 11, 0, 0))).toStrictEqual({
			available: ms(2026, 6, 16, 8),
			closing: ms(2026, 6, 16, 11)
		});
	});

	it('with several windows, between windows it is available from the from of the next one', () => {
		expect(availableWindow(MORNING_AND_AFTERNOON, new Date(2026, 6, 15, 10, 0, 0))).toStrictEqual({
			available: ms(2026, 6, 15, 18),
			closing: ms(2026, 6, 15, 21)
		});
		expect(availableWindow(MORNING_AND_AFTERNOON, new Date(2026, 6, 15, 21, 0, 0))).toStrictEqual({
			available: ms(2026, 6, 16, 7),
			closing: ms(2026, 6, 16, 10)
		});
	});

	it('inside the schedule is [from, to) of some window', () => {
		expect(withinSchedule(MORNING, new Date(2026, 6, 15, 7, 59, 59))).toBe(false);
		expect(withinSchedule(MORNING, new Date(2026, 6, 15, 8, 0, 0))).toBe(true);
		expect(withinSchedule(MORNING, new Date(2026, 6, 15, 10, 59, 59))).toBe(true);
		expect(withinSchedule(MORNING, new Date(2026, 6, 15, 11, 0, 0))).toBe(false);
		expect(withinSchedule(MORNING_AND_AFTERNOON, new Date(2026, 6, 15, 12, 0, 0))).toBe(false);
		expect(withinSchedule(MORNING_AND_AFTERNOON, new Date(2026, 6, 15, 18, 0, 0))).toBe(true);
	});

	it('the close of a day is the to of its last window', () => {
		expect(endOfDay(MORNING, new Date(2026, 6, 16))).toBe(ms(2026, 6, 16, 11));
		expect(endOfDay(MORNING_AND_AFTERNOON, new Date(2026, 6, 16))).toBe(ms(2026, 6, 16, 21));
	});

	it('the last close is the most recent to that has already passed, from today or yesterday', () => {
		expect(lastClosing(MORNING, new Date(2026, 6, 15, 11, 0, 0))).toBe(ms(2026, 6, 15, 11));
		expect(lastClosing(MORNING, new Date(2026, 6, 15, 21, 30, 0))).toBe(ms(2026, 6, 15, 11));
		expect(lastClosing(MORNING, new Date(2026, 6, 16, 2, 0, 0))).toBe(ms(2026, 6, 15, 11));
		expect(lastClosing(MORNING_AND_AFTERNOON, new Date(2026, 6, 15, 14, 0, 0))).toBe(ms(2026, 6, 15, 10));
		expect(lastClosing(MORNING_AND_AFTERNOON, new Date(2026, 6, 16, 2, 0, 0))).toBe(ms(2026, 6, 15, 21));
	});

	it('the occurrences of a day are its windows in order, with start and close', () => {
		expect(occurrencesOfDay(MORNING_AND_AFTERNOON, new Date(2026, 6, 15))).toStrictEqual([
			{ start: ms(2026, 6, 15, 7), closing: ms(2026, 6, 15, 10) },
			{ start: ms(2026, 6, 15, 18), closing: ms(2026, 6, 15, 21) }
		]);
	});
});

describe('scheduleText (spec §6.1)', () => {
	it('shows from and to separated by a dash', () => {
		expect(scheduleText(MORNING)).toBe('08:00–11:00');
	});

	it('with several windows, in order and separated by " · "', () => {
		expect(scheduleText(MORNING_AND_AFTERNOON)).toBe('07:00–10:00 · 18:00–21:00');
	});
});
