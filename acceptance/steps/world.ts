import type { PanelAction } from '../../src/lib/core/panel-action';
import type { OnTop } from '../../src/lib/core/panel-back';
import type { Annotation, CurrentScreen } from '../../src/lib/core/annotation';
import type { AnnotationsGroup } from '../../src/lib/core/annotations';
import type { Notice } from '../../src/lib/core/notice';
import type { PanelForm } from '../../src/lib/core/unsaved-changes';
import type { CreationErrors } from '../../src/lib/core/creation';
import { taskFromDocument, type TaskDocument } from '../../src/lib/core/task-document';
import type { Status } from '../../src/lib/core/status';
import type { StepButtons } from '../../src/lib/core/current-step';
import type { MinimalLine } from '../../src/lib/core/minimal-version';
import type { HistoryGroup } from '../../src/lib/core/history';
import { taskData } from '../../src/lib/core/task-data';
import type { Completion, Task } from '../../src/lib/core/task';

/** Lo que hay guardado: los documentos de las tareas, y los completados. */
export interface Guardado {
	documentos: TaskDocument[];
	completions: Completion[];
}

/** Estado de una ejecución de escenario: un repositorio en memoria. */
export interface World extends Guardado {
	siguienteId: number;
	/** El texto del que se pregunta con qué fuente se dibuja (§6). */
	text?: string;
	/** Rechazo de la última creación o edición. */
	errors?: CreationErrors;
	/** Lo guardado justo antes de mi último cambio: lo que ve otro dispositivo "sin ver ese cambio". */
	antesDeMiCambio?: Guardado;
	completadosAnteriores?: Completion[];
	nuevoCompletado?: Completion;
	momentoDelNuevoCompletado?: Date;
	estados: Status[];
	/** Los momentos en que se consultó el estado (en el orden de `estados`) o Pendientes. */
	momentosDelEstado: Date[];
	/** Las filas de Pendientes, de arriba hacia abajo, en cada momento consultado. */
	consultasDePendientes: FilaConsultada[][];
	/** El check "Mostrar completadas" de este dispositivo; sin él, en su valor inicial. */
	mostrarCompletadas?: boolean;
	/** El check "Mostrar pausadas" de este dispositivo (§6.1); sin él, en su valor inicial. */
	mostrarPausadas?: boolean;
	/** El panel de edición abierto (§6.2): el botón de pausa que ofrece y, si se abrió en un momento dado, lo que dice de la posposición. */
	panel?: { pausa: 'pausar' | 'reanudar' | undefined; posposicion?: { boton: 'posponer' | 'quitar' | undefined; text: string | undefined }; cambios: CambiosDelPanel };
	/** El aviso de deshacer (§5.4) está a la vista: no depende del panel, sigue abierto aunque el panel se cierre. */
	avisoDeDeshacerAbierto?: boolean;
	/** Ya se tocó Atrás con el panel abierto (§6.2). */
	tocoAtras?: boolean;
	/** Ya se tocó el checkbox: "la tarea tiene N completados" verifica en vez de declarar. */
	checkboxTocado?: boolean;
	/** Lo que se borró (tareas y completados), para nombrarlo después de borrado. */
	borrado: Guardado;
	/** El aviso del último completado de este dispositivo. */
	notice?: Notice;
	/** El aviso que se veía en el último momento consultado (aviso: undefined si no había). */
	avisoConsultado?: { notice?: Notice; now: Date };
	/** El Historial en el último momento consultado. */
	historial?: HistoryGroup[];
	/** El texto de "Última vez" en el último momento consultado. */
	ultimaVez?: string;
	/** Los emojis recientes del selector en este dispositivo; sin ellos, todavía no se declararon. */
	recientes?: string[];
	/** Ya hubo una acción sobre los recientes: los pasos "los emojis recientes son" y "hay N" verifican en vez de declarar. */
	huboAccionSobreRecientes?: boolean;
	/** El emoji que se eligió sin nombrarlo en el paso, y el más viejo de los recientes de antes. */
	emojiElegido?: string;
	emojiMasViejo?: string;
	/** Cuándo llega cada cosa en esta apertura de la app (§6.6). */
	apertura?: AperturaDeLaApp;
	/** Las anotaciones guardadas (§4.5, §7) y las que se borraron, para nombrarlas después. */
	anotaciones: Annotation[];
	anotacionesBorradas: Annotation[];
	/** La pantalla donde está la persona (§5.10). */
	pantallaActual?: CurrentScreen;
	/** El panel de edición abierto desde la mirada de Anotar (§5.10): su tarea, si la hay, y lo que tenía al abrirse. */
	panelDeAnotar?: { taskId?: string; cambios: CambiosDelPanel; documentosAlAbrir: TaskDocument[] };
	/** La última anotación declarada: los pasos "la anotación ..." la describen. */
	ultimaAnotacionId?: string;
	/** La pantalla Anotaciones en el último momento consultado. */
	anotacionesConsultadas?: AnnotationsGroup[];
	/** Ya se copió: el texto (o nada para copiar). */
	copiado?: { text: string | undefined };
}

