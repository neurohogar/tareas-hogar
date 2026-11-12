// Spec §6.2 (Borrar tarea), §5.10 y §7 (Borrado de tareas).
import type { Anotacion } from './anotacion';
import { completadosDeTarea } from './completados';
import type { Completado, Tarea } from './tarea';

/** Lo que se borra en un solo writeBatch. */
export interface Borrado {
	tareaId: string;
	completadoIds: string[];
	anotacionIds: string[];
}

const ids = (de: readonly { id: string }[]) => de.map(({ id }) => id);

/**
 * Borrar una tarea borra también todos sus completados y todas sus
 * anotaciones, y solo los suyos.
 */
export function borrado(tareaId: string, completados: readonly Completado[], anotaciones: readonly Anotacion[]): Borrado {
	return {
		tareaId,
		completadoIds: ids(completadosDeTarea(completados, tareaId)),
		anotacionIds: ids(anotaciones.filter((anotacion) => anotacion.tareaId === tareaId))
	};
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

/** Spec §4.5: una anotación sin tarea no es huérfana; con tarea, si la tarea existe. */
export function anotacionConTareaExistente(tareas: readonly Tarea[], { tareaId }: Anotacion): boolean {
	return tareaId === undefined || existeTarea(tareas, tareaId);
}

/**
 * Spec §7: las anotaciones cuya tarea no existe (otro dispositivo, sin
 * conexión, anotó sobre una tarea ya borrada): no se muestran ni se copian y
 * se limpian. Las anotaciones sin tarea no se ven afectadas.
 */
export function anotacionesHuerfanas(tareas: readonly Tarea[], anotaciones: readonly Anotacion[]): Anotacion[] {
	return anotaciones.filter((anotacion) => !anotacionConTareaExistente(tareas, anotacion));
}
