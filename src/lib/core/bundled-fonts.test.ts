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

describe('font files', () => {
	it('the font cache is called tareas-hogar-fuentes', () => {
		expect(FONT_CACHE).toBe('tareas-hogar-fuentes');
	});

	it('they are the .woff2 files of /fuentes/', () => {
		expect(isFontFile('/fuentes/a.woff2')).toBe(true);
		expect(isFontFile('/fuentes/a.css')).toBe(false);
		expect(isFontFile('/otra/a.woff2')).toBe(false);
	});

	it('the stored key carries the fingerprint of the content', () => {
		expect(fontPath('a.woff2')).toBe('/fuentes/a.woff2');
		expect(keyInCache('a.woff2', 'abc')).toBe('/fuentes/a.woff2?huella=abc');
	});

	it('replaces only the other fingerprints of the same file', () => {
		const savedItems = [
			'https://x.test/fuentes/a.woff2?huella=vieja',
			'https://x.test/fuentes/a.woff2?huella=nueva',
			'https://x.test/fuentes/b.woff2?huella=vieja'
		];
		expect(replacedKeys(savedItems, 'a.woff2', keyInCache('a.woff2', 'nueva'))).toEqual([savedItems[0]]);
	});
});

describe('retries', () => {
	it('start at 2 s, double and stop at 60 s', () => {
		expect(FIRST_RETRY_IN_MS).toBe(2000);
		expect(LAST_RETRY_IN_MS).toBe(60000);
		expect(nextWait(2000)).toBe(4000);
		expect(nextWait(40000)).toBe(60000);
		expect(nextWait(60000)).toBe(60000);
	});
});
