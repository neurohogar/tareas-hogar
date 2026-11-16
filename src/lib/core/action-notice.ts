// Spec §6.2 (Aviso de acción): qué ofrece el aviso de Pausar, Reanudar, Posponer
// y Quitar posponer con cambios sin guardar, y qué ejecuta cada botón.
// El aviso se evalúa con la tarea y el ahora del momento: el core no lee el reloj.
// Las acciones mismas viven en accion-del-panel.ts.
import { changeOfAction, type PanelAction } from './panel-action';
import type { PanelForm } from './unsaved-changes';
import { CHANGES_MESSAGE, KEEP_EDITING, type ChangesNotice, type NoticeButton } from './unsaved-changes-notice';
import { editFromPanel } from './unsaved-changes-saved';
import type { CreationErrors } from './creation';
import { applyChange, taskFromDocument, type TaskChange } from './task-document';
import type { Label } from './label';
import type { EditingWithLabels } from './save-with-labels';
import { pauseAction } from './pause';
import { postponeAction } from './postponement-in-panel';
import type { Completion, Task } from './task';

/** Lo que hace falta para evaluar el aviso de una acción. */
export interface NoticeAction {
	action: PanelAction;
	/** La tarea con que se abrió el panel: contra ella se mide lo escrito (§7). */
	taskOnOpen: Task;
	/** La tarea de ahora, con lo que escribió otro dispositivo. */
	task: Task;
	completions: readonly Completion[];
	now: Date;
	form: PanelForm;
	/** Las etiquetas que existen ahora. */
	existings: readonly Label[];
}

type ActionConditions = Pick<NoticeAction, 'action' | 'completions' | 'now'>;

/** Spec §5.8, §5.9 y §6.2: la tarea cumple las condiciones con que el panel muestra la acción. */
function isShown({ action, completions, now }: ActionConditions, task: Task): boolean {
	if (action === 'pausar' || action === 'reanudar') return pauseAction(task) === action;
	return postponeAction(task, completions, now) === (action === 'quitar posponer' ? 'quitar' : 'posponer');
}

/** Lo que haría Guardar con lo escrito, medido contra la tarea al abrir. */
function saveTyped({ taskOnOpen, form, existings, now }: NoticeAction, newId: () => string): EditingWithLabels {
	return editFromPanel(taskOnOpen, form, { existings, newId }, now);
}

/** La tarea de ahora con el cambio, como la aplicaría el servidor (§7). */
function savedTask(task: Task, change: TaskChange): Task {
	return taskFromDocument(applyChange([task], task.id, change)[0]);
}

/** Evaluar el aviso no crea etiquetas: el id nunca se usa. */
const unusedId = () => '';

const discard = (action: PanelAction): NoticeButton => ({ text: `Descartar y ${action}`, effect: 'descartar' });

/**
 * Spec §6.2: el aviso con la tarea y el ahora de este momento. Si la acción ya
 * no corresponde, ninguno: se cierra y queda el panel con lo escrito. Si lo
 * guardado la deja sin sentido, lo dice y no ofrece Guardar; si lo escrito es
 * inválido no hay cómo evaluarlo, y lo ofrece.
 */
export function actionNotice(context: NoticeAction): ChangesNotice | undefined {
	const { action, task } = context;
	if (!isShown(context, task)) return undefined;
	const editing = saveTyped(context, unusedId);
	if (editing.ok && !isShown(context, savedTask(task, editing.change)))
		return { message: `Con estos cambios la tarea ya no se puede ${action}`, buttons: [KEEP_EDITING, discard(action)] };
	return { message: CHANGES_MESSAGE, buttons: [KEEP_EDITING, discard(action), { text: `Guardar y ${action}`, effect: 'guardar' }] };
}

/** Spec §6.2: Descartar y <acción> actúa sobre la tarea como está guardada; si la acción ya no corresponde, no actúa. */
export function discardAndAct(context: NoticeAction): TaskChange | undefined {
	return isShown(context, context.task) ? changeOfAction(context.action, context.now) : undefined;
}

export type SaveAndActResult =
	| { result: 'guardado'; change: TaskChange; newLabels: Label[] }
	| { result: 'rechazado'; errors: CreationErrors }
	| { result: 'aviso actualizado'; notice: ChangesNotice }
	| { result: 'aviso cerrado' };

/**
 * Spec §6.2: Guardar y <acción> se vuelve a evaluar al tocarlo: si ya no
 * corresponde, no se guarda ni se actúa. Si Guardar falla, no se ejecuta nada.
 * Si no, guarda y actúa en un solo cambio.
 */
export function saveAndAct(context: NoticeAction, newId: () => string): SaveAndActResult {
	const notice = actionNotice(context);
	if (!notice) return { result: 'aviso cerrado' };
	if (!notice.buttons.some(({ effect }) => effect === 'guardar')) return { result: 'aviso actualizado', notice };
	const editing = saveTyped(context, newId);
	if (!editing.ok) return { result: 'rechazado', errors: editing.errors };
	return { result: 'guardado', change: { ...editing.change, ...changeOfAction(context.action, context.now) }, newLabels: editing.newLabels };
}
