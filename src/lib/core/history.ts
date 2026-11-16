// Spec §6.3 (Historial).
import { compareIds } from './compare-ids';
import { dayHeader, timeInText } from './dates-in-text';
import type { Completion, Task } from './task';

export interface HistoryEntry {
	completion: Completion;
	/** La tarea como es ahora: la entrada muestra su título actual. */
	task: Task;
	/** "HH:MM" de completadoEn. */
	hour: string;
	/** Spec §6.3: la hora, con « Mínima» después si el completado fue la mínima ("08:05 Mínima"). */
	timeText: string;
}

export interface HistoryGroup {
	/** "Hoy", "Ayer" o la fecha del día. */
	header: string;
	entries: HistoryEntry[];
}

/**
 * Del más reciente al más antiguo por completadoEn; si empatan, primero el de
 * id menor.
 */
function compareCompletions(a: Completion, b: Completion): number {
	return b.completedAt.getTime() - a.completedAt.getTime() || compareIds(a.id, b.id);
}

/**
 * Los completados de las tareas que existen (sin los de tareas borradas ni los
 * huérfanos), ordenados y agrupados por día local de completadoEn.
 */
export function history(tasks: readonly Task[], completions: readonly Completion[], now: Date): HistoryGroup[] {
	const byId = new Map(tasks.map((task) => [task.id, task]));
	const groups: HistoryGroup[] = [];
	for (const completion of [...completions].sort(compareCompletions)) {
		const task = byId.get(completion.taskId);
		if (!task) continue;
		const header = dayHeader(completion.completedAt, now);
		const hour = timeInText(completion.completedAt);
		const entry = { completion, task, hour, timeText: completion.wasMinimal ? `${hour} Mínima` : hour };
		// Cada día tiene un encabezado distinto: entradas seguidas con el mismo encabezado son del mismo día.
		const last = groups.at(-1);
		if (last?.header === header) last.entries.push(entry);
		else groups.push({ header, entries: [entry] });
	}
	return groups;
}
