import { describe, expect, it } from 'vitest';
import type { Etiqueta } from './etiqueta';
import { agregarEscrita, quitarElegida, sugerencias } from './panel-de-etiquetas';

const BANO: Etiqueta = { id: 'e1', nombre: 'Baño', color: 'gris' };
const COCINA: Etiqueta = { id: 'e2', nombre: 'Cocina', color: 'rojo' };
const ROPA: Etiqueta = { id: 'e3', nombre: 'Ropa sucia', color: 'naranja' };
const EXISTENTES = [ROPA, COCINA, BANO];

describe('sugerencias', () => {
	it('las existentes que contienen lo escrito, en orden alfabético, y crear lo escrito', () => {
		expect(sugerencias('a', EXISTENTES, [])).toStrictEqual({ etiquetas: [BANO, COCINA, ROPA], crear: 'a' });
	});

	it('sin distinguir mayúsculas ni acentos: BANO sugiere Baño, y ofrece crear porque no coincide exactamente', () => {
		expect(sugerencias('BANO', EXISTENTES, [])).toStrictEqual({ etiquetas: [BANO], crear: 'BANO' });
	});

	it('si una existente se llama así (sin distinguir mayúsculas), no ofrece crear', () => {
		expect(sugerencias('cocina', EXISTENTES, [])).toStrictEqual({ etiquetas: [COCINA] });
	});

	it('no sugiere las que la tarea ya tiene', () => {
		expect(sugerencias('co', EXISTENTES, ['cocina'])).toStrictEqual({ etiquetas: [], crear: 'co' });
	});

	it('quita los espacios de los extremos de lo escrito', () => {
		expect(sugerencias('  Sucia ', EXISTENTES, [])).toStrictEqual({ etiquetas: [ROPA], crear: 'Sucia' });
	});

	it('vacío o solo espacios no sugiere nada ni ofrece crear', () => {
		expect(sugerencias('   ', EXISTENTES, [])).toStrictEqual({ etiquetas: [] });
	});
});

describe('agregarEscrita', () => {
	it('una existente se agrega con su nombre guardado', () => {
		expect(agregarEscrita('cocina', EXISTENTES, ['Baño'])).toStrictEqual({ ok: true, nombres: ['Baño', 'Cocina'] });
	});

	it('un nombre nuevo se agrega sin los espacios de los extremos', () => {
		expect(agregarEscrita('  Patio ', EXISTENTES, [])).toStrictEqual({ ok: true, nombres: ['Patio'] });
	});

	it('una que la tarea ya tiene no se agrega dos veces', () => {
		expect(agregarEscrita('COCINA', EXISTENTES, ['Cocina'])).toStrictEqual({ ok: true, nombres: ['Cocina'] });
		expect(agregarEscrita('patio', EXISTENTES, ['Patio'])).toStrictEqual({ ok: true, nombres: ['Patio'] });
	});

	it('un nombre demasiado largo no se agrega', () => {
		expect(agregarEscrita('x'.repeat(31), EXISTENTES, ['Baño'])).toStrictEqual({ ok: false, error: 'largo' });
	});

	it('vacío o solo espacios no agrega nada, sin error', () => {
		expect(agregarEscrita('  ', EXISTENTES, ['Baño'])).toStrictEqual({ ok: true, nombres: ['Baño'] });
	});
});

describe('quitarElegida', () => {
	it('quita el nombre sin distinguir mayúsculas y deja los otros en su orden', () => {
		expect(quitarElegida('Cocina', ['Baño', 'cocina', 'Patio'])).toStrictEqual(['Baño', 'Patio']);
	});

	it('un nombre que no está no cambia nada', () => {
		expect(quitarElegida('Cocina', ['Baño'])).toStrictEqual(['Baño']);
	});
});
