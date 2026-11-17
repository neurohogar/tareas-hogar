// Lo que la sesión (Session.svelte) comparte con las pantallas: los datos que
// observa y las acciones sobre ellos. Las pantallas le preguntan al core qué
// mostrar con esos datos.
import { getContext, setContext } from 'svelte';
import type { Annotation, Sense } from '#lib/core/annotation.ts';
import type { CreationErrors } from '#lib/core/creation.ts';
import type { PanelForm } from '#lib/core/unsaved-changes.ts';
import type { Completion, Task } from '#lib/core/task.ts';

export interface Session {
	readonly tasks: Task[];
	readonly completions: Completion[];
	readonly annotations: Annotation[];
	/** El recuadro de Anotar (§5.10) está abierto. */
	readonly annotating: boolean;
	/** Hay un panel de edición abierto (al crear o al editar). */
	readonly hasPanel: boolean;
	openAnnotate(): void;
	closeAnnotate(): void;
	/** Segundo toque de Anotar: guarda la anotación con el contexto que toma el core. */
	annotate(sense: Sense, text: string): void;
	/** Un panel de edición se abre (con la tarea, al editar); devuelve cómo avisar que se cerró. */
	panelOpened(taskId: string | undefined): () => void;
	/** Editar texto de una anotación (§6.7). */
	editAnnotationText(annotation: Annotation, text: string): void;
	/** Borra una anotación, ya confirmado. */
	deleteAnnotation(annotation: Annotation): void;
	/** La hora actual; se actualiza sola. */
	readonly now: Date;
	/** Tocar el checkbox de la fila (§6.1): completa la tarea (con el aviso) o borra su último completado. */
	tapCheckbox(task: Task): void;
	/** «Hice la mínima» de la fila (§6.1): completa la tarea como el checkbox, recordando que fue la mínima. */
	doTheMinimal(task: Task): void;
	/** «Hecho» de la fila (§6.1): pasa al paso siguiente o, en el último, completa la tarea como el checkbox. */
	tapDone(task: Task): void;
	/** «Paso anterior» de la fila (§6.1). */
	previousStep(task: Task): void;
	/** Crea una tarea con el formulario del panel; si algo es inválido devuelve los errores. */
	create(form: PanelForm): CreationErrors | undefined;
	/** Abre el panel Editar tarea. */
	openTask(task: Task): void;
	/** Borra un completado (deshacer desde el Historial), ya confirmado. */
	deleteCompletion(completion: Completion): void;
}

const KEY = Symbol('sesion');

export function shareSession(session: Session): void {
	setContext(KEY, session);
}

export function useSession(): Session {
	return getContext<Session>(KEY);
}
