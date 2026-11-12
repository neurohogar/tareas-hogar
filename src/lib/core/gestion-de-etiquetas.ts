// Spec §6.4 (renombrar y cambiar color) y §7 (conflictos de etiquetas).
import { mismoNombre, validarNombre, type Color, type ErrorDeNombre, type Etiqueta } from './etiqueta';

/** Un cambio parcial de una etiqueta: nombre y color son campos independientes (§7). */
export interface CambioDeEtiqueta {
	nombre?: string;
	color?: Color;
}

export type ErrorDeRenombrado = ErrorDeNombre | 'repetido';

export type ResultadoDeRenombrado = { ok: true; cambio: CambioDeEtiqueta } | { ok: false; error: ErrorDeRenombrado };

/** Valida como al crear; se rechaza si otra etiqueta ya tiene ese nombre (sin distinguir mayúsculas). */
export function renombrar(etiqueta: Etiqueta, escrito: string, etiquetas: readonly Etiqueta[]): ResultadoDeRenombrado {
	const validado = validarNombre(escrito);
	if (!validado.ok) return validado;
	const { nombre } = validado;
	const repetido = etiquetas.some((otra) => otra.id !== etiqueta.id && mismoNombre(otra.nombre, nombre));
	return repetido ? { ok: false, error: 'repetido' } : { ok: true, cambio: { nombre } };
}

/** Como lo aplica el servidor: gana el último cambio por campo; si la etiqueta ya no existe, se descarta. */
export function aplicarCambioDeEtiqueta(etiquetas: readonly Etiqueta[], etiquetaId: string, cambio: CambioDeEtiqueta): Etiqueta[] {
	return etiquetas.map((etiqueta) => (etiqueta.id === etiquetaId ? { ...etiqueta, ...cambio } : etiqueta));
}
