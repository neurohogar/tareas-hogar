import { describe, expect, it } from 'vitest';
import { colorMenosUsado } from './color-de-etiqueta';

describe('colorMenosUsado', () => {
	it('sin etiquetas, el primero de la paleta', () => {
		expect(colorMenosUsado([])).toBe('gris');
	});

	it('el color que menos etiquetas tienen', () => {
		expect(colorMenosUsado(['gris'])).toBe('rojo');
		expect(colorMenosUsado(['rojo'])).toBe('gris');
		expect(colorMenosUsado(['gris', 'rojo', 'naranja'])).toBe('amarillo');
	});

	it('si empatan, el primero de la paleta aunque no sea el último sin usar', () => {
		const todos = ['gris', 'rojo', 'naranja', 'amarillo', 'verde', 'celeste', 'azul', 'violeta'] as const;
		expect(colorMenosUsado([...todos])).toBe('gris');
		expect(colorMenosUsado([...todos, 'gris', 'rojo'])).toBe('naranja');
	});

	it('cuenta cuántas veces se usa cada color, no solo si se usa', () => {
		const sinVioleta = ['gris', 'rojo', 'naranja', 'amarillo', 'verde', 'celeste', 'azul', 'gris'] as const;
		expect(colorMenosUsado([...sinVioleta])).toBe('violeta');
	});
});
