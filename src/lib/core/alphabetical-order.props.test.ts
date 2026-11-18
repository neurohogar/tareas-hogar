import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { compareTitles } from './alphabetical-order';

/** Letters with and without accent, ñ (composed and decomposed), uppercase and spaces. */
const letter = fc.constantFrom(...'aábcdeéinñoóuúüzAÁNÑOZ '.split(''), 'ñ', 'Ñ');
const title = fc.array(letter, { maxLength: 6 }).map((letters) => letters.join(''));
const sign = (a: string, b: string) => Math.sign(compareTitles(a, b));

describe('compareTitles (properties)', () => {
	it('is a total order: reflexive, antisymmetric and transitive', () => {
		fc.assert(
			fc.property(title, title, title, (a, b, c) => {
				expect(compareTitles(a, a)).toBe(0);
				expect(sign(a, b)).toBe(-sign(b, a) || 0);
				if (sign(a, b) <= 0 && sign(b, c) <= 0) expect(sign(a, c)).toBeLessThanOrEqual(0);
				if (sign(a, b) === 0) expect(sign(a, c)).toBe(sign(b, c));
			})
		);
	});

	it('does not distinguish case or accents (except ñ)', () => {
		const withoutMarks = (t: string) => t.normalize('NFD').replace(/[̀-̂̄-ͯ]/g, '').toLowerCase();
		fc.assert(
			fc.property(title, (t) => {
				expect(compareTitles(t, withoutMarks(t))).toBe(0);
				expect(compareTitles(t, t.toUpperCase())).toBe(0);
			})
		);
	});

	it('ñ goes after n (with what follows) and before o', () => {
		fc.assert(
			fc.property(title, title, title, (prefix, x, y) => {
				expect(sign(`${prefix}n${x}`, `${prefix}ñ${y}`)).toBe(-1);
				expect(sign(`${prefix}ñ${x}`, `${prefix}o${y}`)).toBe(-1);
			})
		);
	});

	it('a prefix goes before the title that extends it with letters', () => {
		fc.assert(
			fc.property(title, fc.array(letter.filter((l) => l !== ' '), { minLength: 1, maxLength: 3 }), (t, extra) => {
				expect(sign(t, t + extra.join(''))).toBe(-1);
			})
		);
	});
});
