// Spec §6.1: el primer paso en la fila de Pendientes.
import type { Estado } from './estado';
import type { Tarea } from './tarea';

const PREFIJO = 'Primer paso: ';

/**
 * Spec §6.1: «Primer paso: …», completo, solo si la tarea tiene primer paso y
 * su fila está pendiente o atrasada; nunca en espera, completada ni pausada.
 */
export function textoDePrimerPaso({ primerPaso }: Tarea, { tipo }: Pick<Estado, 'tipo'>): string | undefined {
	if (!primerPaso || (tipo !== 'pendiente' && tipo !== 'atrasada')) return undefined;
	return PREFIJO + primerPaso;
}
