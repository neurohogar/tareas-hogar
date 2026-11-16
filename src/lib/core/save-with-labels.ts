// Spec §6.2 y §4.3: guardar el panel con las etiquetas escritas. Las
// etiquetas nuevas se crean solo si se guarda: una creación o edición
// rechazada (por cualquier campo) no crea ninguna.
import type { CreationErrors } from './creation';
import { createFromData, type TaskData } from './task-data';
import type { TaskChange } from './task-document';
import { edit } from './editing';
import type { Label } from './label';
import { chooseLabels, saveChosen, type LabelChoice } from './typed-labels';
import { labelIds, type Task } from './task';

export interface LabelsOnSave {
	/** Las etiquetas que existen al guardar. */
	existings: readonly Label[];
	/** Da el id de cada etiqueta nueva. */
	newId: () => string;
}

type Rejection = { ok: false; errors: CreationErrors };
export type CreationWithLabels = { ok: true; task: Task; newLabels: Label[] } | Rejection;
export type EditingWithLabels = { ok: true; change: TaskChange; newLabels: Label[] } | Rejection;

/** Los errores de los otros campos junto con el de las etiquetas. */
function rejection(fields: { ok: true } | Rejection, choice: LabelChoice): Rejection {
	return {
		ok: false,
		errors: { ...(!fields.ok && fields.errors), ...(!choice.ok && { labels: choice.error }) }
	};
}

export function createWithLabels(
	data: TaskData,
	typedItems: readonly string[],
	id: string,
	now: Date,
	{ existings, newId }: LabelsOnSave
): CreationWithLabels {
	const creation = createFromData(data, id, now);
	const choice = chooseLabels(typedItems, existings);
	if (!creation.ok || !choice.ok) return rejection(creation, choice);
	const { ids, newLabels } = saveChosen(choice.chosenItems, newId);
	return { ok: true, task: ids.length > 0 ? { ...creation.task, labels: ids } : creation.task, newLabels };
}

const sameLabels = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id) => b.includes(id));

/**
 * Como `editar` (§6.2), y la tarea queda exactamente con las etiquetas
 * escritas. El campo etiquetas se escribe entero, y solo si cambió (§7).
 * `ahora`, el momento de guardar, reanuda la pausada que pasa a puntual (§5.8).
 */
export function editWithLabels(
	task: Task,
	data: TaskData,
	typedItems: readonly string[],
	{ existings, newId }: LabelsOnSave,
	now?: Date
): EditingWithLabels {
	const editing = edit(task, data, now);
	const choice = chooseLabels(typedItems, existings);
	if (!editing.ok || !choice.ok) return rejection(editing, choice);
	const { ids, newLabels } = saveChosen(choice.chosenItems, newId);
	const change = sameLabels(labelIds(task), ids) ? editing.change : { ...editing.change, labels: ids };
	return { ok: true, change, newLabels };
}
