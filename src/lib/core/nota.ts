// Spec §4.1: la nota es texto libre, sin largo máximo y nunca inválida.

/** Recorta el inicio y el final; vacía o solo espacios es sin nota (undefined). */
export function normalizarNota(texto: string): string | undefined {
	return texto.trim() || undefined;
}
