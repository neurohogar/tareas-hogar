// Spec §6.2 (Action notice): what the notice for Pausar, Reanudar, Posponer
// and Quitar posponer offers with unsaved changes, and what each button runs.
// The notice is evaluated with the task and the now of the moment: the core does not read the clock.
// The actions themselves live in panel-action.ts.
import { changeOfAction, type PanelAction } from './panel-action';
import type { PanelForm } from './unsaved-changes';
import { CHANGES_MESSAGE, KEEP_EDITING, type ChangesNotice, type NoticeButton } from './unsaved-changes-notice';
import { editFromPanel } from './unsaved-changes-saved';
import type { EditingResult } from './editing';
import type { CreationErrors } from './creation';
import { applyChange, taskFromDocument, type TaskChange } from './task-document';
import { pauseAction } from './pause';
import { postponeAction } from './postponement-in-panel';
import type { Completion, Task } from './task';

/** What is needed to evaluate the notice of an action. */
export interface NoticeAction {
	action: PanelAction;
	/** The task the panel was opened with: what is written is measured against it (§7). */
	taskOnOpen: Task;
	/** The task as of now, with what another device wrote. */
	task: Task;
	completions: readonly Completion[];
	now: Date;
	form: PanelForm;
	/** Whether the minimal mode is on (§5.8). */
	minimalModeOn: boolean;
}

type ActionConditions = Pick<NoticeAction, 'action' | 'completions' | 'now' | 'minimalModeOn'>;

/** Spec §5.8, §5.9 and §6.2: the task meets the conditions under which the panel shows the action. */
function isShown({ action, completions, now, minimalModeOn }: ActionConditions, task: Task): boolean {
	if (action === 'pausar' || action === 'reanudar') return pauseAction(task, minimalModeOn) === action;
	return postponeAction(task, completions, now, minimalModeOn) === (action === 'quitar posponer' ? 'quitar' : 'posponer');
}

/** What Guardar would do with what is written, measured against the task as opened. */
function saveTyped({ taskOnOpen, form, now, minimalModeOn }: NoticeAction): EditingResult {
	return editFromPanel(taskOnOpen, form, now, minimalModeOn);
}

/** The task as of now with the change, as the server would apply it (§7). */
function savedTask(task: Task, change: TaskChange): Task {
	return taskFromDocument(applyChange([task], task.id, change)[0]);
}

const discard = (action: PanelAction): NoticeButton => ({ text: `Descartar y ${action}`, effect: 'descartar' });

/**
 * Spec §6.2: the notice with the task and the now of this moment. If the action no
 * longer applies, none: it closes and the panel stays with what is written. If what
 * is saved leaves it meaningless, it says so and does not offer Guardar; if what is
 * written is invalid there is no way to evaluate it, and it offers it.
 */
export function actionNotice(context: NoticeAction): ChangesNotice | undefined {
	const { action, task } = context;
	if (!isShown(context, task)) return undefined;
	const editing = saveTyped(context);
	if (editing.ok && !isShown(context, savedTask(task, editing.change)))
		return { message: `Con estos cambios la tarea ya no se puede ${action}`, buttons: [KEEP_EDITING, discard(action)] };
	return { message: CHANGES_MESSAGE, buttons: [KEEP_EDITING, discard(action), { text: `Guardar y ${action}`, effect: 'guardar' }] };
}

/** Spec §6.2: Descartar y <action> acts on the task as it is saved; if the action no longer applies, it does not act. */
export function discardAndAct(context: NoticeAction): TaskChange | undefined {
	return isShown(context, context.task) ? changeOfAction(context.action, context.now) : undefined;
}

export type SaveAndActResult =
	| { result: 'guardado'; change: TaskChange }
	| { result: 'rechazado'; errors: CreationErrors }
	| { result: 'aviso actualizado'; notice: ChangesNotice }
	| { result: 'aviso cerrado' };

/**
 * Spec §6.2: Guardar y <action> is evaluated again when tapped: if it no
 * longer applies, nothing is saved and nothing acts. If Guardar fails, nothing runs.
 * Otherwise, it saves and acts in a single change.
 */
export function saveAndAct(context: NoticeAction): SaveAndActResult {
	const notice = actionNotice(context);
	if (!notice) return { result: 'aviso cerrado' };
	if (!notice.buttons.some(({ effect }) => effect === 'guardar')) return { result: 'aviso actualizado', notice };
	const editing = saveTyped(context);
	if (!editing.ok) return { result: 'rechazado', errors: editing.errors };
	return { result: 'guardado', change: { ...editing.change, ...changeOfAction(context.action, context.now) } };
}
