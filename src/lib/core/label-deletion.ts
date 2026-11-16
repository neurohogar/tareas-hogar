// Spec §4.3 (borrar una etiqueta) y §7 (Etiqueta borrada).
import type { Label } from './label';
import type { ReferencesChange } from './label-references';
import { labelIds, hasLabel, type Task } from './task';

/** Lo que se escribe al borrar: la etiqueta, y quitarla de las tareas que la tienen. */
export interface LabelDeletion {
	labelId: string;
	references: ReferencesChange[];
}

/** Borrar una etiqueta la quita de todas las tareas; las tareas no se borran. */
export function labelDeletion(labelId: string, tasks: readonly Task[]): LabelDeletion {
	return {
		labelId,
		references: tasks
			.filter((task) => hasLabel(task, labelId))
			.map(({ id }) => ({ taskId: id, remove: [labelId], put: [] }))
	};
}

/**
 * Las tareas que referencian etiquetas que ya no existen (otro dispositivo,
 * sin conexión, se las asignó después de borradas): esas referencias se
 * ignoran y se limpian, quitándolas.
 */
export function brokenReferences(tasks: readonly Task[], labels: readonly Label[]): ReferencesChange[] {
	const exists = (id: string) => labels.some((label) => label.id === id);
	return tasks.flatMap((task) => {
		const remove = labelIds(task).filter((id) => !exists(id));
		return remove.length > 0 ? [{ taskId: task.id, remove, put: [] }] : [];
	});
}
