import { describe, expect, it } from 'vitest';
import { leastUsedColor } from './label-color';

describe('colorMenosUsado', () => {
	it('sin etiquetas, el primero de la paleta', () => {
		expect(leastUsedColor([])).toBe('gris');
	});

	it('el color que menos etiquetas tienen', () => {
		expect(leastUsedColor(['gris'])).toBe('rojo');
		expect(leastUsedColor(['rojo'])).toBe('gris');
		expect(leastUsedColor(['gris', 'rojo', 'naranja'])).toBe('amarillo');
	});

	it('si empatan, el primero de la paleta aunque no sea el último sin usar', () => {
		const everything = ['gris', 'rojo', 'naranja', 'amarillo', 'verde', 'celeste', 'azul', 'violeta'] as const;
		expect(leastUsedColor([...everything])).toBe('gris');
		expect(leastUsedColor([...everything, 'gris', 'rojo'])).toBe('naranja');
	});

	it('cuenta cuántas veces se usa cada color, no solo si se usa', () => {
		const withoutViolet = ['gris', 'rojo', 'naranja', 'amarillo', 'verde', 'celeste', 'azul', 'gris'] as const;
		expect(leastUsedColor([...withoutViolet])).toBe('violeta');
	});
});
