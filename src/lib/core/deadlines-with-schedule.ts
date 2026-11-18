// Spec §5.5–§5.7: A, the overdue point and the start of waiting of a recurring task with
// a schedule, according to its recurrence.
import { waitStart } from './completions';
import { deadlinesFromMoments, type DeadlinesWithSchedule } from './status-with-schedule';
import { relativeMoments } from './recurring-relative-status';
import type { Occurrence } from './schedule';
import { nextCalendarOccurrence, nextWindowOccurrence, completesByWindow } from './occurrences-with-schedule';
import type { Completion, Schedule, RecurringTask } from './task';

/** Spec §5.6 and §5.7: A is the start of N and the overdue point, its close (C). */
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
