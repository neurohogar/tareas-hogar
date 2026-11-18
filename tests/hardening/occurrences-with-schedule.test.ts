// Hardening: exact edges of the occurrence that a completion covers (spec §5.6 and §5.7).
import { describe, expect, it } from 'vitest';
import { windowOccurrenceThatCovers } from '../../src/lib/core/occurrences-with-schedule';
import type { Schedule, RelativeRecurrence } from '../../src/lib/core/task';

const EVERY_DAY: RelativeRecurrence = { mode: 'relativo', every: 1, unit: 'dias' };
const at = (hour: number, minute = 0) => new Date(2026, 6, 15, hour, minute);

describe('windowOccurrenceThatCovers: exact edges', () => {
	it('at the exact close of N, it is no longer N: the most recently started window covers it (contiguous)', () => {
		const contiguous: Schedule = [
			{ from: '07:00', to: '10:00' },
			{ from: '10:00', to: '12:00' }
		];
		expect(windowOccurrenceThatCovers(EVERY_DAY, contiguous, at(6), [], at(10))).toStrictEqual(at(10));
	});

	it('right at the start of a later window, that window has already started and is the one that covers', () => {
		const two: Schedule = [
			{ from: '07:00', to: '10:00' },
			{ from: '18:00', to: '21:00' }
		];
		expect(windowOccurrenceThatCovers(EVERY_DAY, two, at(6), [], at(18))).toStrictEqual(at(18));
	});
});
