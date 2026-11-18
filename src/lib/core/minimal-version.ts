// Spec §4.1 (Minimal version) and §6.1: the «Mínima: …» line of the row and its
// «Hice la mínima» button, which completes the task like the checkbox.
import { checkboxAction } from './checkbox';
import { classifyInPending } from './completed';
import { complete } from './completions';
import type { Status } from './status';
import { visibleLine } from './current-step';
import type { Completion, Task } from './task';

/** What the row shows of the minimal version: the line with its prefix and whether «Hice la mínima» is enabled. */
export interface MinimalLine {
	text: string;
	enabled: boolean;
}

/**
 * Spec §6.1: with a minimal version and a pending or overdue row, «Mínima: »
 * and the full text; the button is enabled if the checkbox would complete
 * (§5.5). On any other row, none.
 */
export function minimalLine(task: Task, status: Pick<Status, 'kind'>, completions: readonly Completion[], now: Date): MinimalLine | undefined {
	if (task.minimalVersion === undefined || !visibleLine(status)) return undefined;
	return { text: `Mínima: ${task.minimalVersion}`, enabled: checkboxAction(task, completions, now).kind === 'complete' };
}

/**
 * Spec §6.1 and §4.4: tapping «Hice la mínima» adds the completion of `complete`
 * with wasMinimal set to true; if the row does not offer it or the button is disabled,
 * it does not complete (undefined).
 */
export function doTheMinimal(task: Task, completions: readonly Completion[], id: string, now: Date): Completion | undefined {
	const { status } = classifyInPending(task, completions, now);
	const line = minimalLine(task, status, completions, now);
	return line?.enabled ? complete(task, completions, id, now, true) : undefined;
}
