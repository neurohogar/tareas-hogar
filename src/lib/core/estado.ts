// Estado derivado de una tarea (spec §3): se calcula, nunca se guarda.

export type Estado =
	| { tipo: 'pendiente' }
	| { tipo: 'atrasada' }
	/** progreso: fracción entre 0 y 1 del tiempo de espera transcurrido. */
	| { tipo: 'en espera'; progreso: number }
	/** Spec §5.1: una puntual con al menos un completado está completada. */
	| { tipo: 'completada' }
	/** Spec §5.8: una periódica pausada no tiene estado (no es pendiente, atrasada ni en espera). */
	| EstadoPausada;

export type EstadoPausada = { tipo: 'pausada' };

/** El estado de una tarea que se ordena por urgencia (§6.1): todos menos el de una puntual completada y el de una pausada. */
export type EstadoEnPendientes = Exclude<Estado, { tipo: 'completada' } | EstadoPausada>;

/** Progreso de la barra de espera, de 0 a 100 (aria-valuenow). */
export function porcentajeDeProgreso(progreso: number): number {
	return Math.round(progreso * 100);
}
