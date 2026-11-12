// Spec §5.9 (Posponer): qué posposición está vigente y cómo cambia el estado de la tarea mientras dura.
import type { Estado } from './estado';
import type { Posposicion, Tarea } from './tarea';

/** Spec §5.9: una tarea está pospuesta mientras ahora < hasta; desde hasta, la posposición venció. */
export function posposicionVigente({ pospuesta }: Tarea, ahora: Date): Posposicion | undefined {
	return pospuesta && ahora.getTime() < pospuesta.hasta.getTime() ? pospuesta : undefined;
}

/** Spec §5.9: los únicos estados a los que les afecta posponer. */
export function pendienteOAtrasada({ tipo }: Estado): boolean {
	return tipo === 'pendiente' || tipo === 'atrasada';
}

/**
 * Spec §5.9: mientras dura la posposición, una tarea que según §5.1–§5.8 estaría
 * pendiente o atrasada está en espera, con el progreso de la posposición; cualquier
 * otro estado no cambia.
 */
export function conPosposicion(estado: Estado, tarea: Tarea, ahora: Date): Estado {
	const vigente = posposicionVigente(tarea, ahora);
	if (!vigente || !pendienteOAtrasada(estado)) return estado;
	const { desde, hasta } = vigente;
	// Un desde posterior a ahora (otro reloj) da 0: el progreso queda entre 0 y 1.
	const progreso = Math.max(0, ahora.getTime() - desde.getTime()) / (hasta.getTime() - desde.getTime());
	return { tipo: 'en espera', progreso };
}
