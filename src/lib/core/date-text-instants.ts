// Spec §6.1 (Fecha y distancia): los instantes que nombran «Tocaba …» (desde
// cuándo toca una atrasada) y «Vuelve …» (cuándo vuelve a pendiente una en espera).
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

/** Sin horario: la fecha límite, V (o creadaEn, nunca completada) o las 00:00 de N. */
function wasDueWithoutSchedule(task: Task, ofTheTask: readonly Completion[]): Date | undefined {
	if (task.kind === 'puntual') return task.dueDate;
	const { recurrence } = task;
	if (recurrence.mode === 'relativo') return relativeUrgencyInstant(recurrence, task.createdAt, ofTheTask, { kind: 'pendiente' });
	return nextOccurrence(recurrence, task.createdAt, ofTheTask);
}

/**
 * Spec §6.1: desde cuándo toca la tarea. Puntual: el día de la fecha límite,
 * tenga o no horario (sin fecha límite, ninguno). Relativa: V. Calendario: el
 * día de N. Una periódica con horario, A, salvo que A todavía no haya llegado:
 * ahí, el instante sin horario (nunca es un instante futuro). De una reanudada,
 * como recién creada (§5.8).
 */
export function dueInstant(saved: Task, completions: readonly Completion[], now: Date): Date | undefined {
	const { task, owns } = asJustCreated(saved, completionsOfTask(completions, saved.id));
	const withoutSchedule = wasDueWithoutSchedule(task, owns);
	if (task.kind === 'puntual' || !task.schedule) return withoutSchedule;
	const { available } = deadlinesWithSchedule(task, task.schedule, owns);
	return available <= now.getTime() ? new Date(available) : withoutSchedule;
}

/**
 * Spec §6.1: cuándo vuelve a pendiente una tarea en espera, el mismo instante que
 * la ordena (relativa, V; calendario, 00:00 de N; con horario, A; pospuesta,
 * hasta). Si una posposición y su propia regla la tienen en espera, el más tarde.
 */
export function returnInstant(task: Task, completions: readonly Completion[], status: WaitingStatus, now: Date): Date {
	// En espera siempre hay un instante: el de su regla o, si solo la posposición la tiene en espera, su hasta.
	const byItsRule = urgencyInstant(task, completions, status, now) as Date;
	const to = activePostponement(task, now)?.to;
	return to ? new Date(Math.max(to.getTime(), byItsRule.getTime())) : byItsRule;
}
