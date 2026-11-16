// Spec §6 y §8: cómo se identifican, se guardan y se reintentan los archivos de fuente.
// Lo comparten la página (adapters/fuentes.ts) y el service worker, que no puede importar
// de adapters: por eso el nombre de la caché y la ruta de los archivos viven acá, una vez.

/** La caché de fuentes: sobrevive a las versiones que no cambian las fuentes (spec §6.6). */
export const FONT_CACHE = 'tareas-hogar-fuentes';

const FONTS_FOLDER = '/fuentes/';

/** Spec §8: las fuentes no entran en la precarga del service worker. */
export const isFontFile = (filePath: string): boolean =>
	filePath.startsWith(FONTS_FOLDER) && filePath.endsWith('.woff2');

export const fontPath = (name: string): string => `${FONTS_FOLDER}${name}`;

/** El archivo identificado por su contenido: una versión nueva que lo cambia es otra clave. */
export const keyInCache = (name: string, fingerprint: string): string =>
	`${fontPath(name)}?huella=${fingerprint}`;

/** Las entradas guardadas del mismo archivo con otra huella: las que la clave nueva reemplaza. */
export function replacedKeys(savedUrls: string[], name: string, key: string): string[] {
	return savedUrls.filter(
		(url) => new URL(url, 'https://app.invalid').pathname === fontPath(name) && !url.endsWith(key)
	);
}

export const FIRST_RETRY_IN_MS = 2_000;
export const LAST_RETRY_IN_MS = 60_000;

/** Spec §6: la espera se duplica en cada intento fallido hasta el máximo. */
export const nextWait = (waitInMs: number): number => Math.min(waitInMs * 2, LAST_RETRY_IN_MS);
