import { occurrenceThatCovers, lastCoveredOccurrence } from './covered-occurrence';
import { calendarOccurrenceThatCovers, windowOccurrenceThatCovers, completesByWindow } from './occurrences-with-schedule';
import { stepItIsOn, hasSeveralSteps } from './steps';
import { asJustCreated } from './pause';
import type { Completion, CoveredOccurrence, Task, RecurringTask } from './task';

/**
 * The occurrence that a completion of a recurring task covers, or undefined if it
 * covers none: for calendar, a day (§5.3) or, with a schedule, the start of an
 * occurrence (§5.6); for relative, only if completed by window (§5.7).
 */
function occurrenceOf({ recurrence, createdAt, schedule, resumedAt }: RecurringTask, owns: Completion[], now: Date): CoveredOccurrence | undefined {
	if (recurrence.mode === 'relativo') {
		if (!schedule || !completesByWindow(recurrence, schedule)) return undefined;
		return { start: windowOccurrenceThatCovers(recurrence, schedule, createdAt, owns, now) };
	}
	if (schedule) return { start: calendarOccurrenceThatCovers(recurrence, schedule, createdAt, owns, now, resumedAt) };
	return occurrenceThatCovers(recurrence, lastCoveredOccurrence(createdAt, owns), now);
}

/**
 * Spec §4.4: completing adds a new record; it never modifies the earlier ones.
 * It saves the occurrence it covers, if it covers one, according to what the
 * completions of the task already covered (among all those of the user); for a resumed one,
 * as just created at resumedAt (§5.8). For a task with two steps or more,
 * it saves the step it was on (§4.1, Pasos: Completar). With «Hice la mínima»
 * (`wasMinimal`), the completion remembers it; a full one does not carry the field.
 */
export function complete(saved: Task, completions: readonly Completion[], id: string, now: Date, wasMinimal = false): Completion {
	const completion: Completion = { id, taskId: saved.id, completedAt: now, ...stepAtCompletion(saved), ...(wasMinimal && { wasMinimal }) };
	const { task, owns } = asJustCreated(saved, completionsOfTask(completions, saved.id));
	if (task.kind === 'puntual') return completion;
	const coveredOccurrence = occurrenceOf(task, owns, now);
	return coveredOccurrence ? { ...completion, coveredOccurrence } : completion;
}

/** Spec §4.4: stepAtCompletion, only on tasks with two steps or more. */
function stepAtCompletion(task: Task) {
	return hasSeveralSteps(task) ? { stepAtCompletion: stepItIsOn(task) } : {};
}

/** The one with the greatest completedAt (on a tie, the first); completions cannot be empty. */
export function latestCompletion(completions: readonly Completion[]): Completion {
	return completions.reduce((mostRecent, completion) =>
		completion.completedAt.getTime() > mostRecent.completedAt.getTime() ? completion : mostRecent
	);
}

/** The start of waiting of a recurring task (§5.3, §5.5): the most recent completedAt or, without completions, createdAt; in ms. */
export function waitStart(createdAt: Date, completions: readonly Completion[]): number {
	return completions.length === 0 ? createdAt.getTime() : lastCompletedAt(completions);
}

/** The most recent completedAt, in ms; completions cannot be empty. */
export function lastCompletedAt(completions: readonly Completion[]): number {
	return latestCompletion(completions).completedAt.getTime();
}

export function completionsOfTask(completions: readonly Completion[], taskId: string): Completion[] {
	return completions.filter((completion) => completion.taskId === taskId);
}