/** Una fuente en la apertura: en qué segundo queda lista o falla, y si podría venir del dispositivo sin conexión. */
export interface FuenteDeLaApertura {
	llega: number;
	falla: number;
	guardada: boolean;
}

/** Lo que los pasos de la pantalla de carga declaran, en segundos desde el arranque (§6.6). */
export interface AperturaDeLaApp {
	sesion: boolean;
	sinConexion: boolean;
	pierdeLaConexion: number;
	auth: number;
	tasks: number;
	completions: number;
	atkinson: FuenteDeLaApertura;
	noto: FuenteDeLaApertura;
	recordaba: boolean;
	versionCambioElJuego: boolean;
}

/** Lo que se escribió en el panel y lo que tiene encima (§6.2, Cambios sin guardar y Atrás). */
export interface CambiosDelPanel {
	/** La tarea con que se abrió; sin ella, el panel se abrió para crear. */
	taskOnOpen?: Task;
	alAbrir: PanelForm;
	form: PanelForm;
	top: OnTop;
	/** La acción del aviso de acción abierto. */
	action?: PanelAction;
	/** El último momento conocido, si un paso lo dio. */
	now?: Date;
	keyboardOpen: boolean;
}

/** Lo que se ve de una fila de Pendientes: el título, si se ve completada o pausada, y el texto de fecha. */
export interface FilaConsultada {
	title: string;
	completed: boolean;
	paused: boolean;
	/** El texto de fecha y distancia («Tocaba …», «Vuelve …», §6.1); sin él, la fila no lo muestra. */
	dateText: string | undefined;
	/** La línea del paso de la fila, «Primer paso: …» o «Paso: …» (§6.1); sin ella, la fila no la muestra. */
	firstStepText: string | undefined;
	/** Los botones «Paso anterior» y «Hecho» de la línea del paso (§6.1); sin ellos, la fila no los muestra. */
	stepButtons: StepButtons | undefined;
	/** La línea «Mínima: …» de la fila y si «Hice la mínima» está habilitado (§6.1); sin ella, la fila no la muestra. */
	minimal: MinimalLine | undefined;
}

/** El sujeto de los pasos del otro dispositivo: actúa sobre lo guardado antes de mi último cambio. */
export const OTRO = 'otro dispositivo, sin ver ese cambio,';

function cambiosAlAbrir(alAbrir: PanelForm, tareaAlAbrir?: Task, ahora?: Date): CambiosDelPanel {
	return { taskOnOpen: tareaAlAbrir, alAbrir, form: alAbrir, top: 'nada', now: ahora, keyboardOpen: false };
}

/** Spec §6.2: al editar, el panel se abre con los valores actuales de la tarea. */
export function cambiosAlEditar(_world: World, tarea: Task, ahora?: Date): CambiosDelPanel {
	return cambiosAlAbrir({ data: taskData(tarea) }, tarea, ahora);
}

/** Spec §6.2: al crear, el panel se abre con los valores de `datos`. */
export function cambiosAlCrear(datos: PanelForm['data']): CambiosDelPanel {
	return cambiosAlAbrir({ data: datos });
}

/** Un paso soportado: el runtime lo despacha con las capturas ya resueltas. */
export interface StepDefinition {
	pattern: RegExp;
	run: (world: World, ...values: string[]) => void;
}

