// Spec §6.1 (Solo rápidas): se combina con el filtro por etiqueta.
import type { PendingRow } from './pending';

/** Encendido, solo las tareas con esfuerzo rapida, en el mismo orden; apagado, la lista entera. */
export function filterQuickOnly(rows: readonly PendingRow[], on: boolean): PendingRow[] {
	if (!on) return [...rows];
	return rows.filter(({ task }) => task.effort === 'rapida');
}

/** El texto de la lista vacía: con una etiqueta elegida manda la etiqueta; sin filtros, ninguno. */
export function emptyListText(labelId: string | undefined, quickOnly: boolean): string | undefined {
	if (labelId !== undefined) return 'No hay tareas con esta etiqueta';
	return quickOnly ? 'No hay tareas rápidas' : undefined;
}
