import { describe, expect, it } from 'vitest';
import {
	FONT_CACHE,
	FIRST_RETRY_IN_MS,
	LAST_RETRY_IN_MS,
	keyInCache,
	replacedKeys,
	isFontFile,
	fontPath,
	nextWait
} from './bundled-fonts';

describe('archivos de fuente', () => {
	it('la caché de fuentes se llama tareas-hogar-fuentes', () => {
		expect(FONT_CACHE).toBe('tareas-hogar-fuentes');
	});

	it('son los .woff2 de /fuentes/', () => {
		expect(isFontFile('/fuentes/a.woff2')).toBe(true);
		expect(isFontFile('/fuentes/a.css')).toBe(false);
		expect(isFontFile('/otra/a.woff2')).toBe(false);
	});

	it('la clave guardada lleva la huella del contenido', () => {
		expect(fontPath('a.woff2')).toBe('/fuentes/a.woff2');
		expect(keyInCache('a.woff2', 'abc')).toBe('/fuentes/a.woff2?huella=abc');
	});

	it('reemplaza solo las otras huellas del mismo archivo', () => {
		const savedItems = [
			'https://x.test/fuentes/a.woff2?huella=vieja',
			'https://x.test/fuentes/a.woff2?huella=nueva',
			'https://x.test/fuentes/b.woff2?huella=vieja'
		];
		expect(replacedKeys(savedItems, 'a.woff2', keyInCache('a.woff2', 'nueva'))).toEqual([savedItems[0]]);
	});
});

describe('reintentos', () => {
	it('arrancan en 2 s, se duplican y paran en 60 s', () => {
		expect(FIRST_RETRY_IN_MS).toBe(2000);
		expect(LAST_RETRY_IN_MS).toBe(60000);
		expect(nextWait(2000)).toBe(4000);
		expect(nextWait(40000)).toBe(60000);
		expect(nextWait(60000)).toBe(60000);
	});
});
