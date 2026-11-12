import { cpSync, createReadStream, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join } from 'node:path';
import type { Page } from '@playwright/test';

// Dos builds servidos en el mismo origen (puerto 4174), para simular que se publica una versión nueva.

export const ORIGEN_VERSIONES = 'http://127.0.0.1:4174';

const TIPOS: Record<string, string> = {
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
export function servir(estado: { dir: string }): Promise<Server> {
	const servidor = createServer((req, res) => {
		const ruta = decodeURIComponent((req.url ?? '/').split('?')[0]);
		let archivo = join(estado.dir, ruta);
		if (!existsSync(archivo) || !statSync(archivo).isFile()) archivo = join(estado.dir, 'index.html');
		res.writeHead(200, { 'content-type': TIPOS[extname(archivo)] ?? 'application/octet-stream' });
		createReadStream(archivo).pipe(res);
	});
	return new Promise((ok) => servidor.listen(4174, '127.0.0.1', () => ok(servidor)));
}

export const versionDe = (dir: string): string => JSON.parse(readFileSync(join(dir, '_app/version.json'), 'utf8')).version;

/** Las cachés de la app, una por versión; la de las fuentes sobrevive a las versiones (spec §6.6) y no cuenta. */
export const cachesDe = (p: Page) =>
	p.evaluate(() => caches.keys().then((claves) => claves.filter((c) => c !== 'tareas-hogar-fuentes')));

export const hayVersionEsperando = (p: Page) =>
	p.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => !!r?.waiting));

const CARPETA_DE_FUENTES = '"/fuentes/"';
const ARCHIVO_DE_NOTO = 'noto-color-emoji-emoji-400-normal.woff2';

const archivosJs = (dir: string): string[] =>
	(readdirSync(dir, { recursive: true }) as string[]).filter((a) => a.endsWith('.js')).map((a) => join(dir, a));

/** Reemplaza un texto en el código de la app. Falla si no estaba: así un cambio en el build no pasa inadvertido. */
function reemplazarEnElCodigo(destino: string, viejo: string, nuevo: string): void {
	const conTexto = archivosJs(join(destino, '_app/immutable')).filter((a) => readFileSync(a, 'utf8').includes(viejo));
	if (conTexto.length === 0) throw new Error(`el build no contiene ${viejo}`);
	for (const a of conTexto) writeFileSync(a, readFileSync(a, 'utf8').replaceAll(viejo, nuevo));
}

/** Otra versión del service worker: al publicarse se instala y espera. */
function cambiarVersion(origen: string, destino: string, sufijo: string): void {
	const version = versionDe(origen);
	const otra = `${version}${sufijo}`;
	writeFileSync(join(destino, 'service-worker.js'), readFileSync(join(origen, 'service-worker.js'), 'utf8').replaceAll(version, otra));
	writeFileSync(join(destino, '_app/version.json'), JSON.stringify({ version: otra }));
}

/**
 * Del build `origen` deriva en `destino` la versión anterior a la fuente empaquetada: sin los archivos
 * de fuentes, con la página pidiéndolos en una ruta que no existe (nunca llegan) y con otra versión.
 * No hace falta reconstruir, así el preview de 4173 sigue en pie.
 */
export function versionSinFuentes(origen: string, destino: string): void {
	cpSync(origen, destino, { recursive: true });
	rmSync(join(destino, 'fuentes'), { recursive: true });
	reemplazarEnElCodigo(destino, CARPETA_DE_FUENTES, '"/sin-fuentes/"');
	cambiarVersion(origen, destino, '0');
}

/** Una versión nueva que no toca la fuente ni el juego de emoji. */
export function versionConLasMismasFuentes(origen: string, destino: string): void {
	cpSync(origen, destino, { recursive: true });
	cambiarVersion(origen, destino, '1');
}

/** Una versión nueva cuyo juego de emoji cambió: lo que cambia es la huella de su contenido (vite.config.ts). */
export function versionConOtroJuego(origen: string, destino: string): void {
	cpSync(origen, destino, { recursive: true });
	const codigo = archivosJs(join(destino, '_app/immutable')).map((a) => readFileSync(a, 'utf8')).join();
	const huella = codigo.match(new RegExp(`"${ARCHIVO_DE_NOTO}":"(\\w+)"`))?.[1];
	if (huella === undefined) throw new Error('el build no declara la huella de Noto');
	reemplazarEnElCodigo(destino, huella, huella.replace(/^./, (c) => (c === '0' ? '1' : '0')));
	cambiarVersion(origen, destino, '2');
}
