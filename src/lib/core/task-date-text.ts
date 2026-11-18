// Spec §6.1: what date text and distance the row of a task carries, according to the
// status the core already gave (it does not recompute it: §6.1 only changes texts).
import type { Status } from './status';
import type { Completion, Task } from './task';
import { datePhrase } from './date-text';
import { dueInstant, returnInstant } from './date-text-instants';

/**
 * Spec §6.1: an overdue one, «Tocaba …»; a waiting one (also a completed recurring
 * task or a postponed one), «Vuelve …». A pending one, a paused one and a completed
 * one-off carry no date text (undefined).
 */
export function dateText(task: Task, completions: readonly Completion[], status: Status, now: Date): string | undefined {
	if (status.kind === 'en espera') return datePhrase('Vuelve', returnInstant(task, completions, status, now), now);
	if (status.kind !== 'atrasada') return undefined;
	const wasDue = dueInstant(task, completions, now);
	return wasDue && datePhrase('Tocaba', wasDue, now);
}
