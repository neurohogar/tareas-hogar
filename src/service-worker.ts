/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
// Spec §8: precachea el build estático para abrir sin conexión en cualquier
// ruta. La versión nueva se instala en segundo plano y espera: activa (y borra
// la caché vieja) cuando no queda ninguna página de la versión anterior, o sea
// la próxima vez que se abre la app. Sin avisar.
//
// Las fuentes no entran en la precarga: si un archivo falla, `addAll` cancela la
// instalación entera (§8). Las baja y las guarda la página (adapters/fuentes.ts)
// en su propia caché, que sobrevive a las versiones que no las cambian (§6.6).
import { build, files, version } from '$service-worker';
import { CACHE_DE_FUENTES, esArchivoDeFuente } from '$lib/core/fuentes-empaquetadas';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `tareas-hogar-${version}`;
/** El fallback de adapter-static: la app que atiende cualquier ruta. */
const APP = '/';

sw.addEventListener('install', (evento) => {
	evento.waitUntil(
		caches.open(CACHE).then((cache) => cache.addAll([APP, ...build, ...files.filter((archivo) => !esArchivoDeFuente(archivo))]))
	);
});

sw.addEventListener('activate', (evento) => {
	evento.waitUntil(
		caches
			.keys()
			.then((claves) => Promise.all(claves.filter((clave) => clave !== CACHE && clave !== CACHE_DE_FUENTES).map((clave) => caches.delete(clave))))
	);
});

sw.addEventListener('fetch', (evento) => {
	const { request } = evento;
	const url = new URL(request.url);
	// HEAD también: el selector de emoji consulta el ETag de su catálogo, que está en la caché.
	if (!['GET', 'HEAD'].includes(request.method) || url.origin !== sw.location.origin) return;
	if (esArchivoDeFuente(url.pathname)) return;
	evento.respondWith(responder(request, url));
});

async function responder(request: Request, url: URL): Promise<Response> {
	const cache = await caches.open(CACHE);
	const guardado = await cache.match(request.mode === 'navigate' ? APP : url.pathname);
	if (!guardado) return fetch(request);
	return request.method === 'HEAD' ? sinCuerpo(guardado) : guardado;
}

/** La respuesta a un HEAD: los mismos encabezados que la guardada, sin cuerpo. */
function sinCuerpo(respuesta: Response): Response {
	return new Response(null, { status: respuesta.status, statusText: respuesta.statusText, headers: respuesta.headers });
}
