// Spec §6.3 (Historial).
import { compareIds } from './compare-ids';
import { dayHeader, timeInText } from './dates-in-text';
import type { Completion, Task } from './task';

export interface HistoryEntry {
	completion: Completion;
	/** The task as it is now: the entry shows its current title. */
	task: Task;
	/** "HH:MM" of completedAt. */
	hour: string;
	/** Spec §6.3: the time, with « Mínima» after it if the completion was the minimal one ("08:05 Mínima"). */
	timeText: string;
}

export interface HistoryGroup {
	/** "Hoy", "Ayer" or the date of the day. */
	header: string;
	entries: HistoryEntry[];
}

/**
 * From most recent to oldest by completedAt; on a tie, the one with the
 * lower id first.
 */
function compareCompletions(a: Completion, b: Completion): number {
	return b.completedAt.getTime() - a.completedAt.getTime() || compareIds(a.id, b.id);
}

/**
 * The completions of the tasks that exist (without those of deleted tasks nor the
 * orphans), sorted and grouped by local day of completedAt.
 */
export function history(tasks: readonly Task[], completions: readonly Completion[], now: Date): HistoryGroup[] {
	const byId = new Map(tasks.map((task) => [task.id, task]));
	const groups: HistoryGroup[] = [];
	for (const completion of [...completions].sort(compareCompletions)) {
		const task = byId.get(completion.taskId);
		if (!task) continue;
		const header = dayHeader(completion.completedAt, now);
		const hour = timeInText(completion.completedAt);
		const entry = { completion, task, hour, timeText: completion.wasMinimal ? `${hour} Mínima` : hour };
		// Each day has a distinct header: consecutive entries with the same header are on the same day.
		const last = groups.at(-1);
		if (last?.header === header) last.entries.push(entry);
		else groups.push({ header, entries: [entry] });
	}
	return groups;
}
