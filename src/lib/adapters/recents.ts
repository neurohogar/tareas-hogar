// Los emojis recientes del selector (spec §6.2, §7): preferencia local del
// dispositivo, en el almacenamiento local del navegador. Si no está disponible
// (modo privado, datos bloqueados, valor dañado), la app sigue sin recientes.
import { addRecent, MAX_RECENT } from '#lib/core/recent-emojis.ts';

const KEY = 'tareas-hogar:emojis-recientes';

/** Los recientes guardados, del más reciente al más viejo; vacío si no se pueden leer. */
export function readRecents(): string[] {
	try {
		const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
		if (!Array.isArray(stored)) return [];
		return stored.filter((emoji): emoji is string => typeof emoji === 'string').slice(0, MAX_RECENT);
	} catch {
		return [];
	}
}

/** Suma el emoji elegido a los recientes, los guarda y devuelve la lista nueva (se guarde o no). */
export function rememberRecent(emoji: string): string[] {
	const recents = addRecent(readRecents(), emoji);
	try {
		localStorage.setItem(KEY, JSON.stringify(recents));
	} catch {
		// Sin almacenamiento, los recientes duran lo que dure la sesión del panel.
	}
	return recents;
}
