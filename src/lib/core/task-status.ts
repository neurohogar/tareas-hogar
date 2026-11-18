import { completionsOfTask } from './completions';
import type { Status } from './status';
import { recurringStatusWithSchedule, oneOffStatusWithSchedule } from './status-with-schedule';
import { recurringCalendarStatus } from './recurring-calendar-status';
import { recurringRelativeStatus } from './recurring-relative-status';
import { oneOffStatus } from './one-off-status';
import { asJustCreated, isPaused } from './pause';
import { deadlinesWithSchedule } from './deadlines-with-schedule';
import { withPostponement, pendingOrOverdue, activePostponement } from './active-postponement';
import type { Completion, Postponement, Task } from './task';

function statusWithoutSchedule(task: Task, ofTheTask: readonly Completion[], now: Date): Status {
	if (task.kind === 'puntual') return oneOffStatus(task.dueDate, ofTheTask, now);
	const { recurrence } = task;
	if (recurrence.mode === 'relativo') return recurringRelativeStatus(recurrence, ofTheTask, now);
	return recurringCalendarStatus(recurrence, task.createdAt, ofTheTask, now);
}

/**
 * Derived status of a task (spec §3) from all the completions
 * of the user: it picks those of the task and applies the rule of its kind and its
 * recurrence; with a schedule, that of §5.5–§5.7. A paused one has no status and a
 * resumed one is evaluated as just created at resumedAt (§5.8). On that status
 * the postponement is applied (§5.9). It is the only entry point of the status.
 */
export function taskStatus(saved: Task, completions: readonly Completion[], now: Date): Status {
	return withPostponement(statusByItsRule(saved, completions, now), saved, now);
}

/**
 * Spec §5.9: the postponement that has the task waiting; none if it is not
 * postponed or if it is waiting by its own rule (nothing changes there).
 */
export function waitForPostponement(saved: Task, completions: readonly Completion[], now: Date): Postponement | undefined {
	const active = activePostponement(saved, now);
	return active && pendingOrOverdue(statusByItsRule(saved, completions, now)) ? active : undefined;
}

/** The status of §5.1–§5.8, without the postponement. */
function statusByItsRule(saved: Task, completions: readonly Completion[], now: Date): Status {
	if (isPaused(saved)) return { kind: 'pausada' };
	const { task, owns: ofTheTask } = asJustCreated(saved, completionsOfTask(completions, saved.id));
	const { schedule } = task;
	if (!schedule) return statusWithoutSchedule(task, ofTheTask, now);
	if (task.kind === 'puntual') return oneOffStatusWithSchedule({ ...task, schedule }, ofTheTask, now);
	return recurringStatusWithSchedule(deadlinesWithSchedule(task, schedule, ofTheTask), now);
}
