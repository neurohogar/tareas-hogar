// Spec §6.1 (Filtro por etiqueta). El filtro elegido es el id de una etiqueta;
// sin id, "Todas".
import type { Label } from './label';
import type { PendingRow } from './pending';
import { hasLabel } from './task';

/** Si la etiqueta elegida se borró (en este dispositivo o en otro), el filtro vuelve a "Todas". */
export function activeFilter(chosen: string | undefined, labels: readonly Label[]): string | undefined {
	return labels.some(({ id }) => id === chosen) ? chosen : undefined;
}

/** "Todas" muestra la lista entera; una etiqueta, solo las tareas que la tienen, en el mismo orden. */
export function filterByLabel(rows: readonly PendingRow[], labelId: string | undefined): PendingRow[] {
	if (labelId === undefined) return [...rows];
	return rows.filter(({ task }) => hasLabel(task, labelId));
}
