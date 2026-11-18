import { describe, expect, it } from 'vitest';
import { compareTitles } from './alphabetical-order';

const sort = (titles: string[]) => [...titles].sort(compareTitles);

describe('compareTitles (spec §6.1: alphabetical order in Spanish)', () => {
	it('sorts alphabetically', () => {
		expect(sort(['Cocina', 'Barrer', 'Dormitorio'])).toEqual(['Barrer', 'Cocina', 'Dormitorio']);
	});

	it('does not distinguish case', () => {
		expect(sort(['Zapallo', 'acelga'])).toEqual(['acelga', 'Zapallo']);
		expect(compareTitles('Barrer', 'barrer')).toBe(0);
	});

	it('does not distinguish accents', () => {
		expect(sort(['Barrer', 'Árbol'])).toEqual(['Árbol', 'Barrer']);
		expect(sort(['ánimo', 'Anillo'])).toEqual(['Anillo', 'ánimo']);
		expect(compareTitles('Pasión', 'pasion')).toBe(0);
		expect(compareTitles('Pingüino', 'pinguino')).toBe(0);
	});

	it('puts ñ after n and before o', () => {
		expect(sort(['Ñandú', 'Nube', 'Oso'])).toEqual(['Nube', 'Ñandú', 'Oso']);
		expect(sort(['Ñu', 'Nz'])).toEqual(['Nz', 'Ñu']);
		expect(sort(['caña', 'canto', 'capa'])).toEqual(['canto', 'caña', 'capa']);
		expect(compareTitles('Ñandú', 'ñandu')).toBe(0);
	});

	it('recognizes ñ written as n plus a combining tilde', () => {
		const decomposedEnie = 'n\u0303';
		expect(compareTitles(`ca${decomposedEnie}a`, 'caña')).toBe(0);
		expect(sort([`ca${decomposedEnie}a`, 'canto'])).toEqual(['canto', `ca${decomposedEnie}a`]);
	});

	it('a prefix goes before the title that extends it', () => {
		expect(sort(['Regar plantas', 'Regar'])).toEqual(['Regar', 'Regar plantas']);
	});

	it('is symmetric', () => {
		expect(Math.sign(compareTitles('Nube', 'Ñandú'))).toBe(-1);
		expect(Math.sign(compareTitles('Ñandú', 'Nube'))).toBe(1);
	});
});
