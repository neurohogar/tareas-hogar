// Spec §6, §7 y §8: la fuente y el juego de emoji se bajan aparte de la instalación,
// con reintentos, y se guardan para funcionar sin conexión. Se registran por código y
// no con @font-face: así hay un solo pedido por intento, el navegador nunca se queda
// con una descarga abortada, y un juego que no puede dibujar nunca deja un emoji en blanco.
import {
	FONT_CACHE,
	FIRST_RETRY_IN_MS,
	keyInCache,
	replacedKeys,
	fontPath,
	nextWait
} from '#lib/core/bundled-fonts.ts';
import { fontsSummary, type FontStatus } from '#lib/core/loading-screen.ts';

/** Por archivo de fuente, la huella de su contenido (vite.config.ts). */
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
 * Noto también tiene el espacio, las cifras, `#`, `*`, `©`, `®` y `™`: sin Atkinson, va antes que la fuente
 * del sistema y dibujaría ese texto, que tiene que verse con la del sistema (spec §6). Un emoji con marca
 * que empieza con uno de esos caracteres queda, mientras tanto, con el del dispositivo.
 */
const EMOJI_ONLY = 'U+0-1F, U+21-22, U+24-29, U+2B-2F, U+3A-A8, U+AA-AD, U+AF-2121, U+2123-10FFFF';
const WHOLE_SET = 'U+0-10FFFF';

/** El contenido del juego de emoji de esta versión: identifica si una versión nueva lo cambió. */
export const notoFingerprint = (): string => __FONT_FINGERPRINTS__[NOTO_FILE];

/** Los glifos de Noto son solo capas de color: un navegador que no dibuja esas tablas los deja en blanco. */
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

/** La cara guardada en el dispositivo, si hay una que se pueda usar. */
async function readCached(family: string, file: FontFile): Promise<FontFace | undefined> {
	try {
		const cached = await (await caches.open(FONT_CACHE)).match(keyOf(file));
		return cached && (await createFace(family, file, await cached.arrayBuffer()));
	} catch {
		return undefined;
	}
}

/** Guarda el archivo y borra las versiones que reemplaza. Sin almacenamiento, la fuente dura lo que dure la página. */
async function saveToCache(file: FontFile, data: ArrayBuffer): Promise<void> {
	try {
		const cache = await caches.open(FONT_CACHE);
		const key = keyOf(file);
		await cache.put(key, new Response(data));
		const cachedUrls = (await cache.keys()).map(({ url }) => url);
		await Promise.all(replacedKeys(cachedUrls, file.name, key).map((old) => cache.delete(old)));
	} catch {
		// Se vuelve a bajar en la próxima apertura.
	}
}

/** `no-cache`: el archivo guardado tiene que ser el de esta versión, no uno viejo de la caché HTTP. */
async function download({ name }: FontFile): Promise<ArrayBuffer> {
	const response = await fetch(fontPath(name), { cache: 'no-cache' });
	if (!response.ok) throw new Error(`Sin ${name}: ${response.status}`);
	return response.arrayBuffer();
}

/** Spec §6: se reintenta al vencer la espera o al volver la red, sin recargar; sin red, solo al volver. */
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
 * Lo guardado o, si no, lo que se baje: reintenta hasta conseguirlo. Un archivo que no es
 * una fuente válida (la respuesta de otra ruta, por ejemplo) cuenta como falla y no se guarda.
 */
async function obtainFace(family: string, file: FontFile, notify: (status: FontStatus) => void): Promise<FontFace> {
	const cached = await readCached(family, file);
	if (cached) return cached;
	notify('sin-guardar');
	for (let wait = FIRST_RETRY_IN_MS; ; wait = nextWait(wait)) {
		try {
			const data = await download(file);
			const face = await createFace(family, file, data);
			await saveToCache(file, data);
			notify('guardada');
			return face;
		} catch {
			notify('fallida');
			await nextAttempt(wait);
		}
	}
}

/**
 * Registra el juego entero de una vez: con un peso solo, el navegador lo usaría también
 * para los otros pesos, y el diseño cambiaría (spec §6). Avisa `lista` recién al poder dibujar.
 */
async function loadFontSet({ family, files, canDraw }: FontSet, notify: (status: FontStatus) => void): Promise<void> {
	const statuses = files.map((): FontStatus => 'guardada');
	const faces = await Promise.all(
		files.map((file, i) =>
			obtainFace(family, file, (status) => {
				statuses[i] = status;
				notify(fontsSummary(statuses));
			})
		)
	);
	// FontFaceSet es un Set de caras, aunque los tipos del DOM no lo digan.
	const registered = document.fonts as unknown as Set<FontFace>;
	faces.forEach((face) => registered.add(face));
	if (canDraw()) return notify('lista');
	faces.forEach((face) => registered.delete(face));
	notify('fallida');
}

export interface FontsStatus {
	atkinson: FontStatus;
	noto: FontStatus;
}

/**
 * Empieza a cargar la fuente y el juego y avisa cómo va cada uno. Dura lo que dure la
 * página: la descarga sigue aunque la pantalla de carga ya se haya ido (spec §6.6).
 */
export function loadFonts(onChange: (change: Partial<FontsStatus>) => void): void {
	let notoScope = EMOJI_ONLY;
	const adjustNoto = () =>
		document.fonts.forEach((face) => {
			if (face.family.includes(NOTO.family)) face.unicodeRange = notoScope;
		});
	void loadFontSet(ATKINSON, (atkinson) => {
		if (atkinson === 'lista') notoScope = WHOLE_SET;
		adjustNoto();
		onChange({ atkinson });
	});
	void loadFontSet(NOTO, (noto) => {
		adjustNoto();
		onChange({ noto });
	});
}
