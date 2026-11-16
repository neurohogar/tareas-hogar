// Spec §6.1: los chips de etiquetas de una fila.
import type { Label } from './label';
import { sortLabels } from './label-order';
import { labelIds, type Task } from './task';

/** Las etiquetas de la tarea en el orden de la §4.3; una referencia a una etiqueta borrada se ignora (§7). */
export function taskLabels(task: Task, labels: readonly Label[]): Label[] {
	const ids = labelIds(task);
	return sortLabels(labels.filter(({ id }) => ids.includes(id)));
}
