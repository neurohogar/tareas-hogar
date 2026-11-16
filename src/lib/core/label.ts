// Spec §4.3: una etiqueta y las reglas de su nombre.

/** La paleta fija, en orden. La clave es también el nombre visible del color. */
export const PALETTE = ['gris', 'rojo', 'naranja', 'amarillo', 'verde', 'celeste', 'azul', 'violeta'] as const;

export type Color = (typeof PALETTE)[number];

export interface Label {
	id: string;
	name: string;
	color: Color;
}

/** Una etiqueta que todavía no se guardó: se crea al guardar la tarea (§6.2), y ahí recibe su id. */
export type NewLabel = Omit<Label, 'id'> & { id?: undefined };

export const MAX_NAME_LENGTH = 30;

export type NameError = 'vacio' | 'largo';

export type ValidatedName = { ok: true; name: string } | { ok: false; error: NameError };

/** Sin los espacios de los extremos, de 1 a 30 caracteres. */
export function validateName(typedOne: string): ValidatedName {
	const name = typedOne.trim();
	if (name === '') return { ok: false, error: 'vacio' };
	if ([...name].length > MAX_NAME_LENGTH) return { ok: false, error: 'largo' };
	return { ok: true, name };
}

/** Dos nombres son el mismo si coinciden sin distinguir mayúsculas (los acentos sí cuentan). */
export function sameName(a: string, b: string): boolean {
	return a.normalize('NFC').toLowerCase() === b.normalize('NFC').toLowerCase();
}
