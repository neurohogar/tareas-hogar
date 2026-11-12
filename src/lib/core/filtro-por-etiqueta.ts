// Spec §6.1 (Filtro por etiqueta). El filtro elegido es el id de una etiqueta;
// sin id, "Todas".
import type { Etiqueta } from './etiqueta';
import type { FilaDePendientes } from './pendientes';
import { tieneEtiqueta } from './tarea';

/** Si la etiqueta elegida se borró (en este dispositivo o en otro), el filtro vuelve a "Todas". */
export function filtroVigente(elegida: string | undefined, etiquetas: readonly Etiqueta[]): string | undefined {
	return etiquetas.some(({ id }) => id === elegida) ? elegida : undefined;
}

/** "Todas" muestra la lista entera; una etiqueta, solo las tareas que la tienen, en el mismo orden. */
export function filtrarPorEtiqueta(filas: readonly FilaDePendientes[], etiquetaId: string | undefined): FilaDePendientes[] {
	if (etiquetaId === undefined) return [...filas];
	return filas.filter(({ tarea }) => tieneEtiqueta(tarea, etiquetaId));
}
