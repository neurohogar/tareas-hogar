// Spec §5.9 (Posponer): qué posposición está vigente y cómo cambia el estado de la tarea mientras dura.
import type { Status } from './status';
import type { Postponement, Task } from './task';

/** Spec §5.9: una tarea está pospuesta mientras ahora < hasta; desde hasta, la posposición venció. */
export function activePostponement({ postponed }: Task, now: Date): Postponement | undefined {
	return postponed && now.getTime() < postponed.to.getTime() ? postponed : undefined;
}

/** Spec §5.9: los únicos estados a los que les afecta posponer. */
export function pendingOrOverdue({ kind }: Status): boolean {
	return kind === 'pendiente' || kind === 'atrasada';
}

/**
 * Spec §5.9: mientras dura la posposición, una tarea que según §5.1–§5.8 estaría
 * pendiente o atrasada está en espera, con el progreso de la posposición; cualquier
 * otro estado no cambia.
 */
export function withPostponement(status: Status, task: Task, now: Date): Status {
	const active = activePostponement(task, now);
	if (!active || !pendingOrOverdue(status)) return status;
	const { from, to } = active;
	// Un desde posterior a ahora (otro reloj) da 0: el progreso queda entre 0 y 1.
	const progress = Math.max(0, now.getTime() - from.getTime()) / (to.getTime() - from.getTime());
	return { kind: 'en espera', progress };
}
