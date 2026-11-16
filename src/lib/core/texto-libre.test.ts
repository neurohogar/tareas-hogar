import { describe, expect, it } from 'vitest';
import { recortarTexto } from './texto-libre';

describe('recortarTexto', () => {
	it('recorta los espacios y saltos de línea del inicio y del final', () => {
		expect(recortarTexto('  \n Usar guantes \n\n ')).toBe('Usar guantes');
	});

	it('conserva los saltos de línea y espacios internos', () => {
		expect(recortarTexto(' Usar guantes\n\n  Ventilar ')).toBe('Usar guantes\n\n  Ventilar');
	});

	it.each(['', '   ', ' \n\t '])('vacía o solo espacios (%j) es sin texto', (texto) => {
		expect(recortarTexto(texto)).toBeUndefined();
	});

	it('no tiene largo máximo', () => {
		expect(recortarTexto('x'.repeat(5000))).toHaveLength(5000);
	});
});
