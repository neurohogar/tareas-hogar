// Spec §6.2 (Cambios sin guardar): Guardar con texto sin confirmar en Etiquetas.
// Guardar no crea esa etiqueta, pero un nombre inválido lo hace fallar.
import type { PanelForm } from './unsaved-changes';
import type { CreationErrors } from './creation';
import { validateName, type NameError } from './label';
import { createWithLabels, editWithLabels, type CreationWithLabels, type EditingWithLabels, type LabelsOnSave } from './save-with-labels';
import type { Task } from './task';

/** Spec §6.2 y §4.3: el nombre inválido escrito sin confirmar; vacío o solo espacios no es un nombre. */
function unconfirmedError(unconfirmed: string): NameError | undefined {
	const validated = validateName(unconfirmed);
	return validated.ok || validated.error === 'vacio' ? undefined : validated.error;
}

/** El resultado de Guardar, o el rechazo que suma el error del texto sin confirmar. */
function withUnconfirmed<R extends CreationWithLabels | EditingWithLabels>(result: R, unconfirmed: string): R | { ok: false; errors: CreationErrors } {
	const labels = unconfirmedError(unconfirmed);
	if (!labels) return result;
	return { ok: false, errors: { ...(!result.ok && result.errors), labels } };
}

/** Spec §6.2: Guardar al editar, desde el panel o un aviso; `ahora` es el momento de guardar. */
export function editFromPanel(task: Task, { data, labels, unconfirmed }: PanelForm, onSave: LabelsOnSave, now: Date): EditingWithLabels {
	return withUnconfirmed(editWithLabels(task, data, [...labels], onSave, now), unconfirmed);
}

/** Spec §6.2: Guardar al crear, desde el panel o el aviso de cierre. */
export function createFromPanel({ data, labels, unconfirmed }: PanelForm, id: string, now: Date, onSave: LabelsOnSave): CreationWithLabels {
	return withUnconfirmed(createWithLabels(data, [...labels], id, now, onSave), unconfirmed);
}
