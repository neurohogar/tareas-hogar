// Spec §4.4: coveredOccurrence is stored as a date (2026-07-14) or as a date and time (2026-07-14T07:00).
import { describe, expect, it } from 'vitest';
import { occurrenceFromText, occurrenceInText } from './occurrence-in-text';

describe('coveredOccurrence in text (spec §4.4)', () => {
	it('a date is written without a time', () => {
		expect(occurrenceInText(new Date(2026, 6, 14))).toBe('2026-07-14');
	});

	it('the start of an occurrence is written with date and time, also at 00:00', () => {
		expect(occurrenceInText({ start: new Date(2026, 6, 14, 7, 0) })).toBe('2026-07-14T07:00');
		expect(occurrenceInText({ start: new Date(2026, 6, 14, 0, 0) })).toBe('2026-07-14T00:00');
	});

	it('it is read in the same format it was written', () => {
		expect(occurrenceFromText('2026-07-14')).toStrictEqual(new Date(2026, 6, 14));
		expect(occurrenceFromText('2026-07-14T07:00')).toStrictEqual({ start: new Date(2026, 6, 14, 7, 0) });
		expect(occurrenceFromText('2026-07-14T00:00')).toStrictEqual({ start: new Date(2026, 6, 14, 0, 0) });
	});

	it.each(['2026-07-14T7:00', '2026-07-14T24:00', '2026-02-30T07:00', '2026-07-14 07:00', ''])('an invalid text is an error (%s)', (text) => {
		expect(() => occurrenceFromText(text)).toThrow();
	});
});
