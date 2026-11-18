// Spec §5.5: with a schedule, the rules of §5.1–§5.3 apply the same and the schedule
// only shifts the moments at which the task becomes pending and overdue.
import type { Status, PendingStatus } from './status';
import { endOfDay, withinSchedule, lastClosing, availableWindow } from './schedule';
import type { Completion, Schedule } from './task';

/** The moments of §5.2/§5.3 of a recurring task, in ms, that the schedule shifts. */
export interface WaitMoments {
	/** T: when it would become pending without a schedule. */
	becomesPending: number;
	/** The wait start, for the progress. */
	waitStart: number;
	/** The lateness without a schedule, if it came before the close (relative: V + interval). */
	overdueWithoutSchedule?: number;
}

/** Spec §5.5, in ms: A (available), since when it is overdue and the wait start of a recurring task. */
export interface DeadlinesWithSchedule {
	available: number;
	lateness: number;
	waitStart: number;
}

/** A wait: from the start until it returns, in ms. */
interface Wait {
	start: number;
	returns: number;
}

/** Progress between 0 and 1; with now at the start or before (skewed clocks), 0. */
function waiting({ start, returns }: Wait, moment: number): PendingStatus {
	return { kind: 'en espera', progress: Math.max(0, (moment - start) / (returns - start)) };
}

/** A and C from T; the lateness is the first of C and the lateness without a schedule. */
export function deadlinesFromMoments(schedule: Schedule, moments: WaitMoments): DeadlinesWithSchedule {
	const { available, closing } = availableWindow(schedule, new Date(moments.becomesPending));
	const lateness = Math.min(closing, moments.overdueWithoutSchedule ?? Number.POSITIVE_INFINITY);
	return { available, lateness, waitStart: moments.waitStart };
}

/** Spec §5.5, recurring: overdue since the lateness; before A, waiting; otherwise, pending. */
export function recurringStatusWithSchedule({ available, lateness, waitStart }: DeadlinesWithSchedule, now: Date): PendingStatus {
	const moment = now.getTime();
	if (moment >= lateness) return { kind: 'atrasada' };
	if (moment < available) return waiting({ start: waitStart, returns: available }, moment);
	return { kind: 'pendiente' };
}

/** Spec §5.5 and §6.1, recurring: overdue, since the lateness; pending or waiting, A. */
export function recurringInstantWithSchedule({ available, lateness }: DeadlinesWithSchedule, status: PendingStatus): Date {
	return new Date(status.kind === 'atrasada' ? lateness : available);
}

/** What the schedule of a one-off uses. */
export interface OneOffWithSchedule {
	schedule: Schedule;
	createdAt: Date;
	dueDate?: Date;
}

/**
 * Spec §5.5, one-off without lateness: before A, waits since createdAt; after,
 * inside a window it is pending (undefined) and outside it waits since the
 * previous to until the from of the next one.
 */
function oneOffWait({ schedule, createdAt }: OneOffWithSchedule, now: Date): Wait | undefined {
	const { available } = availableWindow(schedule, createdAt);
	if (now.getTime() < available) return { start: createdAt.getTime(), returns: available };
	if (withinSchedule(schedule, now)) return undefined;
	return { start: lastClosing(schedule, now), returns: availableWindow(schedule, now).available };
}

/** With a due date, overdue since the to of the last window of that day (§5.7). */
const oneOffLateness = ({ schedule, dueDate }: OneOffWithSchedule) => dueDate && endOfDay(schedule, dueDate);

/** Spec §5.5 with §5.1: completed if it has completions; overdue since the lateness; otherwise, according to the window. */
export function oneOffStatusWithSchedule(task: OneOffWithSchedule, completions: readonly Completion[], now: Date): Status {
	if (completions.length > 0) return { kind: 'completada' };
	const lateness = oneOffLateness(task);
	if (lateness !== undefined && now.getTime() >= lateness) return { kind: 'atrasada' };
	const wait = oneOffWait(task, now);
	return wait ? waiting(wait, now.getTime()) : { kind: 'pendiente' };
}

/**
 * Spec §5.5 and §6.1, one-off: overdue, since the lateness; waiting, when
 * it returns; pending, the key of §6.1 (its due date, or none).
 */
export function oneOffInstantWithSchedule(task: OneOffWithSchedule, status: PendingStatus, now: Date): Date | undefined {
	if (status.kind === 'atrasada') return new Date(oneOffLateness(task) as number);
	const wait = status.kind === 'en espera' ? oneOffWait(task, now) : undefined;
	return wait ? new Date(wait.returns) : task.dueDate;
}
