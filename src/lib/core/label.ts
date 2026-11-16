// Spec §4.3: una etiqueta y las reglas de su nombre.

/** La paleta fija, en orden. La clave es también el nombre visible del color. */
export const PALETA = ['gris', 'rojo', 'naranja', 'amarillo', 'verde', 'celeste', 'azul', 'violeta'] as const;

export type Color = (typeof PALETA)[number];

export interface Etiqueta {
	id: string;
	nombre: string;
	color: Color;
}

/** Una etiqueta que todavía no se guardó: se crea al guardar la tarea (§6.2), y ahí recibe su id. */
export type EtiquetaNueva = Omit<Etiqueta, 'id'> & { id?: undefined };

export const LARGO_MAXIMO_DEL_NOMBRE = 30;

export type ErrorDeNombre = 'vacio' | 'largo';

export type NombreValidado = { ok: true; nombre: string } | { ok: false; error: ErrorDeNombre };

/** Sin los espacios de los extremos, de 1 a 30 caracteres. */
export function validarNombre(escrito: string): NombreValidado {
	const nombre = escrito.trim();
	if (nombre === '') return { ok: false, error: 'vacio' };
	if ([...nombre].length > LARGO_MAXIMO_DEL_NOMBRE) return { ok: false, error: 'largo' };
	return { ok: true, nombre };
}

/** Dos nombres son el mismo si coinciden sin distinguir mayúsculas (los acentos sí cuentan). */
export function mismoNombre(a: string, b: string): boolean {
	return a.normalize('NFC').toLowerCase() === b.normalize('NFC').toLowerCase();
}
