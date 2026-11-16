import { describe, expect, it } from 'vitest';
import { compareTitles } from './alphabetical-order';

const sort = (titles: string[]) => [...titles].sort(compareTitles);

describe('compararTitulos (spec §6.1: orden alfabético en español)', () => {
	it('ordena alfabéticamente', () => {
		expect(sort(['Cocina', 'Barrer', 'Dormitorio'])).toEqual(['Barrer', 'Cocina', 'Dormitorio']);
	});

	it('no distingue mayúsculas', () => {
		expect(sort(['Zapallo', 'acelga'])).toEqual(['acelga', 'Zapallo']);
		expect(compareTitles('Barrer', 'barrer')).toBe(0);
	});

	it('no distingue acentos', () => {
		expect(sort(['Barrer', 'Árbol'])).toEqual(['Árbol', 'Barrer']);
		expect(sort(['ánimo', 'Anillo'])).toEqual(['Anillo', 'ánimo']);
		expect(compareTitles('Pasión', 'pasion')).toBe(0);
		expect(compareTitles('Pingüino', 'pinguino')).toBe(0);
	});

	it('pone la ñ después de la n y antes de la o', () => {
		expect(sort(['Ñandú', 'Nube', 'Oso'])).toEqual(['Nube', 'Ñandú', 'Oso']);
		expect(sort(['Ñu', 'Nz'])).toEqual(['Nz', 'Ñu']);
		expect(sort(['caña', 'canto', 'capa'])).toEqual(['canto', 'caña', 'capa']);
		expect(compareTitles('Ñandú', 'ñandu')).toBe(0);
	});

	it('reconoce la ñ escrita como n más tilde combinada', () => {
		const decomposedEnie = 'n\u0303';
		expect(compareTitles(`ca${decomposedEnie}a`, 'caña')).toBe(0);
		expect(sort([`ca${decomposedEnie}a`, 'canto'])).toEqual(['canto', `ca${decomposedEnie}a`]);
	});

	it('un prefijo va antes que el título que lo extiende', () => {
		expect(sort(['Regar plantas', 'Regar'])).toEqual(['Regar', 'Regar plantas']);
	});

	it('es simétrica', () => {
		expect(Math.sign(compareTitles('Nube', 'Ñandú'))).toBe(-1);
		expect(Math.sign(compareTitles('Ñandú', 'Nube'))).toBe(1);
	});
});
