// Spec §5.5–§5.7: A, el atraso y el inicio de espera de una periódica con
// horario, según su recurrencia.
import { waitStart } from './completions';
import { deadlinesFromMoments, type DeadlinesWithSchedule } from './status-with-schedule';
import { relativeMoments } from './recurring-relative-status';
import type { Occurrence } from './schedule';
import { nextCalendarOccurrence, nextWindowOccurrence, completesByWindow } from './occurrences-with-schedule';
import type { Completion, Schedule, RecurringTask } from './task';

/** Spec §5.6 y §5.7: A es el inicio de N y el atraso, su cierre (C). */
const deadlinesOfOccurrence = ({ start, closing }: Occurrence, from: number): DeadlinesWithSchedule => ({
	available: start,
	lateness: closing,
	waitStart: from
});

export function deadlinesWithSchedule(
	{ recurrence, createdAt, resumedAt }: RecurringTask,
	schedule: Schedule,
	taskCompletions: readonly Completion[]
): DeadlinesWithSchedule {
	const from = waitStart(createdAt, taskCompletions);
	if (recurrence.mode === 'calendario')
		return deadlinesOfOccurrence(nextCalendarOccurrence(recurrence, schedule, createdAt, taskCompletions, resumedAt), from);
	if (completesByWindow(recurrence, schedule))
		return deadlinesOfOccurrence(nextWindowOccurrence(recurrence, schedule, createdAt, taskCompletions), from);
	return deadlinesFromMoments(schedule, relativeMoments(recurrence, createdAt, taskCompletions));
}
