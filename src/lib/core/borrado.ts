// Spec §6.2 (Borrar tarea) y §7 (Borrado de tareas).
import { completadosDeTarea } from './completados';
import type { Completado, Tarea } from './tarea';

/** Lo que se borra en un solo writeBatch. */
export interface Borrado {
	tareaId: string;
	completadoIds: string[];
}

/** Borrar una tarea borra también todos sus completados, y solo los suyos. */
export function borrado(tareaId: string, completados: readonly Completado[]): Borrado {
	return { tareaId, completadoIds: completadosDeTarea(completados, tareaId).map(({ id }) => id) };
}

/**
 * Spec §7, gana el borrado: si la tarea ya no existe (por ejemplo, la borró
 * otro dispositivo), su panel de edición se cierra y sus completados quedan
 * huérfanos.
 */
export function existeTarea(tareas: readonly Tarea[], tareaId: string): boolean {
	return tareas.some(({ id }) => id === tareaId);
}

/**
 * Los completados cuya tarea no existe (otro dispositivo, sin conexión,
 * completó una tarea ya borrada): no cuentan para nada y se limpian.
 */
export function completadosHuerfanos(tareas: readonly Tarea[], completados: readonly Completado[]): Completado[] {
	return completados.filter(({ tareaId }) => !existeTarea(tareas, tareaId));
}
