// Los emojis recientes del selector (spec §6.2, §7): preferencia local del
// dispositivo, en el almacenamiento local del navegador. Si no está disponible
// (modo privado, datos bloqueados, valor dañado), la app sigue sin recientes.
import { addRecent, MAX_RECENT } from '#lib/core/recent-emojis.ts';

const CLAVE = 'tareas-hogar:emojis-recientes';

/** Los recientes guardados, del más reciente al más viejo; vacío si no se pueden leer. */
export function leerRecientes(): string[] {
	try {
		const guardado: unknown = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
		if (!Array.isArray(guardado)) return [];
		return guardado.filter((emoji): emoji is string => typeof emoji === 'string').slice(0, MAX_RECENT);
	} catch {
		return [];
	}
}

/** Suma el emoji elegido a los recientes, los guarda y devuelve la lista nueva (se guarde o no). */
export function recordarReciente(emoji: string): string[] {
	const recientes = addRecent(leerRecientes(), emoji);
	try {
		localStorage.setItem(CLAVE, JSON.stringify(recientes));
	} catch {
		// Sin almacenamiento, los recientes duran lo que dure la sesión del panel.
	}
	return recientes;
}
