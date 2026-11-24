// The "Pausadas" item of the Pendientes menu (spec §6.1): a local
// device preference, kept in the browser's local storage (not synced).
// If it is not available, it holds for the session, from the initial value.

const KEY = 'tareas-hogar:mostrar-pausadas';

/** The saved value; off (the initial value) if there is none or it cannot be read. */
export function readShowPaused(): boolean {
	try {
		return localStorage.getItem(KEY) === 'true';
	} catch {
		return false;
	}
}

export function saveShowPaused(show: boolean): void {
	try {
		localStorage.setItem(KEY, String(show));
	} catch {
		// Without storage, the value holds for the session.
	}
}
