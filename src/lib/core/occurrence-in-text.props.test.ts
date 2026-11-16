// Spec §4.4: ocurrenciaCubierta como texto, ida y vuelta.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { atTheMinute } from './days';
import { occurrenceFromText, occurrenceInText } from './occurrence-in-text';

const day = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
const minute = fc.integer({ min: 0, max: 1439 });

describe('ocurrencia en texto (propiedades, spec §4.4)', () => {
	it('una fecha sola vuelve como la misma fecha', () => {
		fc.assert(
			fc.property(day, (d) => {
				expect(occurrenceFromText(occurrenceInText(d))).toEqual(d);
			})
		);
	});

	it('el inicio de una ocurrencia vuelve como el mismo inicio, también a las 00:00, nunca como una fecha', () => {
		fc.assert(
			fc.property(day, minute, (d, m) => {
				const occurrence = { start: atTheMinute(d, m) };
				expect(occurrenceFromText(occurrenceInText(occurrence))).toEqual(occurrence);
			})
		);
	});
});
