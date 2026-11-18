// The picker's recent emojis (spec §6.2, §7): a local device preference, kept in the
// browser's local storage. If it is not available (private mode, blocked data, a corrupt
// value), the app simply runs without recents.
import { addRecent, MAX_RECENT } from '#lib/core/recent-emojis.ts';

const KEY = 'tareas-hogar:emojis-recientes';

/** The saved recents, most recent first; empty if they cannot be read. */
export function readRecents(): string[] {
	try {
		const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
		if (!Array.isArray(stored)) return [];
		return stored.filter((emoji): emoji is string => typeof emoji === 'string').slice(0, MAX_RECENT);
	} catch {
		return [];
	}
}

/** Adds the chosen emoji to the recents, saves them and returns the new list (whether or not it was saved). */
export function rememberRecent(emoji: string): string[] {
	const recents = addRecent(readRecents(), emoji);
	try {
		localStorage.setItem(KEY, JSON.stringify(recents));
	} catch {
		// Without storage, the recents last only as long as the panel session.
	}
	return recents;
}
