import { describe, expect, it } from 'vitest';
import { PALETA, mismoNombre, validarNombre } from './etiqueta';

describe('PALETA', () => {
	it('tiene los 8 colores en el orden del spec', () => {
		expect(PALETA).toStrictEqual(['gris', 'rojo', 'naranja', 'amarillo', 'verde', 'celeste', 'azul', 'violeta']);
	});
});

describe('validarNombre', () => {
	it('quita los espacios del principio y del final', () => {
		expect(validarNombre('  Ropa sucia  ')).toStrictEqual({ ok: true, nombre: 'Ropa sucia' });
	});

	it('vacío o solo espacios es inválido', () => {
		expect(validarNombre('')).toStrictEqual({ ok: false, error: 'vacio' });
		expect(validarNombre('   ')).toStrictEqual({ ok: false, error: 'vacio' });
	});

	it('30 caracteres es el máximo; 31 es inválido', () => {
		expect(validarNombre('Limpieza profunda del baño 123')).toStrictEqual({ ok: true, nombre: 'Limpieza profunda del baño 123' });
		expect(validarNombre('Limpieza profunda del baño 1234')).toStrictEqual({ ok: false, error: 'largo' });
	});

	it('el largo se cuenta sin los espacios de los extremos', () => {
		expect(validarNombre(` ${'a'.repeat(30)} `)).toStrictEqual({ ok: true, nombre: 'a'.repeat(30) });
	});
});

describe('mismoNombre', () => {
	it('no distingue mayúsculas', () => {
		expect(mismoNombre('Cocina', 'COCINA')).toBe(true);
		expect(mismoNombre('Ñoquis', 'ñoquis')).toBe(true);
	});

	it('sí distingue acentos', () => {
		expect(mismoNombre('Baño', 'Bano')).toBe(false);
		expect(mismoNombre('Árbol', 'Arbol')).toBe(false);
	});
});
