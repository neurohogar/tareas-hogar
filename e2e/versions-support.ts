import { cpSync, createReadStream, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join } from 'node:path';
import type { Page } from '@playwright/test';

// Two builds served from the same origin (port 4174), to simulate a new version being published.

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

/** Serves `estado.dir`; changing `estado.dir` publishes another build. */
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

/** The app's caches, one per version; the fonts cache survives versions (spec §6.6) and does not count. */
export const cachesOf = (p: Page) =>
	p.evaluate(() => caches.keys().then((keys) => keys.filter((c) => c !== 'tareas-hogar-fuentes')));

export const hasVersionWaiting = (p: Page) =>
	p.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => !!r?.waiting));

const FONTS_FOLDER = '/fuentes/';
const NOTO_FILE = 'noto-color-emoji-emoji-400-normal.woff2';

const filesJs = (dir: string): string[] =>
	(readdirSync(dir, { recursive: true }) as string[]).filter((a) => a.endsWith('.js')).map((a) => join(dir, a));

/** A string from the minified code with its quotes, which depending on the minifier are ", ' or `. */
const QUOTE = '(["\'`])';

const codeOf = (target: string): string =>
	filesJs(join(target, '_app/immutable')).map((a) => readFileSync(a, 'utf8')).join();

/** Replaces a text in the app code. Fails if it was not there: this way a change in the build does not go unnoticed. */
function replaceInCode(target: string, old: string, updated: string): void {
	const withText = filesJs(join(target, '_app/immutable')).filter((a) => readFileSync(a, 'utf8').includes(old));
	if (withText.length === 0) throw new Error(`the build does not contain ${old}`);
	for (const a of withText) writeFileSync(a, readFileSync(a, 'utf8').replaceAll(old, updated));
}

/** Another service worker version: when published it installs and waits. */
function changeVersion(origin: string, target: string, suffix: string): void {
	const version = versionOf(origin);
	const other = `${version}${suffix}`;
	writeFileSync(join(target, 'service-worker.js'), readFileSync(join(origin, 'service-worker.js'), 'utf8').replaceAll(version, other));
	writeFileSync(join(target, '_app/version.json'), JSON.stringify({ version: other }));
}

/**
 * From build `origen` derives in `destino` the version prior to the bundled font: without the font files,
 * with the page requesting them at a path that does not exist (they never arrive) and with another version.
 * No rebuild is needed, so the 4173 preview stays up.
 */
export function versionWithoutFonts(origin: string, target: string): void {
	cpSync(origin, target, { recursive: true });
	rmSync(join(target, 'fuentes'), { recursive: true });
	const folder = codeOf(target).match(new RegExp(`${QUOTE}${FONTS_FOLDER}\\1`))?.[0];
	if (folder === undefined) throw new Error(`the build does not contain ${FONTS_FOLDER}`);
	replaceInCode(target, folder, folder.replace(FONTS_FOLDER, '/sin-fuentes/'));
	changeVersion(origin, target, '0');
}

/** A new version that touches neither the font nor the emoji set. */
export function versionWithSameFonts(origin: string, target: string): void {
	cpSync(origin, target, { recursive: true });
	changeVersion(origin, target, '1');
}

/** A new version whose emoji set changed: what changes is the fingerprint of its content (vite.config.ts). */
export function versionWithOtherSet(origin: string, target: string): void {
	cpSync(origin, target, { recursive: true });
	const fingerprint = codeOf(target).match(new RegExp(`${QUOTE}${NOTO_FILE}\\1:${QUOTE}(\\w+)\\2`))?.[3];
	if (fingerprint === undefined) throw new Error('the build does not declare the Noto fingerprint');
	replaceInCode(target, fingerprint, fingerprint.replace(/^./, (c) => (c === '0' ? '1' : '0')));
	changeVersion(origin, target, '2');
}
