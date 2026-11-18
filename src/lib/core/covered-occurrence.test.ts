import { describe, expect, it } from 'vitest';
import { lastCovered, lastCoveredOccurrence } from './covered-occurrence';
import type { Completion } from './task';

const CREATED = new Date(2026, 5, 1, 8, 0, 0);
const day = (d: number) => new Date(2026, 6, d);

const covers = (d: number, completedAt = day(d)): Completion => ({
	id: `c-${d}`,
	taskId: 't',
	completedAt,
	coveredOccurrence: day(d)
});
const uncovered = (completedAt: Date): Completion => ({ id: 'c-libre', taskId: 't', completedAt });

describe('lastCoveredOccurrence (P)', () => {
	it('without completions it is the day before createdAt', () => {
		expect(lastCoveredOccurrence(CREATED, [])).toEqual(new Date(2026, 4, 31));
	});

	it('it is the greatest coveredOccurrence', () => {
		expect(lastCoveredOccurrence(CREATED, [covers(16, day(14)), covers(7)])).toEqual(day(16));
	});

	it('a completion without coveredOccurrence contributes the day of its completedAt', () => {
		expect(lastCoveredOccurrence(CREATED, [uncovered(new Date(2026, 6, 13, 10, 0, 0))])).toEqual(day(13));
	});

	it('takes the greatest between the covered ones and the days of the completions without coverage', () => {
		const completions = [covers(7), uncovered(new Date(2026, 6, 13, 10, 0, 0))];

		expect(lastCoveredOccurrence(CREATED, completions)).toEqual(day(13));
		expect(lastCoveredOccurrence(CREATED, [covers(16), uncovered(new Date(2026, 6, 14, 23, 0, 0))])).toEqual(day(16));
	});
});

const at = (d: number, hour = 0) => new Date(2026, 6, d, hour);
const ms = (d: number, hour = 0) => at(d, hour).getTime();
const completion = (completedAt: Date, coveredOccurrence?: Completion['coveredOccurrence']): Completion => ({
	id: `c-${completedAt.getTime()}`,
	taskId: 't',
	completedAt,
	...(coveredOccurrence && { coveredOccurrence })
});
const coversStart = (completedAt: Date, start: Date) => completion(completedAt, { start });

describe('P with a schedule (spec §5.6)', () => {
	it('a coveredOccurrence with a time is the instant it covered', () => {
		expect(lastCovered(at(1), [coversStart(at(15, 8), at(15, 7))])).toBe(ms(15, 7));
	});

	it('a date alone, or a completion without coveredOccurrence, covers the whole day', () => {
		expect(lastCovered(at(1), [completion(at(15, 8), at(15))])).toBe(ms(16) - 1);
		expect(lastCovered(at(1), [completion(at(15, 6))])).toBe(ms(16) - 1);
	});

	it('with and without a time, it is the greatest of the completions', () => {
		expect(lastCovered(at(1), [coversStart(at(15, 19), at(15, 18)), completion(at(15, 8), at(15))])).toBe(ms(16) - 1);
		expect(lastCovered(at(1), [completion(at(14, 8), at(14)), coversStart(at(15, 8), at(15, 7))])).toBe(ms(15, 7));
	});

	it('without completions, it covers the whole day before createdAt', () => {
		expect(lastCovered(at(15, 12), [])).toBe(ms(15) - 1);
	});
});

describe('lastCoveredOccurrence with a schedule (spec §5.3, §5.6)', () => {
	it('a coveredOccurrence with a time counts by its day', () => {
		expect(lastCoveredOccurrence(CREATED, [coversStart(at(15, 19), at(15, 18))])).toEqual(day(15));
	});
});
