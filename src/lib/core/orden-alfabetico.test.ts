import { describe, expect, it } from 'vitest';
import { compararTitulos } from './orden-alfabetico';

const ordenar = (titulos: string[]) => [...titulos].sort(compararTitulos);

describe('compararTitulos (spec §6.1: orden alfabético en español)', () => {
	it('ordena alfabéticamente', () => {
		expect(ordenar(['Cocina', 'Barrer', 'Dormitorio'])).toEqual(['Barrer', 'Cocina', 'Dormitorio']);
	});

	it('no distingue mayúsculas', () => {
		expect(ordenar(['Zapallo', 'acelga'])).toEqual(['acelga', 'Zapallo']);
		expect(compararTitulos('Barrer', 'barrer')).toBe(0);
	});

	it('no distingue acentos', () => {
		expect(ordenar(['Barrer', 'Árbol'])).toEqual(['Árbol', 'Barrer']);
		expect(ordenar(['ánimo', 'Anillo'])).toEqual(['Anillo', 'ánimo']);
		expect(compararTitulos('Pasión', 'pasion')).toBe(0);
		expect(compararTitulos('Pingüino', 'pinguino')).toBe(0);
	});

	it('pone la ñ después de la n y antes de la o', () => {
		expect(ordenar(['Ñandú', 'Nube', 'Oso'])).toEqual(['Nube', 'Ñandú', 'Oso']);
		expect(ordenar(['Ñu', 'Nz'])).toEqual(['Nz', 'Ñu']);
		expect(ordenar(['caña', 'canto', 'capa'])).toEqual(['canto', 'caña', 'capa']);
		expect(compararTitulos('Ñandú', 'ñandu')).toBe(0);
	});

	it('reconoce la ñ escrita como n más tilde combinada', () => {
		const enieDescompuesta = 'n\u0303';
		expect(compararTitulos(`ca${enieDescompuesta}a`, 'caña')).toBe(0);
		expect(ordenar([`ca${enieDescompuesta}a`, 'canto'])).toEqual(['canto', `ca${enieDescompuesta}a`]);
	});

	it('un prefijo va antes que el título que lo extiende', () => {
		expect(ordenar(['Regar plantas', 'Regar'])).toEqual(['Regar', 'Regar plantas']);
	});

	it('es simétrica', () => {
		expect(Math.sign(compararTitulos('Nube', 'Ñandú'))).toBe(-1);
		expect(Math.sign(compararTitulos('Ñandú', 'Nube'))).toBe(1);
	});
});
