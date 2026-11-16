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
 * Estado derivado de una tarea (spec §3) a partir de todos los completados
 * del usuario: elige los de la tarea y aplica la regla de su tipo y su
 * recurrencia; con horario, la de §5.5–§5.7. Una pausada no tiene estado y una
 * reanudada se evalúa como recién creada en reanudadaEn (§5.8). Sobre ese estado
 * se aplica la posposición (§5.9). Es el único punto de entrada del estado.
 */
export function taskStatus(saved: Task, completions: readonly Completion[], now: Date): Status {
	return withPostponement(statusByItsRule(saved, completions, now), saved, now);
}

/**
 * Spec §5.9: la posposición que tiene a la tarea en espera; ninguna si no está
 * pospuesta o si está en espera por su propia regla (ahí no cambia nada).
 */
export function waitForPostponement(saved: Task, completions: readonly Completion[], now: Date): Postponement | undefined {
	const active = activePostponement(saved, now);
	return active && pendingOrOverdue(statusByItsRule(saved, completions, now)) ? active : undefined;
}

/** El estado de §5.1–§5.8, sin la posposición. */
function statusByItsRule(saved: Task, completions: readonly Completion[], now: Date): Status {
	if (isPaused(saved)) return { kind: 'pausada' };
	const { task, owns: ofTheTask } = asJustCreated(saved, completionsOfTask(completions, saved.id));
	const { schedule } = task;
	if (!schedule) return statusWithoutSchedule(task, ofTheTask, now);
	if (task.kind === 'puntual') return oneOffStatusWithSchedule({ ...task, schedule }, ofTheTask, now);
	return recurringStatusWithSchedule(deadlinesWithSchedule(task, schedule, ofTheTask), now);
}
