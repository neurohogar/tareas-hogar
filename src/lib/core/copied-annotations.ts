// Spec §6.7 (Copiar): the text that the Copiar button of the Anotaciones screen copies.
import type { Annotation } from './annotation';
import { visibleAnnotations, type VisibleAnnotation } from './annotations';
import { dateAndTimeInText } from './dates-in-text';
import type { Task } from './task';

const SEPARATOR = ' · ';

const oldestFirst = (a: Date, b: Date) => a.getTime() - b.getTime();

/** Date and time, sense, screen, and the task name and the text only if present. */
function annotationLine({ annotation, taskName }: VisibleAnnotation): string {
	const { annotatedAt, sense, screen, text } = annotation;
	return [dateAndTimeInText(annotatedAt), sense, screen, taskName, text].filter((part) => part !== undefined).join(SEPARATOR);
}

/**
 * Spec §6.7: one line per annotation that the screen shows, from the oldest
 * to the most recent (on a tie, the one with the lower id first); undefined if there is
 * nothing to copy.
 */
export function annotationsText(tasks: readonly Task[], annotations: readonly Annotation[]): string | undefined {
	const lines = visibleAnnotations(tasks, annotations, oldestFirst).map(annotationLine);
	return lines.length === 0 ? undefined : lines.join('\n');
}
