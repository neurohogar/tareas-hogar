// El check "Mostrar pausadas" de Pendientes (spec §6.1): preferencia local
// del dispositivo, en el almacenamiento local del navegador (no se sincroniza).
// Si no está disponible, vale lo que dure la sesión, desde el valor inicial.

const KEY = 'tareas-hogar:mostrar-pausadas';

/** El valor guardado; apagado (el valor inicial) si no hay uno o no se puede leer. */
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
		// Sin almacenamiento, el valor dura lo que dure la sesión.
	}
}
