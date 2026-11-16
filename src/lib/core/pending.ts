import { classifyInPending, type InPending } from './completed';
import { completionsOfTask, lastCompletedAt } from './completions';
import {
	compareCompleted,
	comparePaused,
	compareByUrgency,
	type CompletedRow,
	type RowToOrder
} from './pending-order';
import { asJustCreated } from './pause';
import { stepButtons, stepText, type StepButtons } from './current-step';
import type { Completion, Task } from './task';
import { dateText } from './task-date-text';
import { urgencyInstant } from './urgency';
import { minimalLine, type MinimalLine } from './minimal-version';

/**
 * Una fila de Pendientes; si está completada, se ve tachada y con el checkbox
 * marcado. textoDeFecha: «Tocaba …» o «Vuelve …», si la fila lo lleva (§6.1).
 * textoDePrimerPaso: la línea del paso en que va la tarea, «Primer paso: …» o
 * «Paso: …», y botonesDePaso, los de una tarea de dos pasos o más; los dos,
 * solo en las filas pendiente o atrasada (§6.1). minima: la línea «Mínima: …»
 * y si «Hice la mínima» está habilitado, en esas mismas filas.
 */
export type PendingRow = { task: Task; dateText?: string; firstStepText?: string; stepButtons?: StepButtons; minimal?: MinimalLine } & InPending;

/**
 * Spec §6.1: las filas de la lista Pendientes. Primero las no completadas,
 * ordenadas por urgencia; con Mostrar completadas encendido, después las
 * completadas, de la de completadoEn más reciente a la más antigua; con
 * Mostrar pausadas encendido, al final las pausadas (§5.8), por título.
 */
export function pendingRows(
	tasks: readonly Task[],
	completions: readonly Completion[],
	now: Date,
	showCompleted = false,
	showPaused = false
): PendingRow[] {
	const notCompleted: RowToOrder[] = [];
	const completedItems: CompletedRow[] = [];
	const pausedItems: Task[] = [];
	for (const task of tasks) {
		const { owns } = asJustCreated(task, completionsOfTask(completions, task.id));
		const inPending = classifyInPending(task, completions, now);
		if (inPending.status.kind === 'pausada') pausedItems.push(task);
		else if (inPending.completed) completedItems.push({ task, status: inPending.status, lastCompletedAt: lastCompletedAt(owns) });
		else notCompleted.push({ task, status: inPending.status, instant: urgencyInstant(task, completions, inPending.status, now) });
	}
	const withText = (task: Task, status: PendingRow['status']) => dateText(task, completions, status, now);
	const withStep = (task: Task, status: PendingRow['status']) => {
		const text = stepText(task, status);
		const buttons = stepButtons(task, status, completions, now);
		const minimal = minimalLine(task, status, completions, now);
		return { ...(text !== undefined && { firstStepText: text }), ...(buttons && { stepButtons: buttons }), ...(minimal && { minimal }) };
	};
	const rows = notCompleted
		.sort(compareByUrgency)
		.map(({ task, status }): PendingRow => ({ task, status, completed: false, dateText: withText(task, status), ...withStep(task, status) }));
	const atEnd = showCompleted
		? completedItems
				.sort(compareCompleted)
				.map(({ task, status }): PendingRow => ({ task, status, completed: true, dateText: withText(task, status) }))
		: [];
	const pausedAtEnd = showPaused
		? pausedItems.sort(comparePaused).map((task): PendingRow => ({ task, status: { kind: 'pausada' }, completed: false }))
		: [];
	return [...rows, ...atEnd, ...pausedAtEnd];
}
