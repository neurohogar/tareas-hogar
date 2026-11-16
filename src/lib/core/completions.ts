import { occurrenceThatCovers, lastCoveredOccurrence } from './covered-occurrence';
import { calendarOccurrenceThatCovers, windowOccurrenceThatCovers, completesByWindow } from './occurrences-with-schedule';
import { stepItIsOn, hasSeveralSteps } from './steps';
import { asJustCreated } from './pause';
import type { Completion, CoveredOccurrence, Task, RecurringTask } from './task';

/**
 * La ocurrencia que cubre un completado de una periódica, o undefined si no
 * cubre ninguna: de calendario, un día (§5.3) o, con horario, el inicio de una
 * ocurrencia (§5.6); relativa, solo si se completa por ventana (§5.7).
 */
function occurrenceOf({ recurrence, createdAt, schedule, resumedAt }: RecurringTask, owns: Completion[], now: Date): CoveredOccurrence | undefined {
	if (recurrence.mode === 'relativo') {
		if (!schedule || !completesByWindow(recurrence, schedule)) return undefined;
		return { start: windowOccurrenceThatCovers(recurrence, schedule, createdAt, owns, now) };
	}
	if (schedule) return { start: calendarOccurrenceThatCovers(recurrence, schedule, createdAt, owns, now, resumedAt) };
	return occurrenceThatCovers(recurrence, lastCoveredOccurrence(createdAt, owns), now);
}

/**
 * Spec §4.4: completar agrega un registro nuevo; nunca modifica los anteriores.
 * Guarda la ocurrencia que cubre, si cubre una, según lo que ya cubrieron los
 * completados de la tarea (de entre todos los del usuario); de una reanudada,
 * como recién creada en reanudadaEn (§5.8). De una tarea de dos pasos o más,
 * guarda el paso en que iba (§4.1, Pasos: Completar). Con «Hice la mínima»
 * (`fueMinima`), el completado lo recuerda; uno entero no lleva el campo.
 */
export function complete(saved: Task, completions: readonly Completion[], id: string, now: Date, wasMinimal = false): Completion {
	const completion: Completion = { id, taskId: saved.id, completedAt: now, ...stepAtCompletion(saved), ...(wasMinimal && { wasMinimal }) };
	const { task, owns } = asJustCreated(saved, completionsOfTask(completions, saved.id));
	if (task.kind === 'puntual') return completion;
	const coveredOccurrence = occurrenceOf(task, owns, now);
	return coveredOccurrence ? { ...completion, coveredOccurrence } : completion;
}

/** Spec §4.4: pasoAlCompletar, solo en tareas de dos pasos o más. */
function stepAtCompletion(task: Task) {
	return hasSeveralSteps(task) ? { stepAtCompletion: stepItIsOn(task) } : {};
}

/** El de completadoEn mayor (si empatan, el primero); los completados no pueden estar vacíos. */
export function latestCompletion(completions: readonly Completion[]): Completion {
	return completions.reduce((mostRecent, completion) =>
		completion.completedAt.getTime() > mostRecent.completedAt.getTime() ? completion : mostRecent
	);
}

/** El inicio de espera de una periódica (§5.3, §5.5): el completadoEn más reciente o, sin completados, creadaEn; en ms. */
export function waitStart(createdAt: Date, completions: readonly Completion[]): number {
	return completions.length === 0 ? createdAt.getTime() : lastCompletedAt(completions);
}

/** El completadoEn más reciente, en ms; los completados no pueden estar vacíos. */
export function lastCompletedAt(completions: readonly Completion[]): number {
	return latestCompletion(completions).completedAt.getTime();
}

export function completionsOfTask(completions: readonly Completion[], taskId: string): Completion[] {
	return completions.filter((completion) => completion.taskId === taskId);
}
