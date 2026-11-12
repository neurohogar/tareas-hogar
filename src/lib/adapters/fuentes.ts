// Spec §6, §7 y §8: la fuente y el juego de emoji se bajan aparte de la instalación,
// con reintentos, y se guardan para funcionar sin conexión. Se registran por código y
// no con @font-face: así hay un solo pedido por intento, el navegador nunca se queda
// con una descarga abortada, y un juego que no puede dibujar nunca deja un emoji en blanco.
import {
	CACHE_DE_FUENTES,
	PRIMER_REINTENTO_EN_MS,
	claveEnLaCache,
	clavesReemplazadas,
	rutaDeFuente,
	siguienteEspera
} from '#lib/core/fuentes-empaquetadas.ts';
import { resumenDeFuentes, type EstadoDeFuente } from '#lib/core/pantalla-de-carga.ts';

/** Por archivo de fuente, la huella de su contenido (vite.config.ts). */
declare const __HUELLAS_DE_FUENTES__: Record<string, string>;

interface ArchivoDeFuente {
	nombre: string;
	peso: number;
}

interface Juego {
	familia: string;
	archivos: ArchivoDeFuente[];
	sePuedeDibujar: () => boolean;
}

const ARCHIVO_DE_NOTO = 'noto-color-emoji-emoji-400-normal.woff2';

const ATKINSON: Juego = {
	familia: 'Atkinson Hyperlegible Next',
	archivos: [400, 600, 700].flatMap((peso) =>
		['latin-ext', 'latin'].map((alfabeto) => ({ nombre: `atkinson-hyperlegible-next-${alfabeto}-${peso}-normal.woff2`, peso }))
	),
	sePuedeDibujar: () => true
};

const NOTO: Juego = {
	familia: 'Noto Color Emoji',
	archivos: [{ nombre: ARCHIVO_DE_NOTO, peso: 400 }],
	sePuedeDibujar: dibujaNoto
};

/**
 * Noto también tiene el espacio, las cifras, `#`, `*`, `©`, `®` y `™`: sin Atkinson, va antes que la fuente
 * del sistema y dibujaría ese texto, que tiene que verse con la del sistema (spec §6). Un emoji con marca
 * que empieza con uno de esos caracteres queda, mientras tanto, con el del dispositivo.
 */
const SOLO_EMOJI = 'U+0-1F, U+21-22, U+24-29, U+2B-2F, U+3A-A8, U+AA-AD, U+AF-2121, U+2123-10FFFF';
const TODO_EL_JUEGO = 'U+0-10FFFF';

/** El contenido del juego de emoji de esta versión: identifica si una versión nueva lo cambió. */
export const huellaDeNoto = (): string => __HUELLAS_DE_FUENTES__[ARCHIVO_DE_NOTO];

/** Los glifos de Noto son solo capas de color: un navegador que no dibuja esas tablas los deja en blanco. */
function dibujaNoto(): boolean {
	const lienzo = document.createElement('canvas');
	lienzo.width = lienzo.height = 32;
	const contexto = lienzo.getContext('2d');
	if (!contexto) return false;
	contexto.font = `24px "${NOTO.familia}"`;
	contexto.textBaseline = 'top';
	contexto.fillText('🌱', 0, 0);
	return contexto.getImageData(0, 0, lienzo.width, lienzo.height).data.some((valor, i) => i % 4 === 3 && valor > 0);
}

const claveDe = ({ nombre }: ArchivoDeFuente) => claveEnLaCache(nombre, __HUELLAS_DE_FUENTES__[nombre]);

async function crearCara(familia: string, { peso }: ArchivoDeFuente, datos: ArrayBuffer): Promise<FontFace> {
	return new FontFace(familia, datos, { weight: String(peso), style: 'normal' }).load();
}

/** La cara guardada en el dispositivo, si hay una que se pueda usar. */
async function leerGuardada(familia: string, archivo: ArchivoDeFuente): Promise<FontFace | undefined> {
	try {
		const guardada = await (await caches.open(CACHE_DE_FUENTES)).match(claveDe(archivo));
		return guardada && (await crearCara(familia, archivo, await guardada.arrayBuffer()));
	} catch {
		return undefined;
	}
}

