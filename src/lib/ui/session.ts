// What the session (Session.svelte) shares with the screens: the data it
// observes and the actions on it. The screens ask the core what to
// show with that data.
import { getContext, setContext } from 'svelte';
import type { Annotation, Sense } from '#lib/core/annotation.ts';
import type { CreationErrors } from '#lib/core/creation.ts';
import type { PanelForm } from '#lib/core/unsaved-changes.ts';
import type { Completion, Task } from '#lib/core/task.ts';

export interface Session {
	readonly tasks: Task[];
	readonly completions: Completion[];
	readonly annotations: Annotation[];
	/** The Anotar box (§5.10) is open. */
	readonly annotating: boolean;
	/** An edit panel is open (when creating or editing). */
	readonly hasPanel: boolean;
	openAnnotate(): void;
	closeAnnotate(): void;
	/** Second tap of Anotar: saves the annotation with the context the core takes. */
	annotate(sense: Sense, text: string): void;
	/** An edit panel opens (with the task, when editing); returns how to report that it closed. */
	panelOpened(taskId: string | undefined): () => void;
	/** Edit the text of an annotation (§6.7). */
	editAnnotationText(annotation: Annotation, text: string): void;
	/** Deletes an annotation, already confirmed. */
	deleteAnnotation(annotation: Annotation): void;
	/** The current time; updates itself. */
	readonly now: Date;
	/** Tapping the row checkbox (§6.1): completes the task (with the notice) or deletes its last completion. */
	tapCheckbox(task: Task): void;
	/** «Hice la mínima» of the row (§6.1): completes the task like the checkbox, remembering it was the minimal one. */
	doTheMinimal(task: Task): void;
	/** «Hecho» of the row (§6.1): moves to the next step or, on the last one, completes the task like the checkbox. */
	tapDone(task: Task): void;
	/** «Paso anterior» of the row (§6.1). */
	previousStep(task: Task): void;
	/** Creates a task with the panel form; if something is invalid it returns the errors. */
	create(form: PanelForm): CreationErrors | undefined;
	/** Opens the Editar tarea panel. */
	openTask(task: Task): void;
	/** Deletes a completion (undo from the Historial), already confirmed. */
	deleteCompletion(completion: Completion): void;
}

const KEY = Symbol('sesion');

export function shareSession(session: Session): void {
	setContext(KEY, session);
}

export function useSession(): Session {
	return getContext<Session>(KEY);
}
