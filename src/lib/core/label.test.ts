import { describe, expect, it } from 'vitest';
import { PALETTE, sameName, validateName } from './label';

describe('PALETA', () => {
	it('tiene los 8 colores en el orden del spec', () => {
		expect(PALETTE).toStrictEqual(['gris', 'rojo', 'naranja', 'amarillo', 'verde', 'celeste', 'azul', 'violeta']);
	});
});

describe('validarNombre', () => {
	it('quita los espacios del principio y del final', () => {
		expect(validateName('  Ropa sucia  ')).toStrictEqual({ ok: true, name: 'Ropa sucia' });
	});

	it('vacío o solo espacios es inválido', () => {
		expect(validateName('')).toStrictEqual({ ok: false, error: 'vacio' });
		expect(validateName('   ')).toStrictEqual({ ok: false, error: 'vacio' });
	});

	it('30 caracteres es el máximo; 31 es inválido', () => {
		expect(validateName('Limpieza profunda del baño 123')).toStrictEqual({ ok: true, name: 'Limpieza profunda del baño 123' });
		expect(validateName('Limpieza profunda del baño 1234')).toStrictEqual({ ok: false, error: 'largo' });
	});

	it('el largo se cuenta sin los espacios de los extremos', () => {
		expect(validateName(` ${'a'.repeat(30)} `)).toStrictEqual({ ok: true, name: 'a'.repeat(30) });
	});
});

describe('mismoNombre', () => {
	it('no distingue mayúsculas', () => {
		expect(sameName('Cocina', 'COCINA')).toBe(true);
		expect(sameName('Ñoquis', 'ñoquis')).toBe(true);
	});

	it('sí distingue acentos', () => {
		expect(sameName('Baño', 'Bano')).toBe(false);
		expect(sameName('Árbol', 'Arbol')).toBe(false);
	});
});
