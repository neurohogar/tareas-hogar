// Spec §4.5 (Annotation) and §5.10 (Annotate): what an annotation stores, how its
// context is taken and how its text is corrected (§6.7).
import { visibleNotice, type Notice } from './notice';

export type Sense = 'Me sirvió' | 'Me molestó';

/** Spec §5.10: the screens where the person can be with the panel closed. */
export type CurrentScreen = 'Pendientes' | 'Historial' | 'Anotaciones';

/** Spec §4.5: only annotations saved when that screen existed have `Etiquetas`; the app does not produce it again. */
export type AnnotationScreen = CurrentScreen | 'Panel de edición' | 'Etiquetas';

export interface Annotation {
	id: string;
	sense: Sense;
	annotatedAt: Date;
	screen: AnnotationScreen;
	/** The task, if there is one; its name is not copied. */
	taskId?: string;
	/** A trimmed line; without text, the field is absent. */
	text?: string;
}

/** Where the person is when tapping a sense. */
export interface AnnotateContext {
	screen: CurrentScreen;
	/** The edit panel, if open: with taskId when editing, without taskId when creating. */
	panel?: { taskId?: string };
	/** The device's undo notice, visible or not. */
	notice?: Notice;
}

/**
 * Spec §4.5: a single line (no line breaks, as in a one-line field),
 * no maximum length and trimmed; empty or only spaces is no text (undefined).
 */
export function normalizeAnnotationText(text: string): string | undefined {
	return text.replace(/[\r\n]/g, '').trim() || undefined;
}

/** Spec §4.5: the text goes only if there is one. */
function withText(withoutText: Omit<Annotation, 'text'>, text: string): Annotation {
	const normalizedValue = normalizeAnnotationText(text);
	return normalizedValue === undefined ? withoutText : { ...withoutText, text: normalizedValue };
}

/**
 * Spec §5.10: with the panel open the panel rules (its task when editing, none
 * when creating); otherwise, the undo notice task if visible; otherwise, none.
 */
function taskOfContext({ panel, notice }: AnnotateContext, now: Date): string | undefined {
	if (panel) return panel.taskId;
	return visibleNotice(notice, now)?.completion.taskId;
}

/**
 * Spec §5.10: the annotation of the second tap, with the context taken by itself: the
 * screen is the Panel de edición if the panel is open, and otherwise the current one.
 */
export function annotate(id: string, sense: Sense, now: Date, context: AnnotateContext, text = ''): Annotation {
	const screen = context.panel ? 'Panel de edición' : context.screen;
	const taskId = taskOfContext(context, now);
	const withoutText: Omit<Annotation, 'text'> = { id, sense, annotatedAt: now, screen, ...(taskId === undefined ? {} : { taskId }) };
	return withText(withoutText, text);
}

/**
 * Spec §6.7 and §7: Editar texto changes only the text of that annotation (emptying it
 * leaves it without text); if it is no longer there (it was deleted), it does not revive it.
 */
export function editText(annotations: readonly Annotation[], annotationId: string, text: string): Annotation[] {
	return annotations.map((annotation) => {
		if (annotation.id !== annotationId) return annotation;
		const { text: _previous, ...withoutText } = annotation;
		return withText(withoutText, text);
	});
}
