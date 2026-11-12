import { inicioDelDia } from './dias';
import type { Estado } from './estado';
import type { Completado } from './tarea';

/**
 * Spec §5.1: con al menos un completado no aparece en Pendientes; si no, está
 * atrasada cuando hoy es posterior a la fecha límite (que cuenta como el día
 * completo) y pendiente en cualquier otro caso. Nunca está en espera.
 */
export function estadoPuntual(fechaLimite: Date | undefined, completados: readonly Completado[], ahora: Date): Estado {
	if (completados.length > 0) return { tipo: 'completada' };
	if (fechaLimite && inicioDelDia(ahora).getTime() > fechaLimite.getTime()) return { tipo: 'atrasada' };
	return { tipo: 'pendiente' };
}
