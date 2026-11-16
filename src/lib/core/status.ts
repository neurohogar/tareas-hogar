// Estado derivado de una tarea (spec §3): se calcula, nunca se guarda.

export type Status =
	| { kind: 'pendiente' }
	| { kind: 'atrasada' }
	/** progreso: fracción entre 0 y 1 del tiempo de espera transcurrido. */
	| { kind: 'en espera'; progress: number }
	/** Spec §5.1: una puntual con al menos un completado está completada. */
	| { kind: 'completada' }
	/** Spec §5.8: una periódica pausada no tiene estado (no es pendiente, atrasada ni en espera). */
	| PausedStatus;

export type PausedStatus = { kind: 'pausada' };

/** El estado de una tarea que se ordena por urgencia (§6.1): todos menos el de una puntual completada y el de una pausada. */
export type PendingStatus = Exclude<Status, { kind: 'completada' } | PausedStatus>;

/** Progreso de la barra de espera, de 0 a 100 (aria-valuenow). */
export function progressPercentage(progress: number): number {
	return Math.round(progress * 100);
}
