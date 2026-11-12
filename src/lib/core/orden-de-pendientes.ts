// Spec §6.1: el orden de la lista Pendientes (por urgencia y, al final, las completadas).
import { compararIds } from './comparar-ids';
import type { Estado, EstadoEnPendientes } from './estado';
import { compararTitulos } from './orden-alfabetico';
import type { Tarea } from './tarea';

export interface FilaPorOrdenar {
	tarea: Tarea;
	estado: EstadoEnPendientes;
	/** El instante de urgencia (urgencia.ts); sin él, la fila va al final de su grupo. */
	instante: Date | undefined;
}

const ORDEN_DEL_GRUPO: Record<EstadoEnPendientes['tipo'], number> = { atrasada: 0, pendiente: 1, 'en espera': 2 };

/** Del más antiguo al más reciente; los que no tienen instante, al final. */
function compararInstantes(a: Date | undefined, b: Date | undefined): number {
	if (a === undefined || b === undefined) return Number(a === undefined) - Number(b === undefined);
	return a.getTime() - b.getTime();
}

/** El desempate de la lista: creadaEn más antigua, título en español y, por último, id. */
function desempatar(a: Tarea, b: Tarea): number {
	return a.creadaEn.getTime() - b.creadaEn.getTime() || compararTitulos(a.titulo, b.titulo) || compararIds(a.id, b.id);
}

/** Grupo (atrasada, pendiente, en espera), después el instante de urgencia; si empatan, el desempate. */
export function compararPorUrgencia(a: FilaPorOrdenar, b: FilaPorOrdenar): number {
	return (
		ORDEN_DEL_GRUPO[a.estado.tipo] - ORDEN_DEL_GRUPO[b.estado.tipo] ||
		compararInstantes(a.instante, b.instante) ||
		desempatar(a.tarea, b.tarea)
	);
}

export interface FilaCompletada {
	tarea: Tarea;
	estado: Estado;
	/** El completadoEn más reciente de la tarea, en ms. */
	ultimoCompletadoEn: number;
}

/** Mostrar pausadas (§6.1): por título en español; si empatan, el desempate. */
export function compararPausadas(a: Tarea, b: Tarea): number {
	return compararTitulos(a.titulo, b.titulo) || desempatar(a, b);
}

/** Mostrar completadas: de la de completadoEn más reciente a la más antigua; si empatan, el desempate. */
export function compararCompletadas(a: FilaCompletada, b: FilaCompletada): number {
	return b.ultimoCompletadoEn - a.ultimoCompletadoEn || desempatar(a.tarea, b.tarea);
}
