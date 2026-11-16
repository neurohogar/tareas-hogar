import { describe, expect, it } from 'vitest';
import type { Label } from './label';
import { addTyped, removeChosen, suggestions } from './label-panel';

const BATHROOM: Label = { id: 'e1', name: 'Baño', color: 'gris' };
const KITCHEN: Label = { id: 'e2', name: 'Cocina', color: 'rojo' };
const CLOTHES: Label = { id: 'e3', name: 'Ropa sucia', color: 'naranja' };
const EXISTING = [CLOTHES, KITCHEN, BATHROOM];

describe('sugerencias', () => {
	it('las existentes que contienen lo escrito, en orden alfabético, y crear lo escrito', () => {
		expect(suggestions('a', EXISTING, [])).toStrictEqual({ labels: [BATHROOM, KITCHEN, CLOTHES], create: 'a' });
	});

	it('sin distinguir mayúsculas ni acentos: BANO sugiere Baño, y ofrece crear porque no coincide exactamente', () => {
		expect(suggestions('BANO', EXISTING, [])).toStrictEqual({ labels: [BATHROOM], create: 'BANO' });
	});

	it('si una existente se llama así (sin distinguir mayúsculas), no ofrece crear', () => {
		expect(suggestions('cocina', EXISTING, [])).toStrictEqual({ labels: [KITCHEN] });
	});

	it('no sugiere las que la tarea ya tiene', () => {
		expect(suggestions('co', EXISTING, ['cocina'])).toStrictEqual({ labels: [], create: 'co' });
	});

	it('quita los espacios de los extremos de lo escrito', () => {
		expect(suggestions('  Sucia ', EXISTING, [])).toStrictEqual({ labels: [CLOTHES], create: 'Sucia' });
	});

	it('vacío o solo espacios no sugiere nada ni ofrece crear', () => {
		expect(suggestions('   ', EXISTING, [])).toStrictEqual({ labels: [] });
	});
});

describe('agregarEscrita', () => {
	it('una existente se agrega con su nombre guardado', () => {
		expect(addTyped('cocina', EXISTING, ['Baño'])).toStrictEqual({ ok: true, names: ['Baño', 'Cocina'] });
	});

	it('un nombre nuevo se agrega sin los espacios de los extremos', () => {
		expect(addTyped('  Patio ', EXISTING, [])).toStrictEqual({ ok: true, names: ['Patio'] });
	});

	it('una que la tarea ya tiene no se agrega dos veces', () => {
		expect(addTyped('COCINA', EXISTING, ['Cocina'])).toStrictEqual({ ok: true, names: ['Cocina'] });
		expect(addTyped('patio', EXISTING, ['Patio'])).toStrictEqual({ ok: true, names: ['Patio'] });
	});

	it('un nombre demasiado largo no se agrega', () => {
		expect(addTyped('x'.repeat(31), EXISTING, ['Baño'])).toStrictEqual({ ok: false, error: 'largo' });
	});

	it('vacío o solo espacios no agrega nada, sin error', () => {
		expect(addTyped('  ', EXISTING, ['Baño'])).toStrictEqual({ ok: true, names: ['Baño'] });
	});
});

describe('quitarElegida', () => {
	it('quita el nombre sin distinguir mayúsculas y deja los otros en su orden', () => {
		expect(removeChosen('Cocina', ['Baño', 'cocina', 'Patio'])).toStrictEqual(['Baño', 'Patio']);
	});

	it('un nombre que no está no cambia nada', () => {
		expect(removeChosen('Cocina', ['Baño'])).toStrictEqual(['Baño']);
	});
});
