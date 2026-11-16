// Spec §4.5 (Anotación) y §5.10 (Anotar): qué guarda una anotación, cómo se
// toma su contexto y cómo se corrige su texto (§6.7).
import { visibleNotice, type Notice } from './notice';

export type Sense = 'Me sirvió' | 'Me molestó';

/** Las pantallas donde puede estar la persona con el panel cerrado. */
export type CurrentScreen = 'Pendientes' | 'Historial' | 'Etiquetas' | 'Anotaciones';

export type AnnotationScreen = CurrentScreen | 'Panel de edición';

export interface Annotation {
	id: string;
	sense: Sense;
	annotatedAt: Date;
	screen: AnnotationScreen;
	/** La tarea, si la hay; no se copia su nombre. */
	taskId?: string;
	/** Una línea recortada; sin texto, el campo no está. */
	text?: string;
}

/** Dónde está la persona al tocar un sentido. */
export interface AnnotateContext {
	screen: CurrentScreen;
	/** El panel de edición, si está abierto: con tareaId al editar, sin tareaId al crear. */
	panel?: { taskId?: string };
	/** El aviso de deshacer del dispositivo, se vea o no. */
	notice?: Notice;
}

/**
 * Spec §4.5: una sola línea (sin saltos de línea, como un campo de una línea),
 * sin largo máximo y recortada; vacío o solo espacios es sin texto (undefined).
 */
export function normalizeAnnotationText(text: string): string | undefined {
	return text.replace(/[\r\n]/g, '').trim() || undefined;
}

/** Spec §4.5: el texto va solo si lo hay. */
function withText(withoutText: Omit<Annotation, 'text'>, text: string): Annotation {
	const normalizedValue = normalizeAnnotationText(text);
	return normalizedValue === undefined ? withoutText : { ...withoutText, text: normalizedValue };
}

/**
 * Spec §5.10: con el panel abierto manda el panel (su tarea al editar, ninguna
 * al crear); si no, la tarea del aviso de deshacer si se ve; si no, ninguna.
 */
function taskOfContext({ panel, notice }: AnnotateContext, now: Date): string | undefined {
	if (panel) return panel.taskId;
	return visibleNotice(notice, now)?.completion.taskId;
}

/**
 * Spec §5.10: la anotación del segundo toque, con el contexto tomado solo: la
 * pantalla es el Panel de edición si el panel está abierto, y si no la actual.
 */
export function annotate(id: string, sense: Sense, now: Date, context: AnnotateContext, text = ''): Annotation {
	const screen = context.panel ? 'Panel de edición' : context.screen;
	const taskId = taskOfContext(context, now);
	const withoutText: Omit<Annotation, 'text'> = { id, sense, annotatedAt: now, screen, ...(taskId === undefined ? {} : { taskId }) };
	return withText(withoutText, text);
}

/**
 * Spec §6.7 y §7: Editar texto cambia solo el texto de esa anotación (vaciarlo
 * la deja sin texto); si ya no está (se borró), no la revive.
 */
export function editText(annotations: readonly Annotation[], annotationId: string, text: string): Annotation[] {
	return annotations.map((annotation) => {
		if (annotation.id !== annotationId) return annotation;
		const { text: _previous, ...withoutText } = annotation;
		return withText(withoutText, text);
	});
}
