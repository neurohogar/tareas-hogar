// Spec §6, §7 and §8: the font and the emoji set are downloaded apart from the install,
// with retries, and stored to work offline. They are registered in code rather than
// with @font-face: that way there is a single request per attempt, the browser never ends up
// with an aborted download, and a set that cannot draw never leaves a blank emoji.
import {
	FONT_CACHE,
	FIRST_RETRY_IN_MS,
	keyInCache,
	replacedKeys,
	fontPath,
	nextWait
} from '#lib/core/bundled-fonts.ts';
import { fontsSummary, type FontStatus } from '#lib/core/loading-screen.ts';

/** For each font file, the fingerprint of its contents (vite.config.ts). */
declare const __FONT_FINGERPRINTS__: Record<string, string>;

interface FontFile {
	name: string;
	weight: number;
}

interface FontSet {
	family: string;
	files: FontFile[];
	canDraw: () => boolean;
}

const NOTO_FILE = 'noto-color-emoji-emoji-400-normal.woff2';

const ATKINSON: FontSet = {
	family: 'Atkinson Hyperlegible Next',
	files: [400, 600, 700].flatMap((weight) =>
		['latin-ext', 'latin'].map((alphabet) => ({ name: `atkinson-hyperlegible-next-${alphabet}-${weight}-normal.woff2`, weight }))
	),
	canDraw: () => true
};

const NOTO: FontSet = {
	family: 'Noto Color Emoji',
	files: [{ name: NOTO_FILE, weight: 400 }],
	canDraw: canDrawNoto
};

/**
 * Noto also has the space, the digits, `#`, `*`, `©`, `®` and `™`: without Atkinson, it goes before the system
 * font and would draw that text, which has to show in the system font (spec §6). An emoji with a mark
 * that starts with one of those characters stays, meanwhile, with the device's.
 */
const EMOJI_ONLY = 'U+0-1F, U+21-22, U+24-29, U+2B-2F, U+3A-A8, U+AA-AD, U+AF-2121, U+2123-10FFFF';
const WHOLE_SET = 'U+0-10FFFF';

/** The contents of this version's emoji set: tells whether a new version changed it. */
export const notoFingerprint = (): string => __FONT_FINGERPRINTS__[NOTO_FILE];

/** Noto's glyphs are only color layers: a browser that does not draw those tables leaves them blank. */
function canDrawNoto(): boolean {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = 32;
	const context = canvas.getContext('2d');
	if (!context) return false;
	context.font = `24px "${NOTO.family}"`;
	context.textBaseline = 'top';
	context.fillText('🌱', 0, 0);
	return context.getImageData(0, 0, canvas.width, canvas.height).data.some((value, i) => i % 4 === 3 && value > 0);
}

const keyOf = ({ name }: FontFile) => keyInCache(name, __FONT_FINGERPRINTS__[name]);

async function createFace(family: string, { weight }: FontFile, data: ArrayBuffer): Promise<FontFace> {
	return new FontFace(family, data, { weight: String(weight), style: 'normal' }).load();
}

/** The face stored on the device, if there is one that can be used. */
async function readCached(family: string, file: FontFile): Promise<FontFace | undefined> {
	try {
		const cached = await (await caches.open(FONT_CACHE)).match(keyOf(file));
		return cached && (await createFace(family, file, await cached.arrayBuffer()));
	} catch {
		return undefined;
	}
}

/** Stores the file and deletes the versions it replaces. Without storage, the font lasts as long as the page. */
async function saveToCache(file: FontFile, data: ArrayBuffer): Promise<void> {
	try {
		const cache = await caches.open(FONT_CACHE);
		const key = keyOf(file);
		await cache.put(key, new Response(data));
		const cachedUrls = (await cache.keys()).map(({ url }) => url);
		await Promise.all(replacedKeys(cachedUrls, file.name, key).map((old) => cache.delete(old)));
	} catch {
		// It is downloaded again on the next launch.
	}
}

/** `no-cache`: the stored file has to be this version's, not an old one from the HTTP cache. */
async function download({ name }: FontFile): Promise<ArrayBuffer> {
	const response = await fetch(fontPath(name), { cache: 'no-cache' });
	if (!response.ok) throw new Error(`Could not fetch ${name}: ${response.status}`);
	return response.arrayBuffer();
}

/** Spec §6: retries when the wait expires or the network returns, without reloading; offline, only when it returns. */
function nextAttempt(waitInMs: number): Promise<void> {
	return new Promise((resolve) => {
		const attempt = () => {
			clearTimeout(timeout);
			window.removeEventListener('online', attempt);
			resolve();
		};
		const timeout = navigator.onLine ? setTimeout(attempt, waitInMs) : undefined;
		window.addEventListener('online', attempt);
	});
}

/**
 * What is stored or, failing that, what gets downloaded: retries until it succeeds. A file that is not
 * a valid font (the response of another route, for example) counts as a failure and is not stored.
 */
async function obtainFace(family: string, file: FontFile, notify: (status: FontStatus) => void): Promise<FontFace> {
	const cached = await readCached(family, file);
	if (cached) return cached;
	notify('unsaved');
	for (let wait = FIRST_RETRY_IN_MS; ; wait = nextWait(wait)) {
		try {
			const data = await download(file);
			const face = await createFace(family, file, data);
			await saveToCache(file, data);
			notify('saved');
			return face;
		} catch {
			notify('failed');
			await nextAttempt(wait);
		}
	}
}

/**
 * Registers the whole set at once: with a single weight, the browser would use it also
 * for the other weights, and the design would change (spec §6). Reports `lista` only once it can draw.
 */
async function loadFontSet({ family, files, canDraw }: FontSet, notify: (status: FontStatus) => void): Promise<void> {
	const statuses = files.map((): FontStatus => 'saved');
	const faces = await Promise.all(
		files.map((file, i) =>
			obtainFace(family, file, (status) => {
				statuses[i] = status;
				notify(fontsSummary(statuses));
			})
		)
	);
	// FontFaceSet is a Set of faces, although the DOM types do not say so.
	const registered = document.fonts as unknown as Set<FontFace>;
	faces.forEach((face) => registered.add(face));
	if (canDraw()) return notify('ready');
	faces.forEach((face) => registered.delete(face));
	notify('failed');
}

export interface FontsStatus {
	atkinson: FontStatus;
	noto: FontStatus;
}

/**
 * Starts loading the font and the set and reports how each one is going. It lasts as long as the
 * page: the download continues even after the loading screen has gone (spec §6.6).
 */
export function loadFonts(onChange: (change: Partial<FontsStatus>) => void): void {
	let notoScope = EMOJI_ONLY;
	const adjustNoto = () =>
		document.fonts.forEach((face) => {
			if (face.family.includes(NOTO.family)) face.unicodeRange = notoScope;
		});
	void loadFontSet(ATKINSON, (atkinson) => {
		if (atkinson === 'ready') notoScope = WHOLE_SET;
		adjustNoto();
		onChange({ atkinson });
	});
	void loadFontSet(NOTO, (noto) => {
		adjustNoto();
		onChange({ noto });
	});
}
