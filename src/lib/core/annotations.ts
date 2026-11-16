// Spec §6.7 (Anotaciones): qué anotaciones se ven, en qué orden y agrupadas por día.
import type { Annotation } from './annotation';
import { annotationWithExistingTask } from './deletion';
import { compareIds } from './compare-ids';
import { dayHeader, timeInText } from './dates-in-text';
import { taskName } from './task-name';
import type { Task } from './task';

/** Una anotación que la pantalla muestra, con el nombre actual de su tarea. */
export interface VisibleAnnotation {
	annotation: Annotation;
	/** «emoji título» de la tarea como es ahora (§4.1); sin tarea, no está. */
	taskName?: string;
}

export interface AnnotationsEntry extends VisibleAnnotation {
	/** "HH:MM" de anotadaEn. */
	hour: string;
}

export interface AnnotationsGroup {
	/** "Hoy", "Ayer" o la fecha del día, como en el Historial. */
	header: string;
	entries: AnnotationsEntry[];
}

/**
 * Spec §6.7: las anotaciones con tarea existente o sin tarea (sin las huérfanas
 * ni las de tareas borradas), en el orden de anotadaEn que pide compararInstantes
 * (si empatan, primero la de id menor), cada una con el nombre actual de su tarea.
 */
export function visibleAnnotations(tasks: readonly Task[], annotations: readonly Annotation[], compareInstants: (a: Date, b: Date) => number): VisibleAnnotation[] {
	const byId = new Map(tasks.map((task) => [task.id, task]));
	return annotations
		.filter((annotation) => annotationWithExistingTask(tasks, annotation))
		.sort((a, b) => compareInstants(a.annotatedAt, b.annotatedAt) || compareIds(a.id, b.id))
		.map((annotation) => {
			const task = annotation.taskId === undefined ? undefined : byId.get(annotation.taskId);
			return task ? { annotation, taskName: taskName(task) } : { annotation };
		});
}

const mostRecentFirst = (a: Date, b: Date) => b.getTime() - a.getTime();

/**
 * Spec §6.7: de la más reciente a la más antigua (si empatan, primero la de id
 * menor), agrupadas por día local con los encabezados del Historial.
 */
export function annotationsOnScreen(tasks: readonly Task[], annotations: readonly Annotation[], now: Date): AnnotationsGroup[] {
	const groups: AnnotationsGroup[] = [];
	for (const visible of visibleAnnotations(tasks, annotations, mostRecentFirst)) {
		const { annotatedAt } = visible.annotation;
		const header = dayHeader(annotatedAt, now);
		const entry = { ...visible, hour: timeInText(annotatedAt) };
		// Cada día tiene un encabezado distinto: entradas seguidas con el mismo encabezado son del mismo día.
		const last = groups.at(-1);
		if (last?.header === header) last.entries.push(entry);
		else groups.push({ header, entries: [entry] });
	}
	return groups;
}
