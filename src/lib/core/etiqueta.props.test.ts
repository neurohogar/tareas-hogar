// Spec §4.3: las reglas del nombre de una etiqueta.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { LARGO_MAXIMO_DEL_NOMBRE, mismoNombre, validarNombre } from './etiqueta';

const espacios = fc.array(fc.constantFrom(' ', '\t', '\n'), { maxLength: 3 }).map((e) => e.join(''));
const letras = fc.string({
	unit: fc.constantFrom(...'aAbBñÑáÁ x'.split('')),
	maxLength: 40
});
const escrito = fc.tuple(espacios, letras, espacios).map(([antes, texto, despues]) => antes + texto + despues);

describe('validarNombre (propiedades)', () => {
	it('solo dependen de lo escrito sin los espacios de los extremos', () => {
		fc.assert(
			fc.property(escrito, (texto) => {
				expect(validarNombre(texto)).toStrictEqual(validarNombre(texto.trim()));
			})
		);
	});

	it('un nombre válido no tiene espacios en los extremos, tiene de 1 a 30 caracteres y vuelve a validar igual', () => {
		fc.assert(
			fc.property(escrito, (texto) => {
				const validado = validarNombre(texto);
				if (!validado.ok) return;
				expect(validado.nombre).toBe(validado.nombre.trim());
				expect([...validado.nombre].length).toBeGreaterThanOrEqual(1);
				expect([...validado.nombre].length).toBeLessThanOrEqual(LARGO_MAXIMO_DEL_NOMBRE);
				expect(validarNombre(validado.nombre)).toStrictEqual(validado);
			})
		);
	});

	it('se rechaza justo cuando queda vacío o pasa de 30 caracteres', () => {
		fc.assert(
			fc.property(escrito, (texto) => {
				const largo = [...texto.trim()].length;
				expect(validarNombre(texto).ok).toBe(largo >= 1 && largo <= LARGO_MAXIMO_DEL_NOMBRE);
			})
		);
	});
});

describe('mismoNombre (propiedades)', () => {
	it('es una equivalencia que no distingue mayúsculas', () => {
		fc.assert(
			fc.property(letras, letras, letras, (a, b, c) => {
				expect(mismoNombre(a, a)).toBe(true);
				expect(mismoNombre(a, b)).toBe(mismoNombre(b, a));
				if (mismoNombre(a, b) && mismoNombre(b, c)) expect(mismoNombre(a, c)).toBe(true);
				expect(mismoNombre(a, a.toUpperCase())).toBe(true);
			})
		);
	});
});
