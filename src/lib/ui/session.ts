// Lo que la sesión (Session.svelte) comparte con las pantallas: los datos que
// observa y las acciones sobre ellos. Las pantallas le preguntan al core qué
// mostrar con esos datos.
import { getContext, setContext } from 'svelte';
import type { Annotation, Sense } from '#lib/core/annotation.ts';
import type { CreationErrors } from '#lib/core/creation.ts';
import type { PanelForm } from '#lib/core/unsaved-changes.ts';
import type { Color, Label } from '#lib/core/label.ts';
import type { RenameError } from '#lib/core/label-management.ts';
import type { Completion, Task } from '#lib/core/task.ts';

export interface Sesion {
	readonly tareas: Task[];
	readonly completados: Completion[];
	readonly etiquetas: Label[];
	readonly anotaciones: Annotation[];
	/** El recuadro de Anotar (§5.10) está abierto. */
	readonly anotando: boolean;
	/** Hay un panel de edición abierto (al crear o al editar). */
	readonly hayPanel: boolean;
	abrirAnotar(): void;
	cerrarAnotar(): void;
	/** Segundo toque de Anotar: guarda la anotación con el contexto que toma el core. */
	anotar(sentido: Sense, texto: string): void;
	/** Un panel de edición se abre (con la tarea, al editar); devuelve cómo avisar que se cerró. */
	panelAbierto(tareaId: string | undefined): () => void;
	/** Editar texto de una anotación (§6.7). */
	editarTextoDeAnotacion(anotacion: Annotation, texto: string): void;
	/** Borra una anotación, ya confirmado. */
	borrarAnotacion(anotacion: Annotation): void;
	/** La hora actual; se actualiza sola. */
	readonly ahora: Date;
	/** El id de la etiqueta elegida en el filtro de Pendientes; sin él, "Todas". */
	readonly filtro: string | undefined;
	elegirFiltro(etiquetaId: string | undefined): void;
	/** Solo rápidas de Pendientes (§6.1): sigue al cambiar de pantalla, no al recargar. */
	readonly soloRapidas: boolean;
	alternarSoloRapidas(): void;
	/** Tocar el checkbox de la fila (§6.1): completa la tarea (con el aviso) o borra su último completado. */
	tocarCheckbox(tarea: Task): void;
	/** «Hice la mínima» de la fila (§6.1): completa la tarea como el checkbox, recordando que fue la mínima. */
	hacerLaMinima(tarea: Task): void;
	/** «Hecho» de la fila (§6.1): pasa al paso siguiente o, en el último, completa la tarea como el checkbox. */
	tocarHecho(tarea: Task): void;
	/** «Paso anterior» de la fila (§6.1). */
	pasoAnterior(tarea: Task): void;
	/** Crea una tarea con el formulario del panel; si algo es inválido devuelve los errores. */
	crear(formulario: PanelForm): CreationErrors | undefined;
	/** Abre el panel Editar tarea. */
	abrir(tarea: Task): void;
	/** Borra un completado (deshacer desde el Historial), ya confirmado. */
	borrarCompletado(completado: Completion): void;
	/** Renombra la etiqueta; si el nombre es inválido o repetido devuelve el error. */
	renombrarEtiqueta(etiqueta: Label, escrito: string): RenameError | undefined;
	recolorearEtiqueta(etiqueta: Label, color: Color): void;
	/** Borra la etiqueta (ya confirmado): se quita de todas las tareas. */
	borrarEtiqueta(etiqueta: Label): void;
}

const CLAVE = Symbol('sesion');

export function compartirSesion(sesion: Sesion): void {
	setContext(CLAVE, sesion);
}

export function laSesion(): Sesion {
	return getContext<Sesion>(CLAVE);
}
