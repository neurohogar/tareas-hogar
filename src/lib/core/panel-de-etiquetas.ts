// Spec §6.2 (Etiquetas en el panel): autocompletado y agregar lo escrito. El
// panel guarda los nombres elegidos; se resuelven a etiquetas al guardar.
import { mismoNombre, validarNombre, type Etiqueta, type NombreValidado } from './etiqueta';
import { ordenarEtiquetas } from './orden-de-etiquetas';

const MARCAS_DIACRITICAS = /[̀-ͯ]/g;

/** Para buscar: sin mayúsculas ni acentos (la ñ coincide con la n). */
const plano = (texto: string) => texto.normalize('NFD').replace(MARCAS_DIACRITICAS, '').toLowerCase();

export interface Sugerencias {
	etiquetas: Etiqueta[];
	/** «Crear "x"»: lo escrito, si ninguna existente se llama así. */
	crear?: string;
}

/**
 * Las existentes cuyo nombre contiene lo escrito (sin distinguir mayúsculas ni
 * acentos), sin las ya elegidas, en el orden de la §4.3; y crear lo escrito si
 * ninguna existente coincide exactamente (sin distinguir mayúsculas).
 */
export function sugerencias(escrito: string, existentes: readonly Etiqueta[], elegidas: readonly string[]): Sugerencias {
	const texto = escrito.trim();
	if (texto === '') return { etiquetas: [] };
	const yaElegida = (etiqueta: Etiqueta) => elegidas.some((nombre) => mismoNombre(nombre, etiqueta.nombre));
	const etiquetas = ordenarEtiquetas(existentes.filter((etiqueta) => plano(etiqueta.nombre).includes(plano(texto)) && !yaElegida(etiqueta)));
	const existe = existentes.some((etiqueta) => mismoNombre(etiqueta.nombre, texto));
	return existe ? { etiquetas } : { etiquetas, crear: texto };
}

export type Agregado = { ok: true; nombres: string[] } | Extract<NombreValidado, { ok: false }>;

/**
 * Agregar lo escrito (Enter o elegir una sugerencia): la existente con ese
 * nombre (sin distinguir mayúsculas) o una nueva. Una que ya está no se repite.
 * Vacío o solo espacios no agrega nada ni es un error (no ofrece crear); un
 * nombre de más de 30 caracteres se rechaza.
 */
export function agregarEscrita(escrito: string, existentes: readonly Etiqueta[], elegidas: readonly string[]): Agregado {
	const validado = validarNombre(escrito);
	if (!validado.ok) return validado.error === 'vacio' ? { ok: true, nombres: [...elegidas] } : validado;
	const nombre = existentes.find((etiqueta) => mismoNombre(etiqueta.nombre, validado.nombre))?.nombre ?? validado.nombre;
	const repetida = elegidas.some((elegida) => mismoNombre(elegida, nombre));
	return { ok: true, nombres: repetida ? [...elegidas] : [...elegidas, nombre] };
}

/** Quitar un chip: el nombre elegido que es esa etiqueta (sin distinguir mayúsculas, como al agregarla). */
export function quitarElegida(nombre: string, elegidas: readonly string[]): string[] {
	return elegidas.filter((elegida) => !mismoNombre(elegida, nombre));
}
