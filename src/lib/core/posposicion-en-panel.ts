// Spec §6.2: lo que muestra de la posposición el panel de edición.
import { diasEntre } from './dias';
import { estadoDeTarea } from './estado-de-tarea';
import { horaEnTexto } from './fechas-en-texto';
import { estaPausada } from './pausa';
import { pendienteOAtrasada, posposicionVigente } from './posposicion-vigente';
import type { Completado, Tarea } from './tarea';

/**
 * Spec §6.2 y §5.9: el botón del panel. Pospuesta, Quitar posponer (en cualquier
 * estado); si no, Posponer solo a una pendiente o atrasada no pausada.
 */
export function accionDePosponer(tarea: Tarea, completados: readonly Completado[], ahora: Date): 'posponer' | 'quitar' | undefined {
	if (posposicionVigente(tarea, ahora)) return 'quitar';
	if (estaPausada(tarea)) return undefined;
	return pendienteOAtrasada(estadoDeTarea(tarea, completados, ahora)) ? 'posponer' : undefined;
}

/** Spec §6.2: "Pospuesta hasta HH:MM" o, si hasta es de mañana, "Pospuesta hasta mañana HH:MM"; sin posposición vigente, nada. */
export function textoDePosposicion(tarea: Tarea, ahora: Date): string | undefined {
	const vigente = posposicionVigente(tarea, ahora);
	if (!vigente) return undefined;
	const dia = diasEntre(ahora, vigente.hasta) === 1 ? 'mañana ' : '';
	return `Pospuesta hasta ${dia}${horaEnTexto(vigente.hasta)}`;
}
