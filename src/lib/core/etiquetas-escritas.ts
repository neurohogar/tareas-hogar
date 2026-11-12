// Spec §4.3 (Creación) y §6.2: los nombres de etiqueta que se escriben en el
// panel, resueltos a etiquetas existentes o nuevas. Las nuevas se crean al
// guardar la tarea.
import { colorMenosUsado } from './color-de-etiqueta';
import { mismoNombre, validarNombre, type ErrorDeNombre, type Etiqueta, type EtiquetaNueva } from './etiqueta';

/** Una existente (con id) o una que se crea al guardar (sin id). */
export type EtiquetaElegida = Etiqueta | EtiquetaNueva;

export type EleccionDeEtiquetas = { ok: true; elegidas: EtiquetaElegida[] } | { ok: false; error: ErrorDeNombre };

const esNueva = (elegida: EtiquetaElegida): elegida is EtiquetaNueva => elegida.id === undefined;

/**
 * En el orden escrito: un nombre que ya existe (sin distinguir mayúsculas) usa
 * esa etiqueta; uno repetido queda una sola vez, con el primero escrito; uno
 * nuevo toma el color menos usado contando las existentes y las nuevas
 * anteriores. Un nombre inválido rechaza todo.
 */
export function elegirEtiquetas(escritas: readonly string[], existentes: readonly Etiqueta[]): EleccionDeEtiquetas {
	const elegidas: EtiquetaElegida[] = [];
	for (const escrita of escritas) {
		const validado = validarNombre(escrita);
		if (!validado.ok) return validado;
		const { nombre } = validado;
		if (elegidas.some((elegida) => mismoNombre(elegida.nombre, nombre))) continue;
		const colores = [...existentes, ...elegidas.filter(esNueva)].map(({ color }) => color);
		const nueva = { nombre, color: colorMenosUsado(colores) };
		// La nueva coincide siempre: queda al final, así que gana la existente si la hay.
		elegidas.push([...existentes, nueva].find((etiqueta) => mismoNombre(etiqueta.nombre, nombre))!);
	}
	return { ok: true, elegidas };
}

/** Las elegidas al guardar: las nuevas reciben id. */
export function guardarElegidas(elegidas: readonly EtiquetaElegida[], nuevoId: () => string): { ids: string[]; nuevas: Etiqueta[] } {
	const nuevas: Etiqueta[] = [];
	const ids = elegidas.map((elegida) => {
		if (!esNueva(elegida)) return elegida.id;
		const nueva = { ...elegida, id: nuevoId() };
		nuevas.push(nueva);
		return nueva.id;
	});
	return { ids, nuevas };
}