export function createWorld(): World {
	return {
		documentos: [],
		completions: [],
		siguienteId: 1,
		anotaciones: [],
		anotacionesBorradas: [],
		estados: [],
		momentosDelEstado: [],
		consultasDePendientes: [],
		borrado: { documentos: [], completions: [] }
	};
}

export function nuevoId(world: World, prefijo: string): string {
	return `${prefijo}-${world.siguienteId++}`;
}

/** Solo lo guardado, sin el resto del estado del escenario. */
export const copiaDe = ({ documentos, completions: completados }: Guardado): Guardado => ({ documentos, completions: completados });

/** Las tareas que describen los documentos guardados. */
export function tareasDe(guardado: Guardado): Task[] {
	return guardado.documentos.map(taskFromDocument);
}

/** La única tarea guardada. */
export function laTarea(guardado: Guardado): Task {
	const tareas = tareasDe(guardado);
	if (tareas.length !== 1) throw new Error(`Se esperaba una tarea, hay ${tareas.length}`);
	return tareas[0];
}

/** El documento de la única tarea, con los campos que tenga aunque no correspondan a su tipo. */
export function elDocumento(world: World): TaskDocument {
	return world.documentos.find(({ id }) => id === laTarea(world).id) as TaskDocument;
}

export function laTareaDeTipo<T extends Task['kind']>(world: World, tipo: T): Extract<Task, { kind: T }> {
	const tarea = laTarea(world);
	if (tarea.kind !== tipo) throw new Error(`Se esperaba una tarea ${tipo}, es ${tarea.kind}`);
	return tarea as Extract<Task, { kind: T }>;
}

/** La única tarea guardada con ese título. */
export function laTareaTitulada(guardado: Guardado, titulo: string): Task {
	const conEseTitulo = tareasDe(guardado).filter((tarea) => tarea.title === titulo);
	if (conEseTitulo.length !== 1) throw new Error(`Se esperaba una tarea "${titulo}", hay ${conEseTitulo.length}`);
	return conEseTitulo[0];
}

/**
 * Lo que vio otro dispositivo: lo guardado antes de mi último cambio. Si
 * todavía no hice ningún cambio, vio todo lo guardado.
 */
export function loQueVioElOtro(world: World): Guardado {
	return world.antesDeMiCambio ?? copiaDe(world);
}

export function recordarAntesDeMiCambio(world: World): void {
	world.antesDeMiCambio = copiaDe(world);
}

/**
 * Un cambio del otro dispositivo llega a lo guardado y también a lo que ve
 * él: sus cambios siguientes los tienen en cuenta.
 */
export function registrarDelOtro(world: World, aplicar: (guardado: Guardado) => Guardado): void {
	Object.assign(world, aplicar(copiaDe(world)));
	if (world.antesDeMiCambio) world.antesDeMiCambio = aplicar(world.antesDeMiCambio);
}

/** Saca de lo guardado los documentos, completados y anotaciones con esos ids, y recuerda lo que se borró. */
export function borrarGuardado(world: World, documentoIds: readonly string[], completadoIds: readonly string[], anotacionIds: readonly string[] = []): void {
	world.anotacionesBorradas = [...world.anotacionesBorradas, ...world.anotaciones.filter(({ id }) => anotacionIds.includes(id))];
	world.anotaciones = world.anotaciones.filter(({ id }) => !anotacionIds.includes(id));
	const seBorra = ({ id }: { id: string }, ids: readonly string[]) => ids.includes(id);
	world.borrado = {
		documentos: [...world.borrado.documentos, ...world.documentos.filter((d) => seBorra(d, documentoIds))],
		completions: [...world.borrado.completions, ...world.completions.filter((c) => seBorra(c, completadoIds))]
	};
	world.documentos = world.documentos.filter((d) => !seBorra(d, documentoIds));
	world.completions = world.completions.filter((c) => !seBorra(c, completadoIds));
}

/** Todo lo que estuvo guardado en algún momento: lo que hay y lo que se borró. */
export function loQueHuboGuardado(world: World): Guardado {
	return {
		documentos: [...world.documentos, ...world.borrado.documentos],
		completions: [...world.completions, ...world.borrado.completions]
	};
}
