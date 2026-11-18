import { cpSync, createReadStream, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join } from 'node:path';
import type { Page } from '@playwright/test';

// Dos builds servidos en el mismo origen (puerto 4174), para simular que se publica una versión nueva.

export const ORIGIN_VERSIONS = 'http://127.0.0.1:4174';

const KINDS: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.webmanifest': 'application/manifest+json',
	'.woff2': 'font/woff2'
};

/** Sirve `estado.dir`; cambiar `estado.dir` publica otro build. */
export function serve(status: { dir: string }): Promise<Server> {
	const server = createServer((req, res) => {
		const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
		let file = join(status.dir, path);
		if (!existsSync(file) || !statSync(file).isFile()) file = join(status.dir, 'index.html');
		res.writeHead(200, { 'content-type': KINDS[extname(file)] ?? 'application/octet-stream' });
		createReadStream(file).pipe(res);
	});
	return new Promise((ok) => server.listen(4174, '127.0.0.1', () => ok(server)));
}

export const versionOf = (dir: string): string => JSON.parse(readFileSync(join(dir, '_app/version.json'), 'utf8')).version;

/** Las cachés de la app, una por versión; la de las fuentes sobrevive a las versiones (spec §6.6) y no cuenta. */
export const cachesOf = (p: Page) =>
	p.evaluate(() => caches.keys().then((keys) => keys.filter((c) => c !== 'tareas-hogar-fuentes')));

export const hasVersionWaiting = (p: Page) =>
	p.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => !!r?.waiting));

const FONTS_FOLDER = '/fuentes/';
const NOTO_FILE = 'noto-color-emoji-emoji-400-normal.woff2';

const filesJs = (dir: string): string[] =>
	(readdirSync(dir, { recursive: true }) as string[]).filter((a) => a.endsWith('.js')).map((a) => join(dir, a));

/** Un string del código minificado con sus comillas, que según el minificador son ", ' o `. */
const QUOTE = '(["\'`])';

const codeOf = (target: string): string =>
	filesJs(join(target, '_app/immutable')).map((a) => readFileSync(a, 'utf8')).join();

/** Reemplaza un texto en el código de la app. Falla si no estaba: así un cambio en el build no pasa inadvertido. */
function replaceInCode(target: string, old: string, updated: string): void {
	const withText = filesJs(join(target, '_app/immutable')).filter((a) => readFileSync(a, 'utf8').includes(old));
	if (withText.length === 0) throw new Error(`el build no contiene ${old}`);
	for (const a of withText) writeFileSync(a, readFileSync(a, 'utf8').replaceAll(old, updated));
}

/** Otra versión del service worker: al publicarse se instala y espera. */
function changeVersion(origin: string, target: string, suffix: string): void {
	const version = versionOf(origin);
	const other = `${version}${suffix}`;
	writeFileSync(join(target, 'service-worker.js'), readFileSync(join(origin, 'service-worker.js'), 'utf8').replaceAll(version, other));
	writeFileSync(join(target, '_app/version.json'), JSON.stringify({ version: other }));
}

/**
 * Del build `origen` deriva en `destino` la versión anterior a la fuente empaquetada: sin los archivos
 * de fuentes, con la página pidiéndolos en una ruta que no existe (nunca llegan) y con otra versión.
 * No hace falta reconstruir, así el preview de 4173 sigue en pie.
 */
export function versionWithoutFonts(origin: string, target: string): void {
	cpSync(origin, target, { recursive: true });
	rmSync(join(target, 'fuentes'), { recursive: true });
	const folder = codeOf(target).match(new RegExp(`${QUOTE}${FONTS_FOLDER}\\1`))?.[0];
	if (folder === undefined) throw new Error(`el build no contiene ${FONTS_FOLDER}`);
	replaceInCode(target, folder, folder.replace(FONTS_FOLDER, '/sin-fuentes/'));
	changeVersion(origin, target, '0');
}

/** Una versión nueva que no toca la fuente ni el juego de emoji. */
export function versionWithSameFonts(origin: string, target: string): void {
	cpSync(origin, target, { recursive: true });
	changeVersion(origin, target, '1');
}

/** Una versión nueva cuyo juego de emoji cambió: lo que cambia es la huella de su contenido (vite.config.ts). */
export function versionWithOtherSet(origin: string, target: string): void {
	cpSync(origin, target, { recursive: true });
	const fingerprint = codeOf(target).match(new RegExp(`${QUOTE}${NOTO_FILE}\\1:${QUOTE}(\\w+)\\2`))?.[3];
	if (fingerprint === undefined) throw new Error('el build no declara la huella de Noto');
	replaceInCode(target, fingerprint, fingerprint.replace(/^./, (c) => (c === '0' ? '1' : '0')));
	changeVersion(origin, target, '2');
}
