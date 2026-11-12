// Spec §6.1 (Solo rápidas): se combina con el filtro por etiqueta.
import type { FilaDePendientes } from './pendientes';

/** Encendido, solo las tareas con esfuerzo rapida, en el mismo orden; apagado, la lista entera. */
export function filtrarSoloRapidas(filas: readonly FilaDePendientes[], encendido: boolean): FilaDePendientes[] {
	if (!encendido) return [...filas];
	return filas.filter(({ tarea }) => tarea.esfuerzo === 'rapida');
}

/** El texto de la lista vacía: con una etiqueta elegida manda la etiqueta; sin filtros, ninguno. */
export function textoDeListaVacia(etiquetaId: string | undefined, soloRapidas: boolean): string | undefined {
	if (etiquetaId !== undefined) return 'No hay tareas con esta etiqueta';
	return soloRapidas ? 'No hay tareas rápidas' : undefined;
}
