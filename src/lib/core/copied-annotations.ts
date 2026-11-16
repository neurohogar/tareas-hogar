// Spec §6.7 (Copiar): el texto que copia el botón Copiar de la pantalla Anotaciones.
import type { Annotation } from './annotation';
import { visibleAnnotations, type VisibleAnnotation } from './annotations';
import { dateAndTimeInText } from './dates-in-text';
import type { Task } from './task';

const SEPARATOR = ' · ';

const oldestFirst = (a: Date, b: Date) => a.getTime() - b.getTime();

/** Fecha y hora, sentido, pantalla, y el nombre de la tarea y el texto solo si los hay. */
function annotationLine({ annotation, taskName }: VisibleAnnotation): string {
	const { annotatedAt, sense, screen, text } = annotation;
	return [dateAndTimeInText(annotatedAt), sense, screen, taskName, text].filter((part) => part !== undefined).join(SEPARATOR);
}

/**
 * Spec §6.7: una línea por anotación que la pantalla muestra, de la más antigua
 * a la más reciente (si empatan, primero la de id menor); undefined si no hay
 * nada para copiar.
 */
export function annotationsText(tasks: readonly Task[], annotations: readonly Annotation[]): string | undefined {
	const lines = visibleAnnotations(tasks, annotations, oldestFirst).map(annotationLine);
	return lines.length === 0 ? undefined : lines.join('\n');
}
