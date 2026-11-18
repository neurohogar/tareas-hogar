// Spec §4.4: coveredOccurrence as text, round trip.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { atTheMinute } from './days';
import { occurrenceFromText, occurrenceInText } from './occurrence-in-text';

const day = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
const minute = fc.integer({ min: 0, max: 1439 });

describe('occurrence in text (properties, spec §4.4)', () => {
	it('a date alone comes back as the same date', () => {
		fc.assert(
			fc.property(day, (d) => {
				expect(occurrenceFromText(occurrenceInText(d))).toEqual(d);
			})
		);
	});

	it('the start of an occurrence comes back as the same start, also at 00:00, never as a date', () => {
		fc.assert(
			fc.property(day, minute, (d, m) => {
				const occurrence = { start: atTheMinute(d, m) };
				expect(occurrenceFromText(occurrenceInText(occurrence))).toEqual(occurrence);
			})
		);
	});
});
