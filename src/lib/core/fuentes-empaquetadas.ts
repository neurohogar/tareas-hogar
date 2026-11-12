// Spec §6 y §8: cómo se identifican, se guardan y se reintentan los archivos de fuente.
// Lo comparten la página (adapters/fuentes.ts) y el service worker, que no puede importar
// de adapters: por eso el nombre de la caché y la ruta de los archivos viven acá, una vez.

/** La caché de fuentes: sobrevive a las versiones que no cambian las fuentes (spec §6.6). */
export const CACHE_DE_FUENTES = 'tareas-hogar-fuentes';

const CARPETA_DE_FUENTES = '/fuentes/';

/** Spec §8: las fuentes no entran en la precarga del service worker. */
export const esArchivoDeFuente = (ruta: string): boolean =>
	ruta.startsWith(CARPETA_DE_FUENTES) && ruta.endsWith('.woff2');

export const rutaDeFuente = (nombre: string): string => `${CARPETA_DE_FUENTES}${nombre}`;

/** El archivo identificado por su contenido: una versión nueva que lo cambia es otra clave. */
export const claveEnLaCache = (nombre: string, huella: string): string =>
	`${rutaDeFuente(nombre)}?huella=${huella}`;

/** Las entradas guardadas del mismo archivo con otra huella: las que la clave nueva reemplaza. */
export function clavesReemplazadas(urlsGuardadas: string[], nombre: string, clave: string): string[] {
	return urlsGuardadas.filter(
		(url) => new URL(url, 'https://app.invalid').pathname === rutaDeFuente(nombre) && !url.endsWith(clave)
	);
}

export const PRIMER_REINTENTO_EN_MS = 2_000;
export const ULTIMO_REINTENTO_EN_MS = 60_000;

/** Spec §6: la espera se duplica en cada intento fallido hasta el máximo. */
export const siguienteEspera = (esperaEnMs: number): number => Math.min(esperaEnMs * 2, ULTIMO_REINTENTO_EN_MS);
