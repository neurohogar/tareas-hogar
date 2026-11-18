// The "Mostrar completadas" check of Pendientes (spec §6.1): a local
// device preference, kept in the browser's local storage (not synced).
// If it is not available, it holds for the session, from the initial value.

const KEY = 'tareas-hogar:mostrar-completadas';

/** The saved value; off (the initial value) if there is none or it cannot be read. */
export function readShowCompleted(): boolean {
	try {
		return localStorage.getItem(KEY) === 'true';
	} catch {
		return false;
	}
}

export function saveShowCompleted(show: boolean): void {
	try {
		localStorage.setItem(KEY, String(show));
	} catch {
		// Without storage, the value holds for the session.
	}
}
