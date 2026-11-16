import { startOfDay } from './days';
import type { Status } from './status';
import type { Completion } from './task';

/**
 * Spec §5.1: con al menos un completado no aparece en Pendientes; si no, está
 * atrasada cuando hoy es posterior a la fecha límite (que cuenta como el día
 * completo) y pendiente en cualquier otro caso. Nunca está en espera.
 */
export function oneOffStatus(dueDate: Date | undefined, completions: readonly Completion[], now: Date): Status {
	if (completions.length > 0) return { kind: 'completada' };
	if (dueDate && startOfDay(now).getTime() > dueDate.getTime()) return { kind: 'atrasada' };
	return { kind: 'pendiente' };
}
