// Spec §6 and §8: how font files are identified, stored and retried.
// The page (adapters/fonts.ts) and the service worker share it, and the latter cannot import
// from adapters: that is why the cache name and the file path live here, once.

/** The font cache: it survives versions that do not change the fonts (spec §6.6). */
export const FONT_CACHE = 'tareas-hogar-fuentes';

const FONTS_FOLDER = '/fuentes/';

/** Spec §8: fonts are not part of the service worker precache. */
export const isFontFile = (filePath: string): boolean =>
	filePath.startsWith(FONTS_FOLDER) && filePath.endsWith('.woff2');

export const fontPath = (name: string): string => `${FONTS_FOLDER}${name}`;

/** The file identified by its content: a new version that changes it is another key. */
export const keyInCache = (name: string, fingerprint: string): string =>
	`${fontPath(name)}?huella=${fingerprint}`;

/** The stored entries of the same file with another fingerprint: the ones the new key replaces. */
export function replacedKeys(savedUrls: string[], name: string, key: string): string[] {
	return savedUrls.filter(
		(url) => new URL(url, 'https://app.invalid').pathname === fontPath(name) && !url.endsWith(key)
	);
}

export const FIRST_RETRY_IN_MS = 2_000;
export const LAST_RETRY_IN_MS = 60_000;

/** Spec §6: the wait doubles on each failed attempt up to the maximum. */
export const nextWait = (waitInMs: number): number => Math.min(waitInMs * 2, LAST_RETRY_IN_MS);
