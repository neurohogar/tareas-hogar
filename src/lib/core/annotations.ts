// Spec §6.7 (Anotaciones): which annotations are shown, in what order and grouped by day.
import type { Annotation } from './annotation';
import { annotationWithExistingTask } from './deletion';
import { compareIds } from './compare-ids';
import { dayHeader, timeInText } from './dates-in-text';
import { taskName } from './task-name';
import type { Task } from './task';

/** An annotation the screen shows, with the current name of its task. */
export interface VisibleAnnotation {
	annotation: Annotation;
	/** "emoji title" of the task as it is now (§4.1); without a task, absent. */
	taskName?: string;
}

export interface AnnotationsEntry extends VisibleAnnotation {
	/** "HH:MM" of annotatedAt. */
	hour: string;
}

export interface AnnotationsGroup {
	/** "Hoy", "Ayer" or the date of the day, as in the Historial. */
	header: string;
	entries: AnnotationsEntry[];
}

/**
 * Spec §6.7: annotations with an existing task or without a task (not the orphans
 * nor those of deleted tasks), in the annotatedAt order that compareInstants asks for
 * (on a tie, the one with the lower id first), each with the current name of its task.
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
 * Spec §6.7: from most recent to oldest (on a tie, the one with the lower id
 * first), grouped by local day with the headers of the Historial.
 */
export function annotationsOnScreen(tasks: readonly Task[], annotations: readonly Annotation[], now: Date): AnnotationsGroup[] {
	const groups: AnnotationsGroup[] = [];
	for (const visible of visibleAnnotations(tasks, annotations, mostRecentFirst)) {
		const { annotatedAt } = visible.annotation;
		const header = dayHeader(annotatedAt, now);
		const entry = { ...visible, hour: timeInText(annotatedAt) };
		// Each day has a distinct header: consecutive entries with the same header are on the same day.
		const last = groups.at(-1);
		if (last?.header === header) last.entries.push(entry);
		else groups.push({ header, entries: [entry] });
	}
	return groups;
}
