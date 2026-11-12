import { describe, expect, it } from 'vitest';
import {
	CACHE_DE_FUENTES,
	PRIMER_REINTENTO_EN_MS,
	ULTIMO_REINTENTO_EN_MS,
	claveEnLaCache,
	clavesReemplazadas,
	esArchivoDeFuente,
	rutaDeFuente,
	siguienteEspera
} from './fuentes-empaquetadas';

describe('archivos de fuente', () => {
	it('la caché de fuentes se llama tareas-hogar-fuentes', () => {
		expect(CACHE_DE_FUENTES).toBe('tareas-hogar-fuentes');
	});

	it('son los .woff2 de /fuentes/', () => {
		expect(esArchivoDeFuente('/fuentes/a.woff2')).toBe(true);
		expect(esArchivoDeFuente('/fuentes/a.css')).toBe(false);
		expect(esArchivoDeFuente('/otra/a.woff2')).toBe(false);
	});

	it('la clave guardada lleva la huella del contenido', () => {
		expect(rutaDeFuente('a.woff2')).toBe('/fuentes/a.woff2');
		expect(claveEnLaCache('a.woff2', 'abc')).toBe('/fuentes/a.woff2?huella=abc');
	});

	it('reemplaza solo las otras huellas del mismo archivo', () => {
		const guardadas = [
			'https://x.test/fuentes/a.woff2?huella=vieja',
			'https://x.test/fuentes/a.woff2?huella=nueva',
			'https://x.test/fuentes/b.woff2?huella=vieja'
		];
		expect(clavesReemplazadas(guardadas, 'a.woff2', claveEnLaCache('a.woff2', 'nueva'))).toEqual([guardadas[0]]);
	});
});

describe('reintentos', () => {
	it('arrancan en 2 s, se duplican y paran en 60 s', () => {
		expect(PRIMER_REINTENTO_EN_MS).toBe(2000);
		expect(ULTIMO_REINTENTO_EN_MS).toBe(60000);
		expect(siguienteEspera(2000)).toBe(4000);
		expect(siguienteEspera(40000)).toBe(60000);
		expect(siguienteEspera(60000)).toBe(60000);
	});
});
