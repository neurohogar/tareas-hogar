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
export interface Saved {
	docs: TaskDocument[];
	completions: Completion[];
}

/** Estado de una ejecución de escenario: un repositorio en memoria. */
export interface World extends Saved {
	nextId: number;
	/** El texto del que se pregunta con qué fuente se dibuja (§6). */
	text?: string;
	/** Rechazo de la última creación o edición. */
	errors?: CreationErrors;
	/** Lo guardado justo antes de mi último cambio: lo que ve otro dispositivo "sin ver ese cambio". */
	beforeMyChange?: Saved;
	completionsPrevious?: Completion[];
	newCompletion?: Completion;
	momentOfNewCompletion?: Date;
	statuses: Status[];
	/** Los momentos en que se consultó el estado (en el orden de `estados`) o Pendientes. */
	statusMoments: Date[];
	/** Las filas de Pendientes, de arriba hacia abajo, en cada momento consultado. */
	pendingQueries: RowQueried[][];
	/** El check "Mostrar completadas" de este dispositivo; sin él, en su valor inicial. */
	showCompleted?: boolean;
	/** El check "Mostrar pausadas" de este dispositivo (§6.1); sin él, en su valor inicial. */
	showPaused?: boolean;
	/** El panel de edición abierto (§6.2): el botón de pausa que ofrece y, si se abrió en un momento dado, lo que dice de la posposición. */
	panel?: { pause: 'pausar' | 'reanudar' | undefined; postponement?: { button: 'posponer' | 'quitar' | undefined; text: string | undefined }; changes: PanelChanges };
	/** El aviso de deshacer (§5.4) está a la vista: no depende del panel, sigue abierto aunque el panel se cierre. */
	noticeOfUndoOpen?: boolean;
	/** Ya se tocó Atrás con el panel abierto (§6.2). */
	tapBack?: boolean;
	/** Ya se tocó el checkbox: "la tarea tiene N completados" verifica en vez de declarar. */
	checkboxTouched?: boolean;
	/** Lo que se borró (tareas y completados), para nombrarlo después de borrado. */
	deleted: Saved;
	/** El aviso del último completado de este dispositivo. */
	notice?: Notice;
	/** El aviso que se veía en el último momento consultado (aviso: undefined si no había). */
	noticeQueried?: { notice?: Notice; now: Date };
	/** El Historial en el último momento consultado. */
	history?: HistoryGroup[];
	/** El texto de "Última vez" en el último momento consultado. */
	lastTime?: string;
	/** Los emojis recientes del selector en este dispositivo; sin ellos, todavía no se declararon. */
	recent?: string[];
	/** Ya hubo una acción sobre los recientes: los pasos "los emojis recientes son" y "hay N" verifican en vez de declarar. */
	wasActionOnRecent?: boolean;
	/** El emoji que se eligió sin nombrarlo en el paso, y el más viejo de los recientes de antes. */
	emojiChosen?: string;
	emojiMoreOld?: string;
	/** Cuándo llega cada cosa en esta apertura de la app (§6.6). */
	opening?: AppOpening;
	/** Las anotaciones guardadas (§4.5, §7) y las que se borraron, para nombrarlas después. */
	annotations: Annotation[];
	annotationsDeleted: Annotation[];
	/** La pantalla donde está la persona (§5.10). */
	screenCurrent?: CurrentScreen;
	/** El panel de edición abierto desde la mirada de Anotar (§5.10): su tarea, si la hay, y lo que tenía al abrirse. */
	annotatePanel?: { taskId?: string; changes: PanelChanges; docsOnOpen: TaskDocument[] };
	/** La última anotación declarada: los pasos "la anotación ..." la describen. */
	lastAnnotationId?: string;
	/** La pantalla Anotaciones en el último momento consultado. */
	annotationsQueried?: AnnotationsGroup[];
	/** Ya se copió: el texto (o nada para copiar). */
	copied?: { text: string | undefined };
}

/** Una fuente en la apertura: en qué segundo queda lista o falla, y si podría venir del dispositivo sin conexión. */
export interface OpeningFont {
	arrives: number;
	failure: number;
	saved: boolean;
}

/** Lo que los pasos de la pantalla de carga declaran, en segundos desde el arranque (§6.6). */
export interface AppOpening {
	session: boolean;
	withoutConnection: boolean;
	losesConnection: number;
	auth: number;
	tasks: number;
	completions: number;
	atkinson: OpeningFont;
	noto: OpeningFont;
	remembered: boolean;
	versionChangeSet: boolean;
}

/** Lo que se escribió en el panel y lo que tiene encima (§6.2, Cambios sin guardar y Atrás). */
export interface PanelChanges {
	/** La tarea con que se abrió; sin ella, el panel se abrió para crear. */
	taskOnOpen?: Task;
	onOpen: PanelForm;
	form: PanelForm;
	top: OnTop;
	/** La acción del aviso de acción abierto. */
	action?: PanelAction;
	/** El último momento conocido, si un paso lo dio. */
	now?: Date;
	keyboardOpen: boolean;
}

