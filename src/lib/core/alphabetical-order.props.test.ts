import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { compareTitles } from './alphabetical-order';

/** Letras con y sin acento, ñ (compuesta y descompuesta), mayúsculas y espacios. */
const letter = fc.constantFrom(...'aábcdeéinñoóuúüzAÁNÑOZ '.split(''), 'ñ', 'Ñ');
const title = fc.array(letter, { maxLength: 6 }).map((letters) => letters.join(''));
const sign = (a: string, b: string) => Math.sign(compareTitles(a, b));

describe('compararTitulos (propiedades)', () => {
	it('es un orden total: reflexiva, antisimétrica y transitiva', () => {
		fc.assert(
			fc.property(title, title, title, (a, b, c) => {
				expect(compareTitles(a, a)).toBe(0);
				expect(sign(a, b)).toBe(-sign(b, a) || 0);
				if (sign(a, b) <= 0 && sign(b, c) <= 0) expect(sign(a, c)).toBeLessThanOrEqual(0);
				if (sign(a, b) === 0) expect(sign(a, c)).toBe(sign(b, c));
			})
		);
	});

	it('no distingue mayúsculas ni acentos (salvo la ñ)', () => {
		const withoutMarks = (t: string) => t.normalize('NFD').replace(/[̀-̂̄-ͯ]/g, '').toLowerCase();
		fc.assert(
			fc.property(title, (t) => {
				expect(compareTitles(t, withoutMarks(t))).toBe(0);
				expect(compareTitles(t, t.toUpperCase())).toBe(0);
			})
		);
	});

	it('la ñ va después de la n (con lo que siga) y antes de la o', () => {
		fc.assert(
			fc.property(title, title, title, (prefix, x, y) => {
				expect(sign(`${prefix}n${x}`, `${prefix}ñ${y}`)).toBe(-1);
				expect(sign(`${prefix}ñ${x}`, `${prefix}o${y}`)).toBe(-1);
			})
		);
	});

	it('un prefijo va antes que el título que lo extiende con letras', () => {
		fc.assert(
			fc.property(title, fc.array(letter.filter((l) => l !== ' '), { minLength: 1, maxLength: 3 }), (t, extra) => {
				expect(sign(t, t + extra.join(''))).toBe(-1);
			})
		);
	});
});
