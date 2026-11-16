// Spec §7 (Etiquetas duplicadas): dos dispositivos sin conexión crean o
// renombran etiquetas a un mismo nombre (sin distinguir mayúsculas).
import { compareIds } from './compare-ids';
import { sameName, type Label } from './label';
import type { ReferencesChange } from './label-references';
import { labelIds, type Task } from './task';

/** Lo que se escribe al fusionar: las etiquetas que se borran y, en cada tarea afectada, cuáles se reemplazan por cuál. */
export interface LabelMerge {
	deletedItems: string[];
	references: ReferencesChange[];
}

/** La de id menor entre las que tienen el mismo nombre que esta (ella incluida). */
function survivor(label: Label, labels: readonly Label[]): string {
	return labels
		.filter((other) => sameName(other.name, label.name))
		.map(({ id }) => id)
		.sort(compareIds)[0];
}

/**
 * Sobrevive la de id menor, con su nombre y su color; las tareas que tenían
 * la otra pasan a tener la sobreviviente (sin repetirla), y la otra se borra.
 */
export function mergeOfDuplicates(labels: readonly Label[], tasks: readonly Task[]): LabelMerge {
	const destination = new Map<string, string>();
	for (const label of labels) {
		const id = survivor(label, labels);
		if (id !== label.id) destination.set(label.id, id);
	}
	const references = tasks.flatMap((task) => {
		const remove = labelIds(task).filter((id) => destination.has(id));
		return remove.length > 0 ? [{ taskId: task.id, remove, put: [...new Set(remove.map((id) => destination.get(id) as string))] }] : [];
	});
	return { deletedItems: [...destination.keys()], references };
}