/** Lo que se ve de una fila de Pendientes: el título, si se ve completada o pausada, y el texto de fecha. */
export interface RowQueried {
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
export const OTHER = 'otro dispositivo, sin ver ese cambio,';

function changesOnOpen(onOpen: PanelForm, taskOnOpen?: Task, now?: Date): PanelChanges {
	return { taskOnOpen, onOpen, form: onOpen, top: 'nada', now, keyboardOpen: false };
}

/** Spec §6.2: al editar, el panel se abre con los valores actuales de la tarea. */
export function changesOnEdit(task: Task, now?: Date): PanelChanges {
	return changesOnOpen({ data: taskData(task) }, task, now);
}

/** Spec §6.2: al crear, el panel se abre con los valores de `datos`. */
export function changesOnCreate(data: PanelForm['data']): PanelChanges {
	return changesOnOpen({ data });
}

/** Un paso soportado: el runtime lo despacha con las capturas ya resueltas. */
export interface StepDefinition {
	pattern: RegExp;
	run: (world: World, ...values: string[]) => void;
}

export function createWorld(): World {
	return {
		docs: [],
		completions: [],
		nextId: 1,
		annotations: [],
		annotationsDeleted: [],
		statuses: [],
		statusMoments: [],
		pendingQueries: [],
		deleted: { docs: [], completions: [] }
	};
}

export function newId(world: World, prefix: string): string {
	return `${prefix}-${world.nextId++}`;
}

/** Solo lo guardado, sin el resto del estado del escenario. */
export const copyOf = ({ docs, completions }: Saved): Saved => ({ docs, completions });

/** Las tareas que describen los documentos guardados. */
export function tasksOf(saved: Saved): Task[] {
	return saved.docs.map(taskFromDocument);
}

/** La única tarea guardada. */
export function theTask(saved: Saved): Task {
	const tasks = tasksOf(saved);
	if (tasks.length !== 1) throw new Error(`Se esperaba una tarea, hay ${tasks.length}`);
	return tasks[0];
}

/** El documento de la única tarea, con los campos que tenga aunque no correspondan a su tipo. */
export function theDoc(world: World): TaskDocument {
	return world.docs.find(({ id }) => id === theTask(world).id) as TaskDocument;
}

export function theTaskOfKind<T extends Task['kind']>(world: World, kind: T): Extract<Task, { kind: T }> {
	const task = theTask(world);
	if (task.kind !== kind) throw new Error(`Se esperaba una tarea ${kind}, es ${task.kind}`);
	return task as Extract<Task, { kind: T }>;
}

/** La única tarea guardada con ese título. */
export function theTaskTitled(saved: Saved, title: string): Task {
	const withThatTitle = tasksOf(saved).filter((task) => task.title === title);
	if (withThatTitle.length !== 1) throw new Error(`Se esperaba una tarea "${title}", hay ${withThatTitle.length}`);
	return withThatTitle[0];
}

/**
 * Lo que vio otro dispositivo: lo guardado antes de mi último cambio. Si
 * todavía no hice ningún cambio, vio todo lo guardado.
 */
export function thatSawOther(world: World): Saved {
	return world.beforeMyChange ?? copyOf(world);
}

export function rememberBeforeOfMyChange(world: World): void {
	world.beforeMyChange = copyOf(world);
}

/**
 * Un cambio del otro dispositivo llega a lo guardado y también a lo que ve
 * él: sus cambios siguientes los tienen en cuenta.
 */
export function otherRecord(world: World, apply: (saved: Saved) => Saved): void {
	Object.assign(world, apply(copyOf(world)));
	if (world.beforeMyChange) world.beforeMyChange = apply(world.beforeMyChange);
}

/** Saca de lo guardado los documentos, completados y anotaciones con esos ids, y recuerda lo que se borró. */
export function deleteSaved(world: World, docIds: readonly string[], completionIds: readonly string[], annotationIds: readonly string[] = []): void {
	world.annotationsDeleted = [...world.annotationsDeleted, ...world.annotations.filter(({ id }) => annotationIds.includes(id))];
	world.annotations = world.annotations.filter(({ id }) => !annotationIds.includes(id));
	const deletes = ({ id }: { id: string }, ids: readonly string[]) => ids.includes(id);
	world.deleted = {
		docs: [...world.deleted.docs, ...world.docs.filter((d) => deletes(d, docIds))],
		completions: [...world.deleted.completions, ...world.completions.filter((c) => deletes(c, completionIds))]
	};
	world.docs = world.docs.filter((d) => !deletes(d, docIds));
	world.completions = world.completions.filter((c) => !deletes(c, completionIds));
}

/** Todo lo que estuvo guardado en algún momento: lo que hay y lo que se borró. */
export function thatWasSaved(world: World): Saved {
	return {
		docs: [...world.docs, ...world.deleted.docs],
		completions: [...world.completions, ...world.deleted.completions]
	};
}
