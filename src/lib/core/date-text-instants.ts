// Spec §6.1 (Fecha y distancia): the instants named by «Tocaba …» (since
// when an overdue task is due) and «Vuelve …» (when a waiting one returns to pending).
import { completionsOfTask } from './completions';
import type { Status } from './status';
import { nextOccurrence } from './recurring-calendar-status';
import { relativeUrgencyInstant } from './recurring-relative-status';
import { asJustCreated } from './pause';
import { deadlinesWithSchedule } from './deadlines-with-schedule';
import { activePostponement } from './active-postponement';
import type { Completion, Task } from './task';
import { urgencyInstant } from './urgency';

export type WaitingStatus = Extract<Status, { kind: 'en espera' }>;

/** Without a schedule: the due date, V (or createdAt, never completed) or 00:00 of N. */
function wasDueWithoutSchedule(task: Task, ofTheTask: readonly Completion[]): Date | undefined {
	if (task.kind === 'puntual') return task.dueDate;
	const { recurrence } = task;
	if (recurrence.mode === 'relativo') return relativeUrgencyInstant(recurrence, task.createdAt, ofTheTask, { kind: 'pendiente' });
	return nextOccurrence(recurrence, task.createdAt, ofTheTask);
}

/**
 * Spec §6.1: since when the task is due. One-off: the day of the due date,
 * with or without a schedule (without a due date, none). Relative: V. Calendar: the
 * day of N. A recurring task with a schedule, A, unless A has not arrived yet:
 * then, the instant without schedule (never a future instant). For a resumed one,
 * as just created (§5.8).
 */
export function dueInstant(saved: Task, completions: readonly Completion[], now: Date): Date | undefined {
	const { task, owns } = asJustCreated(saved, completionsOfTask(completions, saved.id));
	const withoutSchedule = wasDueWithoutSchedule(task, owns);
	if (task.kind === 'puntual' || !task.schedule) return withoutSchedule;
	const { available } = deadlinesWithSchedule(task, task.schedule, owns);
	return available <= now.getTime() ? new Date(available) : withoutSchedule;
}

/**
 * Spec §6.1: when a waiting task returns to pending, the same instant that
 * orders it (relative, V; calendar, 00:00 of N; with a schedule, A; postponed,
 * to). If a postponement and its own rule both have it waiting, the later one.
 */
export function returnInstant(task: Task, completions: readonly Completion[], status: WaitingStatus, now: Date): Date {
	// A waiting task always has an instant: that of its rule or, if only the postponement has it waiting, its to.
	const byItsRule = urgencyInstant(task, completions, status, now) as Date;
	const to = activePostponement(task, now)?.to;
	return to ? new Date(Math.max(to.getTime(), byItsRule.getTime())) : byItsRule;
}
