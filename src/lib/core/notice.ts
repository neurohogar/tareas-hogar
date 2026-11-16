// Spec §5.4: el aviso con Deshacer que aparece al completar. Hay uno solo: el
// del último completado de este dispositivo (completar otra vez lo reemplaza).
import { taskStatus } from './task-status';
import { taskName } from './task-name';
import type { Completion, Task } from './task';
import { datePhrase } from './date-text';
import { returnInstant } from './date-text-instants';

export interface Notice {
	/** El nombre de la tarea al completarla (§4.1): el aviso la nombra aunque después se borre. */
	name: string;
	/** El completado que ofrece deshacer. */
	completion: Completion;
	/** Cuándo vuelve la tarea (§5.4, §6.1); sin el campo, no vuelve (una puntual). */
	returns?: Date;
}

export const NOTICE_DURATION_MS = 5_000;

/**
 * Spec §5.4: el aviso del completado. Si la tarea vuelve (periódica), el instante
 * de «Vuelve …» de §6.1 calculado después del completado, con los completados
 * que ya tenía el usuario.
 */
export function noticeOnComplete(task: Task, completion: Completion, completionsBefore: readonly Completion[] = []): Notice {
	const { completedAt } = completion;
	const everything = [...completionsBefore, completion];
	const status = taskStatus(task, everything, completedAt);
	const returns = status.kind === 'en espera' ? returnInstant(task, everything, status, completedAt) : undefined;
	return { name: taskName(task), completion, ...(returns && { returns }) };
}

/** Spec §5.4: «Completaste «nombre»», con « · mínima» si el completado fue la mínima. */
export function noticeText({ name, completion }: Notice): string {
	return `Completaste «${name}»${completion.wasMinimal ? ' · mínima' : ''}`;
}

/** Spec §5.4: la línea debajo de «Completaste …», «Vuelve …» (§6.1) contado desde ahora; ninguna si la tarea no vuelve. */
export function noticeReturn(notice: Notice, now: Date): string | undefined {
	return notice.returns && datePhrase('Vuelve', notice.returns, now);
}

/** El aviso, si se ve ahora: mientras completadoEn <= ahora < completadoEn + 5 s. */
export function visibleNotice(notice: Notice | undefined, now: Date): Notice | undefined {
	if (!notice) return undefined;
	const from = notice.completion.completedAt.getTime();
	const visible = from <= now.getTime() && now.getTime() < from + NOTICE_DURATION_MS;
	return visible ? notice : undefined;
}

/** Los ms que le quedan al aviso hasta desaparecer solo. */
export function msUntilDue(notice: Notice, now: Date): number {
	return notice.completion.completedAt.getTime() + NOTICE_DURATION_MS - now.getTime();
}

/**
 * Deshacer en el aviso: el completado que hay que borrar (solo el que nombra
 * el aviso), o undefined si el aviso ya no se ve. En los dos casos el aviso se
 * cierra. Si ese completado ya no existe (otro dispositivo lo borró, o borró
 * su tarea), borrarlo no hace nada: no hace falta esperar a que llegue.
 */
export function completionToUndo(notice: Notice | undefined, now: Date): Completion | undefined {
	return visibleNotice(notice, now)?.completion;
}
