import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
	ULTIMO_REINTENTO_EN_MS,
	PRIMER_REINTENTO_EN_MS,
	claveEnLaCache,
	clavesReemplazadas,
	siguienteEspera
} from './fuentes-empaquetadas';

const nombre = fc.stringMatching(/^[a-z0-9-]{1,12}$/).map((n) => `${n}.woff2`);
const huella = fc.stringMatching(/^[a-f0-9]{1,8}$/);

describe('reintentos', () => {
	it('la espera nunca baja, nunca pasa el máximo y llega a él', () => {
		fc.assert(
			fc.property(fc.integer({ min: PRIMER_REINTENTO_EN_MS, max: ULTIMO_REINTENTO_EN_MS }), (espera) => {
				const siguiente = siguienteEspera(espera);
				expect(siguiente).toBeGreaterThanOrEqual(espera);
				expect(siguiente).toBeLessThanOrEqual(ULTIMO_REINTENTO_EN_MS);
			})
		);
		let espera = PRIMER_REINTENTO_EN_MS;
		for (let i = 0; i < 10; i++) espera = siguienteEspera(espera);
		expect(espera).toBe(ULTIMO_REINTENTO_EN_MS);
	});
});

describe('entradas reemplazadas', () => {
	it('nunca incluyen la clave vigente y son todas del mismo archivo', () => {
		fc.assert(
			fc.property(nombre, nombre, fc.array(huella, { maxLength: 6 }), huella, (a, otro, viejas, vigente) => {
				const urls = [...viejas.map((h) => `https://x.test${claveEnLaCache(a, h)}`), `https://x.test${claveEnLaCache(otro, 'z')}`];
				const reemplazadas = clavesReemplazadas(urls, a, claveEnLaCache(a, vigente));
				for (const url of reemplazadas) {
					expect(url.includes(`/fuentes/${a}?`)).toBe(true);
					expect(url.endsWith(claveEnLaCache(a, vigente))).toBe(false);
				}
			})
		);
	});

	it('es idempotente: lo que queda después de borrarlas no reemplaza nada más', () => {
		fc.assert(
			fc.property(nombre, fc.array(huella, { maxLength: 6 }), huella, (a, viejas, vigente) => {
				const clave = claveEnLaCache(a, vigente);
				const urls = [...viejas.map((h) => claveEnLaCache(a, h)), clave];
				const borradas = clavesReemplazadas(urls, a, clave);
				const quedan = urls.filter((u) => !borradas.includes(u));
				expect(clavesReemplazadas(quedan, a, clave)).toEqual([]);
			})
		);
	});
});
