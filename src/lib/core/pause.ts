// Spec §5.8 (Pausar): solo las periódicas se pueden pausar. Una pausada no
// tiene estado; al reanudarla, se evalúa como recién creada en reanudadaEn.
import type { TaskChange } from './task-document';
import type { Completion, Task } from './task';

/** Spec §5.8: solo una periódica puede estar pausada. */
export function isPaused(task: Task): boolean {
	return task.kind === 'periodica' && task.paused === true;
}

/** Spec §6.2: el botón de pausa al editar una periódica; una puntual no tiene. */
export function pauseAction(task: Task): 'pausar' | 'reanudar' | undefined {
	if (task.kind === 'puntual') return undefined;
	return isPaused(task) ? 'reanudar' : 'pausar';
}

/** Spec §5.8 y §7: pausar escribe pausada. */
export function pause(): TaskChange {
	return { paused: true };
}

/** Spec §5.8 y §7: reanudar quita pausada y guarda reanudadaEn = ahora, en un solo cambio. */
export function resume(now: Date): TaskChange {
	return { paused: null, resumedAt: now };
}

/**
 * Spec §5.8: una periódica reanudada se evalúa como recién creada en
 * reanudadaEn: con creadaEn = reanudadaEn y sin los completados (de la tarea)
 * con completadoEn anterior a reanudadaEn. Las demás, tal cual.
 */
export function asJustCreated(task: Task, owns: readonly Completion[]): { task: Task; owns: Completion[] } {
	if (task.kind === 'puntual' || !task.resumedAt) return { task, owns: [...owns] };
	const from = task.resumedAt.getTime();
	return {
		task: { ...task, createdAt: task.resumedAt },
		owns: owns.filter(({ completedAt }) => completedAt.getTime() >= from)
	};
}
