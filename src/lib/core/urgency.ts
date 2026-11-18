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

/** A due day (due date or N) counts from its 00:00; overdue, from 00:00 of the next day. */
const fromDay = (day: Date, overdue: boolean) => (overdue ? addDays(day, 1) : day);

function instantWithoutSchedule(task: Task, ofTheTask: readonly Completion[], status: PendingStatus): Date | undefined {
	const overdue = status.kind === 'atrasada';
	if (task.kind === 'puntual') return task.dueDate && fromDay(task.dueDate, overdue);
	const { recurrence } = task;
	if (recurrence.mode === 'relativo') return relativeUrgencyInstant(recurrence, task.createdAt, ofTheTask, status);
	return fromDay(nextOccurrence(recurrence, task.createdAt, ofTheTask), overdue);
}

/**
 * Spec §6.1: the instant that orders the task within its group. Overdue:
 * since when it is overdue; pending: since when it is pending; waiting:
 * when it returns to pending. A pending one-off without a due date
 * has no instant (it goes at the end of its group). With a schedule, those of §5.5–§5.7.
 * Of a resumed task, as just created at resumedAt (§5.8). Waiting because of a
 * postponement, it returns at to (§5.9).
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
