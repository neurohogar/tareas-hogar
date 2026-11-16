// Spec §6.1 (Mostrar completadas): qué tareas cuentan como completadas.
import type { Status, PendingStatus, PausedStatus } from './status';
import { completionsOfTask } from './completions';
import { waitForPostponement, taskStatus } from './task-status';
import { asJustCreated } from './pause';
import type { Completion, Task } from './task';

/** Una completada, una no completada con el estado que la ordena por urgencia, o una pausada (§5.8: no está completada). */
export type InPending =
	| { completed: true; status: Status }
	| { completed: false; status: PendingStatus }
	| { completed: false; status: PausedStatus };

/**
 * Completada: puntual con al menos un completado (§5.1), o periódica en espera
 * con al menos un completado (§5.2, §5.3). Una periódica en espera sin
 * completados (antes de su primera ocurrencia) no lo está, ni una pausada (§5.8),
 * ni una en espera por una posposición (§5.9). La tarea es dueña de todas sus
 * entradas: estado, completados propios y posposición se derivan acá.
 */
export function classifyInPending(task: Task, completions: readonly Completion[], now: Date): InPending {
	const status = taskStatus(task, completions, now);
	if (status.kind === 'pausada') return { completed: false, status };
	if (status.kind === 'completada') return { completed: true, status };
	const { owns } = asJustCreated(task, completionsOfTask(completions, task.id));
	const byPostponement = waitForPostponement(task, completions, now) !== undefined;
	if (status.kind === 'en espera' && !byPostponement && owns.length > 0) return { completed: true, status };
	return { completed: false, status };
}

export function isCompleted(task: Task, completions: readonly Completion[], now: Date): boolean {
	return classifyInPending(task, completions, now).completed;
}
