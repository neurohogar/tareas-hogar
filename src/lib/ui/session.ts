// What the session (Session.svelte) shares with the screens: the data it
// observes and the actions on it. The screens ask the core what to
// show with that data.
import { getContext, setContext } from 'svelte';
import type { CreationErrors } from '#lib/core/creation.ts';
import type { PanelForm } from '#lib/core/unsaved-changes.ts';
import type { Completion, Task } from '#lib/core/task.ts';

export interface Session {
	readonly tasks: Task[];
	readonly completions: Completion[];
	/** The current time; updates itself. */
	readonly now: Date;
	/** Whether the minimal mode is on (§5.8, §7); synced across devices. */
	readonly minimalMode: boolean;
	/** The menu item (§6.1): turns the mode on or off at once. */
	toggleMinimalMode(): void;
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
