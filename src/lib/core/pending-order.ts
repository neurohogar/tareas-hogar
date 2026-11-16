// Spec §6.1: el orden de la lista Pendientes (por urgencia y, al final, las completadas).
import { compareIds } from './compare-ids';
import type { Status, PendingStatus } from './status';
import { compareTitles } from './alphabetical-order';
import type { Task } from './task';

export interface RowToOrder {
	task: Task;
	status: PendingStatus;
	/** El instante de urgencia (urgencia.ts); sin él, la fila va al final de su grupo. */
	instant: Date | undefined;
}

const GROUP_ORDER: Record<PendingStatus['kind'], number> = { atrasada: 0, pendiente: 1, 'en espera': 2 };

/** Del más antiguo al más reciente; los que no tienen instante, al final. */
function compareInstants(a: Date | undefined, b: Date | undefined): number {
	if (a === undefined || b === undefined) return Number(a === undefined) - Number(b === undefined);
	return a.getTime() - b.getTime();
}

/** El desempate de la lista: creadaEn más antigua, título en español y, por último, id. */
function breakTie(a: Task, b: Task): number {
	return a.createdAt.getTime() - b.createdAt.getTime() || compareTitles(a.title, b.title) || compareIds(a.id, b.id);
}

/** Grupo (atrasada, pendiente, en espera), después el instante de urgencia; si empatan, el desempate. */
export function compareByUrgency(a: RowToOrder, b: RowToOrder): number {
	return (
		GROUP_ORDER[a.status.kind] - GROUP_ORDER[b.status.kind] ||
		compareInstants(a.instant, b.instant) ||
		breakTie(a.task, b.task)
	);
}

export interface CompletedRow {
	task: Task;
	status: Status;
	/** El completadoEn más reciente de la tarea, en ms. */
	lastCompletedAt: number;
}

/** Mostrar pausadas (§6.1): por título en español; si empatan, el desempate. */
export function comparePaused(a: Task, b: Task): number {
	return compareTitles(a.title, b.title) || breakTie(a, b);
}

/** Mostrar completadas: de la de completadoEn más reciente a la más antigua; si empatan, el desempate. */
export function compareCompleted(a: CompletedRow, b: CompletedRow): number {
	return b.lastCompletedAt - a.lastCompletedAt || breakTie(a.task, b.task);
}
