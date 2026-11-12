// Spec §6.1 (Mostrar completadas): qué tareas cuentan como completadas.
import type { Estado, EstadoEnPendientes, EstadoPausada } from './estado';
import { completadosDeTarea } from './completados';
import { esperaPorPosposicion, estadoDeTarea } from './estado-de-tarea';
import { comoRecienCreada } from './pausa';
import type { Completado, Tarea } from './tarea';

/** Una completada, una no completada con el estado que la ordena por urgencia, o una pausada (§5.8: no está completada). */
export type EnPendientes =
	| { completada: true; estado: Estado }
	| { completada: false; estado: EstadoEnPendientes }
	| { completada: false; estado: EstadoPausada };

/**
 * Completada: puntual con al menos un completado (§5.1), o periódica en espera
 * con al menos un completado (§5.2, §5.3). Una periódica en espera sin
 * completados (antes de su primera ocurrencia) no lo está, ni una pausada (§5.8),
 * ni una en espera por una posposición (§5.9). La tarea es dueña de todas sus
 * entradas: estado, completados propios y posposición se derivan acá.
 */
export function clasificarEnPendientes(tarea: Tarea, completados: readonly Completado[], ahora: Date): EnPendientes {
	const estado = estadoDeTarea(tarea, completados, ahora);
	if (estado.tipo === 'pausada') return { completada: false, estado };
	if (estado.tipo === 'completada') return { completada: true, estado };
	const { propios } = comoRecienCreada(tarea, completadosDeTarea(completados, tarea.id));
	const porPosposicion = esperaPorPosposicion(tarea, completados, ahora) !== undefined;
	if (estado.tipo === 'en espera' && !porPosposicion && propios.length > 0) return { completada: true, estado };
	return { completada: false, estado };
}

export function estaCompletada(tarea: Tarea, completados: readonly Completado[], ahora: Date): boolean {
	return clasificarEnPendientes(tarea, completados, ahora).completada;
}
