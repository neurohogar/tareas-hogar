// Spec §6.2 (Emoji, Recientes): los últimos emojis elegidos, del más reciente al más viejo.

export const MAX_RECENT = 16;

/** La lista de recientes después de elegir `emoji`: primero, sin repetirse, con el tope. */
export function addRecent(recents: readonly string[], emoji: string): string[] {
	// El Set también limpia repetidos que traiga una lista guardada dañada.
	return [...new Set([emoji, ...recents])].slice(0, MAX_RECENT);
}
