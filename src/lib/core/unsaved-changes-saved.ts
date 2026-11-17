// Spec §6.2: Guardar desde el panel o desde un aviso, con lo que tiene escrito el panel.
import type { PanelForm } from './unsaved-changes';
import type { CreationResult } from './creation';
import { createFromData } from './task-data';
import { edit, type EditingResult } from './editing';
import type { Task } from './task';

/** Spec §6.2: Guardar al editar, desde el panel o un aviso; `now` es el momento de guardar. */
export function editFromPanel(task: Task, { data }: PanelForm, now: Date): EditingResult {
	return edit(task, data, now);
}

/** Spec §6.2: Guardar al crear, desde el panel o el aviso de cierre. */
export function createFromPanel({ data }: PanelForm, id: string, now: Date): CreationResult {
	return createFromData(data, id, now);
}
