// Spec §5.5: con horario, las reglas de §5.1–§5.3 valen igual y el horario
// solo corre los momentos en que la tarea pasa a pendiente y a atrasada.
import type { Status, PendingStatus } from './status';
import { endOfDay, withinSchedule, lastClosing, availableWindow } from './schedule';
import type { Completion, Schedule } from './task';

/** Los momentos de §5.2/§5.3 de una periódica, en ms, que el horario corre. */
export interface WaitMoments {
	/** T: cuándo pasaría a pendiente sin horario. */
	becomesPending: number;
	/** El inicio de espera, para el progreso. */
	waitStart: number;
	/** El atraso sin horario, si llegara antes que el cierre (relativa: V + intervalo). */
	overdueWithoutSchedule?: number;
}

/** Spec §5.5, en ms: A (disponible), desde cuándo está atrasada y el inicio de espera de una periódica. */
export interface DeadlinesWithSchedule {
	available: number;
	lateness: number;
	waitStart: number;
}

/** Una espera: del inicio hasta que vuelve, en ms. */
interface Wait {
	start: number;
	returns: number;
}

/** Progreso entre 0 y 1; con ahora en el inicio o antes (relojes desfasados), 0. */
function waiting({ start, returns }: Wait, moment: number): PendingStatus {
	return { kind: 'en espera', progress: Math.max(0, (moment - start) / (returns - start)) };
}

/** A y C a partir de T; el atraso es el primero entre C y el atraso sin horario. */
export function deadlinesFromMoments(schedule: Schedule, moments: WaitMoments): DeadlinesWithSchedule {
	const { available, closing } = availableWindow(schedule, new Date(moments.becomesPending));
	const lateness = Math.min(closing, moments.overdueWithoutSchedule ?? Number.POSITIVE_INFINITY);
	return { available, lateness, waitStart: moments.waitStart };
}

/** Spec §5.5, periódica: atrasada desde el atraso; antes de A, en espera; si no, pendiente. */
export function recurringStatusWithSchedule({ available, lateness, waitStart }: DeadlinesWithSchedule, now: Date): PendingStatus {
	const moment = now.getTime();
	if (moment >= lateness) return { kind: 'atrasada' };
	if (moment < available) return waiting({ start: waitStart, returns: available }, moment);
	return { kind: 'pendiente' };
}

/** Spec §5.5 y §6.1, periódica: atrasada, desde el atraso; pendiente o en espera, A. */
export function recurringInstantWithSchedule({ available, lateness }: DeadlinesWithSchedule, status: PendingStatus): Date {
	return new Date(status.kind === 'atrasada' ? lateness : available);
}

/** Lo que usa el horario de una puntual. */
export interface OneOffWithSchedule {
	schedule: Schedule;
	createdAt: Date;
	dueDate?: Date;
}

/**
 * Spec §5.5, puntual sin atraso: antes de A, espera desde creadaEn; después,
 * dentro de una ventana está pendiente (undefined) y fuera espera desde el
 * hasta anterior hasta el desde de la próxima.
 */
function oneOffWait({ schedule, createdAt }: OneOffWithSchedule, now: Date): Wait | undefined {
	const { available } = availableWindow(schedule, createdAt);
	if (now.getTime() < available) return { start: createdAt.getTime(), returns: available };
	if (withinSchedule(schedule, now)) return undefined;
	return { start: lastClosing(schedule, now), returns: availableWindow(schedule, now).available };
}

/** Con fecha límite, atrasada desde el hasta de la última ventana de ese día (§5.7). */
const oneOffLateness = ({ schedule, dueDate }: OneOffWithSchedule) => dueDate && endOfDay(schedule, dueDate);

/** Spec §5.5 con §5.1: completada si tiene completados; atrasada desde el atraso; si no, según la ventana. */
export function oneOffStatusWithSchedule(task: OneOffWithSchedule, completions: readonly Completion[], now: Date): Status {
	if (completions.length > 0) return { kind: 'completada' };
	const lateness = oneOffLateness(task);
	if (lateness !== undefined && now.getTime() >= lateness) return { kind: 'atrasada' };
	const wait = oneOffWait(task, now);
	return wait ? waiting(wait, now.getTime()) : { kind: 'pendiente' };
}

/**
 * Spec §5.5 y §6.1, puntual: atrasada, desde el atraso; en espera, cuando
 * vuelve; pendiente, la clave de §6.1 (su fecha límite, o ninguna).
 */
export function oneOffInstantWithSchedule(task: OneOffWithSchedule, status: PendingStatus, now: Date): Date | undefined {
	if (status.kind === 'atrasada') return new Date(oneOffLateness(task) as number);
	const wait = status.kind === 'en espera' ? oneOffWait(task, now) : undefined;
	return wait ? new Date(wait.returns) : task.dueDate;
}
