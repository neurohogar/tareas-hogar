// Spec §4.1: la nota, el primer paso, los pasos y la versión mínima son texto libre, sin largo máximo y nunca inválido.

/** Recorta el inicio y el final; vacía o solo espacios es sin texto (undefined). */
export function trimText(text: string): string | undefined {
	return text.trim() || undefined;
}
