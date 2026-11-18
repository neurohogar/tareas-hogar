// Spec §8: precaches the static build to open offline on any
// route. The new version installs in the background and waits: it activates (and deletes
// the old cache) when no page of the previous version is left, that is,
// the next time the app is opened. Without notice.
//
// The fonts are not precached: if one file fails, `addAll` cancels the
// whole install (§8). The page downloads and stores them (adapters/fonts.ts)
// in its own cache, which survives the versions that do not change them (§6.6).
import { version } from '$app/env';
import { immutable, assets } from '$app/manifest';
import { asset } from '$app/paths';
import { FONT_CACHE, isFontFile } from '#lib/core/bundled-fonts.ts';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `tareas-hogar-${version}`;
/** The adapter-static fallback: the app that serves any route. */
const APP = '/';
/** The Vite files: the manifest gives them relative to the base, which in this app is the root. */
const build = immutable.map(({ path }) => `/${path}`);
/** The files of `static/`. */
const files = assets.map(({ path }) => asset(path));

sw.addEventListener('install', (evento) => {
	evento.waitUntil(
		caches.open(CACHE).then((cache) => cache.addAll([APP, ...build, ...files.filter((archivo) => !isFontFile(archivo))]))
	);
});

sw.addEventListener('activate', (evento) => {
	evento.waitUntil(
		caches
			.keys()
			.then((claves) => Promise.all(claves.filter((clave) => clave !== CACHE && clave !== FONT_CACHE).map((clave) => caches.delete(clave))))
	);
});

sw.addEventListener('fetch', (evento) => {
	const { request } = evento;
	const url = new URL(request.url);
	// HEAD too: the emoji picker queries the ETag of its catalog, which is in the cache.
	if (!['GET', 'HEAD'].includes(request.method) || url.origin !== sw.location.origin) return;
	if (isFontFile(url.pathname)) return;
	evento.respondWith(responder(request, url));
});

async function responder(request: Request, url: URL): Promise<Response> {
	const cache = await caches.open(CACHE);
	const guardado = await cache.match(request.mode === 'navigate' ? APP : url.pathname);
	if (!guardado) return fetch(request);
	return request.method === 'HEAD' ? sinCuerpo(guardado) : guardado;
}

/** The response to a HEAD: the same headers as the stored one, without a body. */
function sinCuerpo(respuesta: Response): Response {
	return new Response(null, { status: respuesta.status, statusText: respuesta.statusText, headers: respuesta.headers });
}
