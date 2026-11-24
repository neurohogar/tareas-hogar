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
import { isEssential } from './essential';

/**
 * A Pending row; if it is completed (always recurring), it is shown struck through and with the checkbox
 * checked. dateText: «Tocaba …» or «Vuelve …», if the row carries it (§6.1).
 * firstStepText: the line of the step the task is on, «Primer paso: …» or
 * «Paso: …», and stepButtons, those of a task with two steps or more; both,
 * only on pending or overdue rows (§6.1). minimal: the line «Mínima: …»
 * and whether «Hice la mínima» is enabled, on those same rows.
 */
export type PendingRow = { task: Task; dateText?: string; firstStepText?: string; stepButtons?: StepButtons; minimal?: MinimalLine } & InPending;

/**
 * Spec §6.1: the rows of the Pending list. First the non-completed ones,
 * ordered by urgency; with Mostrar completadas on, then the completed recurring
 * ones, from the one with the most recent completedAt to the oldest (a completed
 * one-off is never a row, on or off, §5.1); with
 * Mostrar pausadas on, at the end the paused ones (§5.8), by title. With the
 * minimal mode on, only the essential tasks, with the same rules (§6.1).
 */
export function pendingRows(
	tasks: readonly Task[],
	completions: readonly Completion[],
	now: Date,
	showCompleted = false,
	showPaused = false,
	minimalModeOn = false
): PendingRow[] {
	const notCompleted: RowToOrder[] = [];
	const completedItems: CompletedRow[] = [];
	const pausedItems: Task[] = [];
	for (const task of minimalModeOn ? tasks.filter(isEssential) : tasks) {
		const { owns } = asJustCreated(task, completionsOfTask(completions, task.id));
		const inPending = classifyInPending(task, completions, now);
		if (inPending.status.kind === 'pausada') pausedItems.push(task);
		else if (inPending.completed) {
			if (task.kind === 'periodica') completedItems.push({ task, status: inPending.status, lastCompletedAt: lastCompletedAt(owns) });
		}
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
