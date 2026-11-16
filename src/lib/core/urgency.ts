import { completionsOfTask } from './completions';
import { addDays } from './days';
import type { PendingStatus } from './status';
import { recurringInstantWithSchedule, oneOffInstantWithSchedule } from './status-with-schedule';
import { waitForPostponement } from './task-status';
import { nextOccurrence } from './recurring-calendar-status';
import { relativeUrgencyInstant } from './recurring-relative-status';
import { asJustCreated } from './pause';
import { deadlinesWithSchedule } from './deadlines-with-schedule';
import type { Completion, Task } from './task';

/** Un día límite (fecha límite o N) cuenta desde sus 00:00; atrasado, desde las 00:00 del día siguiente. */
const fromDay = (day: Date, overdue: boolean) => (overdue ? addDays(day, 1) : day);

function instantWithoutSchedule(task: Task, ofTheTask: readonly Completion[], status: PendingStatus): Date | undefined {
	const overdue = status.kind === 'atrasada';
	if (task.kind === 'puntual') return task.dueDate && fromDay(task.dueDate, overdue);
	const { recurrence } = task;
	if (recurrence.mode === 'relativo') return relativeUrgencyInstant(recurrence, task.createdAt, ofTheTask, status);
	return fromDay(nextOccurrence(recurrence, task.createdAt, ofTheTask), overdue);
}

/**
 * Spec §6.1: el instante que ordena la tarea dentro de su grupo. Atrasada:
 * desde cuándo está atrasada; pendiente: desde cuándo está pendiente; en
 * espera: cuándo vuelve a pendiente. Una puntual pendiente sin fecha límite
 * no tiene instante (va al final de su grupo). Con horario, los de §5.5–§5.7.
 * De una reanudada, como recién creada en reanudadaEn (§5.8). En espera por una
 * posposición, vuelve en hasta (§5.9).
 */
export function urgencyInstant(
	saved: Task,
	completions: readonly Completion[],
	status: PendingStatus,
	now: Date
): Date | undefined {
	const postponement = waitForPostponement(saved, completions, now);
	if (postponement) return postponement.to;
	const { task, owns: ofTheTask } = asJustCreated(saved, completionsOfTask(completions, saved.id));
	const { schedule } = task;
	if (!schedule) return instantWithoutSchedule(task, ofTheTask, status);
	if (task.kind === 'puntual') return oneOffInstantWithSchedule({ ...task, schedule }, status, now);
	return recurringInstantWithSchedule(deadlinesWithSchedule(task, schedule, ofTheTask), status);
}