/** Guarda el archivo y borra las versiones que reemplaza. Sin almacenamiento, la fuente dura lo que dure la página. */
async function guardar(archivo: ArchivoDeFuente, datos: ArrayBuffer): Promise<void> {
	try {
		const cache = await caches.open(CACHE_DE_FUENTES);
		const clave = claveDe(archivo);
		await cache.put(clave, new Response(datos));
		const guardadas = (await cache.keys()).map(({ url }) => url);
		await Promise.all(clavesReemplazadas(guardadas, archivo.nombre, clave).map((vieja) => cache.delete(vieja)));
	} catch {
		// Se vuelve a bajar en la próxima apertura.
	}
}

/** `no-cache`: el archivo guardado tiene que ser el de esta versión, no uno viejo de la caché HTTP. */
async function bajar({ nombre }: ArchivoDeFuente): Promise<ArrayBuffer> {
	const respuesta = await fetch(rutaDeFuente(nombre), { cache: 'no-cache' });
	if (!respuesta.ok) throw new Error(`Sin ${nombre}: ${respuesta.status}`);
	return respuesta.arrayBuffer();
}

/** Spec §6: se reintenta al vencer la espera o al volver la red, sin recargar; sin red, solo al volver. */
function proximoIntento(esperaEnMs: number): Promise<void> {
	return new Promise((listo) => {
		const intentar = () => {
			clearTimeout(espera);
			window.removeEventListener('online', intentar);
			listo();
		};
		const espera = navigator.onLine ? setTimeout(intentar, esperaEnMs) : undefined;
		window.addEventListener('online', intentar);
	});
}

/**
 * Lo guardado o, si no, lo que se baje: reintenta hasta conseguirlo. Un archivo que no es
 * una fuente válida (la respuesta de otra ruta, por ejemplo) cuenta como falla y no se guarda.
 */
async function obtenerCara(familia: string, archivo: ArchivoDeFuente, avisar: (estado: EstadoDeFuente) => void): Promise<FontFace> {
	const guardada = await leerGuardada(familia, archivo);
	if (guardada) return guardada;
	avisar('sin-guardar');
	for (let espera = PRIMER_REINTENTO_EN_MS; ; espera = siguienteEspera(espera)) {
		try {
			const datos = await bajar(archivo);
			const cara = await crearCara(familia, archivo, datos);
			await guardar(archivo, datos);
			avisar('guardada');
			return cara;
		} catch {
			avisar('fallida');
			await proximoIntento(espera);
		}
	}
}

/**
 * Registra el juego entero de una vez: con un peso solo, el navegador lo usaría también
 * para los otros pesos, y el diseño cambiaría (spec §6). Avisa `lista` recién al poder dibujar.
 */
async function cargarJuego({ familia, archivos, sePuedeDibujar }: Juego, avisar: (estado: EstadoDeFuente) => void): Promise<void> {
	const estados = archivos.map((): EstadoDeFuente => 'guardada');
	const caras = await Promise.all(
		archivos.map((archivo, i) =>
			obtenerCara(familia, archivo, (estado) => {
				estados[i] = estado;
				avisar(resumenDeFuentes(estados));
			})
		)
	);
	// FontFaceSet es un Set de caras, aunque los tipos del DOM no lo digan.
	const registradas = document.fonts as unknown as Set<FontFace>;
	caras.forEach((cara) => registradas.add(cara));
	if (sePuedeDibujar()) return avisar('lista');
	caras.forEach((cara) => registradas.delete(cara));
	avisar('fallida');
}

export interface EstadoDeLasFuentes {
	atkinson: EstadoDeFuente;
	noto: EstadoDeFuente;
}

/**
 * Empieza a cargar la fuente y el juego y avisa cómo va cada uno. Dura lo que dure la
 * página: la descarga sigue aunque la pantalla de carga ya se haya ido (spec §6.6).
 */
export function cargarFuentes(alCambiar: (cambio: Partial<EstadoDeLasFuentes>) => void): void {
	let alcanceDeNoto = SOLO_EMOJI;
	const ajustarNoto = () =>
		document.fonts.forEach((cara) => {
			if (cara.family.includes(NOTO.familia)) cara.unicodeRange = alcanceDeNoto;
		});
	void cargarJuego(ATKINSON, (atkinson) => {
		if (atkinson === 'lista') alcanceDeNoto = TODO_EL_JUEGO;
		ajustarNoto();
		alCambiar({ atkinson });
	});
	void cargarJuego(NOTO, (noto) => {
		ajustarNoto();
		alCambiar({ noto });
	});
}
