import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { compararTitulos } from './orden-alfabetico';

/** Letras con y sin acento, ñ (compuesta y descompuesta), mayúsculas y espacios. */
const letra = fc.constantFrom(...'aábcdeéinñoóuúüzAÁNÑOZ '.split(''), 'ñ', 'Ñ');
const titulo = fc.array(letra, { maxLength: 6 }).map((letras) => letras.join(''));
const signo = (a: string, b: string) => Math.sign(compararTitulos(a, b));

describe('compararTitulos (propiedades)', () => {
	it('es un orden total: reflexiva, antisimétrica y transitiva', () => {
		fc.assert(
			fc.property(titulo, titulo, titulo, (a, b, c) => {
				expect(compararTitulos(a, a)).toBe(0);
				expect(signo(a, b)).toBe(-signo(b, a) || 0);
				if (signo(a, b) <= 0 && signo(b, c) <= 0) expect(signo(a, c)).toBeLessThanOrEqual(0);
				if (signo(a, b) === 0) expect(signo(a, c)).toBe(signo(b, c));
			})
		);
	});

	it('no distingue mayúsculas ni acentos (salvo la ñ)', () => {
		const sinMarcas = (t: string) => t.normalize('NFD').replace(/[̀-̂̄-ͯ]/g, '').toLowerCase();
		fc.assert(
			fc.property(titulo, (t) => {
				expect(compararTitulos(t, sinMarcas(t))).toBe(0);
				expect(compararTitulos(t, t.toUpperCase())).toBe(0);
			})
		);
	});

	it('la ñ va después de la n (con lo que siga) y antes de la o', () => {
		fc.assert(
			fc.property(titulo, titulo, titulo, (prefijo, x, y) => {
				expect(signo(`${prefijo}n${x}`, `${prefijo}ñ${y}`)).toBe(-1);
				expect(signo(`${prefijo}ñ${x}`, `${prefijo}o${y}`)).toBe(-1);
			})
		);
	});

	it('un prefijo va antes que el título que lo extiende con letras', () => {
		fc.assert(
			fc.property(titulo, fc.array(letra.filter((l) => l !== ' '), { minLength: 1, maxLength: 3 }), (t, extra) => {
				expect(signo(t, t + extra.join(''))).toBe(-1);
			})
		);
	});
});
