// Spec §6.2 (Emoji, Recientes): los últimos emojis elegidos, del más reciente al más viejo.

export const MAXIMO_DE_RECIENTES = 16;

/** La lista de recientes después de elegir `emoji`: primero, sin repetirse, con el tope. */
export function agregarReciente(recientes: readonly string[], emoji: string): string[] {
	// El Set también limpia repetidos que traiga una lista guardada dañada.
	return [...new Set([emoji, ...recientes])].slice(0, MAXIMO_DE_RECIENTES);
}
