// Spec §6.1: los chips de etiquetas de una fila.
import type { Etiqueta } from './etiqueta';
import { ordenarEtiquetas } from './orden-de-etiquetas';
import { idsDeEtiquetas, type Tarea } from './tarea';

/** Las etiquetas de la tarea en el orden de la §4.3; una referencia a una etiqueta borrada se ignora (§7). */
export function etiquetasDeTarea(tarea: Tarea, etiquetas: readonly Etiqueta[]): Etiqueta[] {
	const ids = idsDeEtiquetas(tarea);
	return ordenarEtiquetas(etiquetas.filter(({ id }) => ids.includes(id)));
}
