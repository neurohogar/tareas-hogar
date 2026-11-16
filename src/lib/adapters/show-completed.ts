// El check "Mostrar completadas" de Pendientes (spec §6.1): preferencia local
// del dispositivo, en el almacenamiento local del navegador (no se sincroniza).
// Si no está disponible, vale lo que dure la sesión, desde el valor inicial.

const KEY = 'tareas-hogar:mostrar-completadas';

/** El valor guardado; apagado (el valor inicial) si no hay uno o no se puede leer. */
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
		// Sin almacenamiento, el valor dura lo que dure la sesión.
	}
}
