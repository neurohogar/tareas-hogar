import { describe, expect, it } from 'vitest';
import { normalizarNota } from './nota';

describe('normalizarNota', () => {
	it('recorta los espacios y saltos de línea del inicio y del final', () => {
		expect(normalizarNota('  \n Usar guantes \n\n ')).toBe('Usar guantes');
	});

	it('conserva los saltos de línea y espacios internos', () => {
		expect(normalizarNota(' Usar guantes\n\n  Ventilar ')).toBe('Usar guantes\n\n  Ventilar');
	});

	it.each(['', '   ', ' \n\t '])('vacía o solo espacios (%j) es sin nota', (texto) => {
		expect(normalizarNota(texto)).toBeUndefined();
	});

	it('no tiene largo máximo', () => {
		expect(normalizarNota('x'.repeat(5000))).toHaveLength(5000);
	});
});
