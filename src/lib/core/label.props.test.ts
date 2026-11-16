// Spec §4.3: las reglas del nombre de una etiqueta.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { MAX_NAME_LENGTH, sameName, validateName } from './label';

const spaces = fc.array(fc.constantFrom(' ', '\t', '\n'), { maxLength: 3 }).map((e) => e.join(''));
const letters = fc.string({
	unit: fc.constantFrom(...'aAbBñÑáÁ x'.split('')),
	maxLength: 40
});
const typedOne = fc.tuple(spaces, letters, spaces).map(([before, text, after]) => before + text + after);

describe('validarNombre (propiedades)', () => {
	it('solo dependen de lo escrito sin los espacios de los extremos', () => {
		fc.assert(
			fc.property(typedOne, (text) => {
				expect(validateName(text)).toStrictEqual(validateName(text.trim()));
			})
		);
	});

	it('un nombre válido no tiene espacios en los extremos, tiene de 1 a 30 caracteres y vuelve a validar igual', () => {
		fc.assert(
			fc.property(typedOne, (text) => {
				const validated = validateName(text);
				if (!validated.ok) return;
				expect(validated.name).toBe(validated.name.trim());
				expect([...validated.name].length).toBeGreaterThanOrEqual(1);
				expect([...validated.name].length).toBeLessThanOrEqual(MAX_NAME_LENGTH);
				expect(validateName(validated.name)).toStrictEqual(validated);
			})
		);
	});

	it('se rechaza justo cuando queda vacío o pasa de 30 caracteres', () => {
		fc.assert(
			fc.property(typedOne, (text) => {
				const tooLong = [...text.trim()].length;
				expect(validateName(text).ok).toBe(tooLong >= 1 && tooLong <= MAX_NAME_LENGTH);
			})
		);
	});
});

describe('mismoNombre (propiedades)', () => {
	it('es una equivalencia que no distingue mayúsculas', () => {
		fc.assert(
			fc.property(letters, letters, letters, (a, b, c) => {
				expect(sameName(a, a)).toBe(true);
				expect(sameName(a, b)).toBe(sameName(b, a));
				if (sameName(a, b) && sameName(b, c)) expect(sameName(a, c)).toBe(true);
				expect(sameName(a, a.toUpperCase())).toBe(true);
			})
		);
	});
});
