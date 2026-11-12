// Lo que la sesión (Sesion.svelte) comparte con las pantallas: los datos que
// observa y las acciones sobre ellos. Las pantallas le preguntan al core qué
// mostrar con esos datos.
import { getContext, setContext } from 'svelte';
import type { Anotacion, Sentido } from '#lib/core/anotacion.ts';
import type { ErroresDeCreacion } from '#lib/core/creacion.ts';
import type { FormularioDelPanel } from '#lib/core/cambios-sin-guardar.ts';
import type { Color, Etiqueta } from '#lib/core/etiqueta.ts';
import type { ErrorDeRenombrado } from '#lib/core/gestion-de-etiquetas.ts';
import type { Completado, Tarea } from '#lib/core/tarea.ts';

export interface Sesion {
	readonly tareas: Tarea[];
	readonly completados: Completado[];
	readonly etiquetas: Etiqueta[];
	readonly anotaciones: Anotacion[];
	/** El recuadro de Anotar (§5.10) está abierto. */
	readonly anotando: boolean;
	/** Hay un panel de edición abierto (al crear o al editar). */
	readonly hayPanel: boolean;
	abrirAnotar(): void;
	cerrarAnotar(): void;
	/** Segundo toque de Anotar: guarda la anotación con el contexto que toma el core. */
	anotar(sentido: Sentido, texto: string): void;
	/** Un panel de edición se abre (con la tarea, al editar); devuelve cómo avisar que se cerró. */
	panelAbierto(tareaId: string | undefined): () => void;
	/** Editar texto de una anotación (§6.7). */
	editarTextoDeAnotacion(anotacion: Anotacion, texto: string): void;
	/** Borra una anotación, ya confirmado. */
	borrarAnotacion(anotacion: Anotacion): void;
	/** La hora actual; se actualiza sola. */
	readonly ahora: Date;
	/** El id de la etiqueta elegida en el filtro de Pendientes; sin él, "Todas". */
	readonly filtro: string | undefined;
	elegirFiltro(etiquetaId: string | undefined): void;
	/** Solo rápidas de Pendientes (§6.1): sigue al cambiar de pantalla, no al recargar. */
	readonly soloRapidas: boolean;
	alternarSoloRapidas(): void;
	/** Tocar el checkbox de la fila (§6.1): completa la tarea (con el aviso) o borra su último completado. */
	tocarCheckbox(tarea: Tarea): void;
	/** Crea una tarea con el formulario del panel; si algo es inválido devuelve los errores. */
	crear(formulario: FormularioDelPanel): ErroresDeCreacion | undefined;
	/** Abre el panel Editar tarea. */
	abrir(tarea: Tarea): void;
	/** Borra un completado (deshacer desde el Historial), ya confirmado. */
	borrarCompletado(completado: Completado): void;
	/** Renombra la etiqueta; si el nombre es inválido o repetido devuelve el error. */
	renombrarEtiqueta(etiqueta: Etiqueta, escrito: string): ErrorDeRenombrado | undefined;
	recolorearEtiqueta(etiqueta: Etiqueta, color: Color): void;
	/** Borra la etiqueta (ya confirmado): se quita de todas las tareas. */
	borrarEtiqueta(etiqueta: Etiqueta): void;
}

const CLAVE = Symbol('sesion');

export function compartirSesion(sesion: Sesion): void {
	setContext(CLAVE, sesion);
}

export function laSesion(): Sesion {
	return getContext<Sesion>(CLAVE);
}
