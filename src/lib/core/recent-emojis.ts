// Spec §6.2 (Emoji, Recents): the last emojis chosen, from the most recent to the oldest.

export const MAX_RECENT = 16;

/** The recents list after choosing `emoji`: first, without repeating, with the cap. */
export function addRecent(recents: readonly string[], emoji: string): string[] {
	// The Set also cleans up repeats that a damaged stored list may carry.
	return [...new Set([emoji, ...recents])].slice(0, MAX_RECENT);
}
