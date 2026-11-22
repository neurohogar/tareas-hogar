// Spec §6.2: Save from the panel or from a notice, with what the panel has written.
import type { PanelForm } from './unsaved-changes';
import type { CreationResult } from './creation';
import { createFromData } from './task-data';
import { edit, type EditingResult } from './editing';
import type { Task } from './task';

/** Spec §6.2: Save when editing, from the panel or a notice; `now` is the moment of saving (§5.8 for `minimalModeOn`). */
export function editFromPanel(task: Task, { data }: PanelForm, now: Date, minimalModeOn = false): EditingResult {
	return edit(task, data, now, minimalModeOn);
}

/** Spec §6.2: Save when creating, from the panel or the close notice. */
export function createFromPanel({ data }: PanelForm, id: string, now: Date): CreationResult {
	return createFromData(data, id, now);
}
