import { describe, expect, it } from 'vitest';
import { trimText } from './free-text';

describe('recortarTexto', () => {
	it('recorta los espacios y saltos de línea del inicio y del final', () => {
		expect(trimText('  \n Usar guantes \n\n ')).toBe('Usar guantes');
	});

	it('conserva los saltos de línea y espacios internos', () => {
		expect(trimText(' Usar guantes\n\n  Ventilar ')).toBe('Usar guantes\n\n  Ventilar');
	});

	it.each(['', '   ', ' \n\t '])('vacía o solo espacios (%j) es sin texto', (text) => {
		expect(trimText(text)).toBeUndefined();
	});

	it('no tiene largo máximo', () => {
		expect(trimText('x'.repeat(5000))).toHaveLength(5000);
	});
});
