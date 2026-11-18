// Cambios sin guardar y Atrás (spec §6.2, §7): lo que hay escrito en el panel, los avisos que abre
// cerrarlo o usar una acción, y qué cierra Atrás. El panel es el de world.panel; lo que escribe y lo
// que tiene encima, world.panel.cambios. Con el panel cerrado, world.panel no existe.
import { expect } from 'vitest';
import { whatBackDoes, type OnTop } from '../../src/lib/core/panel-back';
import { optionAction, changeOfAction, whatTheActionDoes, type PanelAction } from '../../src/lib/core/panel-action';
import { actionNotice, discardAndAct, saveAndAct, type NoticeAction } from '../../src/lib/core/action-notice';
import { CLOSE_NOTICE, onClosePanel, type ChangesNotice, type NoticeButton } from '../../src/lib/core/unsaved-changes-notice';
import { createFromPanel, editFromPanel } from '../../src/lib/core/unsaved-changes-saved';
import { hasChanges, type PanelForm } from '../../src/lib/core/unsaved-changes';
import type { CommonData } from '../../src/lib/core/creation';
import { createOneOff } from '../../src/lib/core/create-one-off';
import { DATA_ON_CREATE, type TaskData } from '../../src/lib/core/task-data';
import { applyChange, type TaskChange } from '../../src/lib/core/task-document';
import type { TypedSchedule } from '../../src/lib/core/schedule';
import { POSTPONE_OPTIONS } from '../../src/lib/core/postponement';
import type { Task } from '../../src/lib/core/task';
import { NOW, SCENARIO_BEFORE, recordCreation } from './create';
import { P, dateHour, list } from './values';
import {
	changesOnCreate,
	changesOnEdit,
	theTask,
	newId,
	rememberBeforeOfMyChange,
	tasksOf,
	type PanelChanges,
	type StepDefinition,
	type World
} from './world';

const theMoment = ({ now }: PanelChanges) => now ?? NOW;

/** Un valor malformado falla el escenario: nada se interpreta por parecido. */
function ofTable<T>(table: Record<string, T>, value: string, that: string): T {
	if (!Object.hasOwn(table, value)) throw new Error(`${that} inválido: "${value}"`);
	return table[value];
}

function openForEdit(world: World, data: CommonData): void {
	recordCreation(world, (id) => createOneOff(data, id, SCENARIO_BEFORE));
	expect(world.errors).toBeUndefined();
	const task = theTask(world);
	world.panel = { pause: undefined, changes: changesOnEdit(task) };
}

/** La ventana "HH:MM-HH:MM" de un paso. */
function timeWindow(value: string): TypedSchedule[number] {
	const parts = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(value);
	if (!parts) throw new Error(`Ventana inválida: "${value}"`);
	return { from: parts[1], to: parts[2] };
}

function actionContext(world: World, changes: PanelChanges, taskOnOpen: Task, action: PanelAction): NoticeAction {
	const task = tasksOf(world).find(({ id }) => id === taskOnOpen.id);
	if (!task) throw new Error('La tarea del panel ya no existe');
	return { action, taskOnOpen, task, completions: world.completions, now: theMoment(changes), form: changes.form };
}

/** Lo que hizo otro dispositivo o el paso del tiempo mientras el panel estaba abierto (§6.2, §7). */
function panelOnDay(world: World): PanelChanges | undefined {
	const changes = world.panel?.changes;
	if (!changes) return undefined;
	const { taskOnOpen, action } = changes;
	if (taskOnOpen && !tasksOf(world).some(({ id }) => id === taskOnOpen.id)) {
		world.panel = undefined;
		return undefined;
	}
	if (changes.top === 'aviso de acción' && taskOnOpen && action && !actionNotice(actionContext(world, changes, taskOnOpen, action))) topClose(changes);
	return changes;
}

function thePanelOpen(world: World): PanelChanges {
	const changes = panelOnDay(world);
	if (!changes) throw new Error('El panel no está abierto');
	return changes;
}

function topClose(changes: PanelChanges): void {
	changes.top = 'nada';
	changes.action = undefined;
}

const withChanges = ({ onOpen, form }: PanelChanges) => hasChanges(onOpen, form);

const ON_TOP_NAMES: Record<string, OnTop> = {
	nada: 'nada',
	'el aviso de cierre': 'aviso de cierre',
	'el aviso de acción': 'aviso de acción',
	'la confirmación de Borrar tarea': 'confirmación de Borrar tarea',
	'el selector de emoji': 'selector de emoji'
};

const OPEN: Partial<Record<OnTop, string>> = {
	'aviso de cierre': 'el panel con el aviso de cierre',
	'aviso de acción': 'el panel con el aviso de acción',
	'confirmación de Borrar tarea': 'el panel con la confirmación de Borrar tarea',
	'selector de emoji': 'el panel con el selector de emoji'
};

// ---- Lo que se escribe ----

const FIELDS: Record<string, { reads: (f: PanelForm) => string | undefined; writes: (f: PanelForm, value: string) => PanelForm }> = {
	Título: { reads: (f) => f.data.title, writes: (f, title) => ({ ...f, data: { ...f.data, title } }) },
	Nota: { reads: (f) => f.data.note, writes: (f, note) => ({ ...f, data: { ...f.data, note } }) },
	'Primer paso': { reads: (f) => f.data.firstStep, writes: (f, firstStep) => ({ ...f, data: { ...f.data, firstStep } }) },
	'Versión mínima': { reads: (f) => f.data.minimalVersion, writes: (f, minimalVersion) => ({ ...f, data: { ...f.data, minimalVersion } }) }
};

/** Los pasos más del panel: el campo «Paso N» (N ≥ 2) es el lugar N - 2 de `pasos` (§6.2). */
const STEP_PLACE = /^Paso (\d+)$/;

function stepPlace(form: PanelForm, field: string): number {
	const place = Number(STEP_PLACE.exec(field)?.[1]) - 2;
	if (!(place >= 0 && place < (form.data.steps ?? []).length)) throw new Error(`Campo inválido: "${field}"`);
	return place;
}

function fieldOf(field: string): (typeof FIELDS)[string] {
	if (!STEP_PLACE.test(field)) return ofTable(FIELDS, field, 'Campo');
	const withSteps = (f: PanelForm, steps: string[]): PanelForm => ({ ...f, data: { ...f.data, steps } });
	return {
		reads: (f) => f.data.steps?.[stepPlace(f, field)],
		writes: (f, value) => withSteps(f, (f.data.steps ?? []).map((step, place) => (place === stepPlace(f, field) ? value : step)))
	};
}

function write(world: World, field: string, value: string): void {
	const changes = thePanelOpen(world);
	changes.form = fieldOf(field).writes(changes.form, value);
}

/** «Agregar paso» suma un campo vacío al final; «Quitar» saca el del campo (§6.2). */
function changeSteps(world: World, change: (steps: readonly string[], form: PanelForm) => string[]): void {
	const changes = thePanelOpen(world);
	const { form } = changes;
	changes.form = { ...form, data: { ...form.data, steps: change(form.data.steps ?? [], form) } };
}

const commonOf = ({ title, emoji, note, firstStep, steps, minimalVersion, schedule }: TaskData): CommonData => ({ title, emoji, note, firstStep, steps, minimalVersion, schedule });

/** Los campos de cada opción de "Se repite": los de la tarea si es de esa forma; si no, como al crear (§6.2). */
const REPEATS: Record<string, { shape: TaskData['shape']; empty: Partial<TaskData> }> = {
	'No se repite': { shape: 'puntual', empty: {} },
	Intervalo: { shape: 'relativa', empty: { every: Number.NaN, unit: 'horas' } }
};

const SELECTORS: Record<string, (changes: PanelChanges, value: string) => TaskData> = {
	'Se repite': ({ onOpen, form }, value) => {
		const { shape, empty } = ofTable(REPEATS, value, 'Opción de Se repite');
		const base = onOpen.data.shape === shape ? onOpen.data : { shape, ...empty };
		return { ...base, ...commonOf(form.data) } as TaskData;
	}
};

function changeSchedule(world: World, schedule: TypedSchedule): void {
	const changes = thePanelOpen(world);
	changes.form = { ...changes.form, data: { ...changes.form.data, schedule } };
}

// ---- Los avisos ----

const ACTIONS_FIXED: Record<string, PanelAction | 'borrar tarea'> = { Pausar: 'pausar', Reanudar: 'reanudar', 'Quitar posponer': 'quitar posponer', 'Borrar tarea': 'borrar tarea' };

function actionOf(text: string): PanelAction | 'borrar tarea' {
	const option = POSTPONE_OPTIONS.find(({ option }) => text === `Posponer ${option}`);
	return option ? optionAction(option.option) : ofTable(ACTIONS_FIXED, text, 'Acción');
}

function theNotice(world: World, changes: PanelChanges): ChangesNotice {
	if (changes.top === 'aviso de cierre') return CLOSE_NOTICE;
	const { taskOnOpen, action } = changes;
	const notice = changes.top === 'aviso de acción' && taskOnOpen && action && actionNotice(actionContext(world, changes, taskOnOpen, action));
	if (!notice) throw new Error('No hay un aviso abierto');
	return notice;
}

function closePanel(world: World): void {
	world.panel = undefined;
}

function act(world: World, task: Task, change: TaskChange): void {
	rememberBeforeOfMyChange(world);
	world.docs = applyChange(world.docs, task.id, change);
	closePanel(world);
}

/** Elegir la acción: el panel, con la tarea de ahora, tiene que ofrecerla (§6.2). */
function chooseAction(world: World, text: string, moment: string): void {
	const changes = thePanelOpen(world);
	changes.now = dateHour(moment);
	const action = actionOf(text);
	const task = changes.taskOnOpen;
	if (!task) throw new Error('Las acciones son solo al editar');
	const effect = whatTheActionDoes(action, withChanges(changes));
	if (action === 'borrar tarea' || effect === 'pide confirmar el borrado') {
		changes.top = 'confirmación de Borrar tarea';
		return;
	}
	const context = actionContext(world, changes, task, action);
	if (effect === 'abre el aviso de acción') {
		expect(actionNotice(context)).toBeDefined();
		changes.top = 'aviso de acción';
		changes.action = action;
	} else {
		expect(discardAndAct(context)).toBeDefined();
		act(world, context.task, changeOfAction(action, context.now));
	}
}

/** Si Guardar falla (§6.2): no se ejecuta nada, el aviso se cierra y el panel sigue con lo escrito. */
function failureSave(world: World, changes: PanelChanges, errors: World['errors']): void {
	world.errors = errors;
	topClose(changes);
}

function saveFromClosing(world: World, changes: PanelChanges): void {
	const { taskOnOpen, form } = changes;
	const current = taskOnOpen && tasksOf(world).find(({ id }) => id === taskOnOpen.id);
	if (current) {
		const editing = editFromPanel(current, form, theMoment(changes));
		if (!editing.ok) return failureSave(world, changes, editing.errors);
		return act(world, current, editing.change);
	}
	const creation = createFromPanel(form, newId(world, 'tarea'), theMoment(changes));
	if (!creation.ok) return failureSave(world, changes, creation.errors);
	world.docs = [...world.docs, creation.task];
	closePanel(world);
}

function saveAndActStep(world: World, changes: PanelChanges, context: NoticeAction): void {
	const result = saveAndAct(context);
	if (result.result === 'rechazado') return failureSave(world, changes, result.errors);
	if (result.result === 'aviso cerrado') return topClose(changes);
	if (result.result === 'aviso actualizado') return;
	act(world, context.task, result.change);
}

function discardAndActStep(world: World, changes: PanelChanges, context: NoticeAction): void {
	const change = discardAndAct(context);
	if (change) act(world, context.task, change);
	else topClose(changes);
}

function tapButton(world: World, changes: PanelChanges, { effect }: NoticeButton): void {
	if (effect === 'seguir editando') return topClose(changes);
	const { taskOnOpen, action } = changes;
	if (changes.top === 'aviso de acción' && taskOnOpen && action) {
		const context = actionContext(world, changes, taskOnOpen, action);
		return effect === 'guardar' ? saveAndActStep(world, changes, context) : discardAndActStep(world, changes, context);
	}
	if (effect === 'guardar') return saveFromClosing(world, changes);
	closePanel(world);
}

function tapInNotice(world: World, text: string, moment?: string): void {
	const changes = thePanelOpen(world);
	if (moment !== undefined) changes.now = dateHour(moment);
	const button = theNotice(world, changes).buttons.find((candidate) => candidate.text === text);
	if (!button) throw new Error(`El aviso no ofrece "${text}"`);
	tapButton(world, changes, button);
}

function closePanelFrom(world: World, changes: PanelChanges, effect: 'cierra el panel' | 'abre el aviso de cierre'): void {
	if (effect === 'cierra el panel') closePanel(world);
	else changes.top = 'aviso de cierre';
}

function tapBack(world: World): void {
	const changes = thePanelOpen(world);
	world.tapBack = true;
	const undoTop = changes.top === 'nada' && world.noticeOfUndoOpen === true;
	const effect = whatBackDoes({ top: undoTop ? 'aviso de deshacer' : changes.top, hasChanges: withChanges(changes), keyboardOpen: changes.keyboardOpen });
	if (effect === 'cierra el teclado') changes.keyboardOpen = false;
	else if (effect !== 'cierra lo de arriba') closePanelFrom(world, changes, effect);
	else if (undoTop) world.noticeOfUndoOpen = false;
	else topClose(changes);
}

/** El título que se escribe en cada estado del paso "el panel está abierto". */
const TITLE_ON_OPEN = 'Pagar';
const PANEL_STATUSES: Record<string, string | undefined> = { 'con cambios sin guardar': 'Pagar luz', 'sin cambios': undefined };

const DOES_NOT_ASK = 'no pregunta';
const ASKS_CONFIRMATION = 'pide confirmación';

export const unsavedChangesSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^abro el panel para editar la tarea ${P} con nota ${P}$`),
		run: (world, title, note) => openForEdit(world, { title, note })
	},
	{
		pattern: new RegExp(`^abro el panel para editar la tarea ${P} con versión mínima ${P}$`),
		run: (world, title, minimalVersion) => openForEdit(world, { title, minimalVersion })
	},
	{
		pattern: new RegExp(`^abro el panel para editar la tarea ${P} con primer paso ${P}$`),
		run: (world, title, firstStep) => openForEdit(world, { title, firstStep })
	},
	{
		pattern: new RegExp(`^abro el panel para editar la tarea ${P} con los pasos ${P}$`),
		run: (world, title, steps) => {
			const [firstStep, ...more] = list(steps);
			openForEdit(world, { title, firstStep, steps: more });
		}
	},
	{
		pattern: /^toco Agregar paso$/,
		run: (world) => changeSteps(world, (steps) => [...steps, ''])
	},
	{
		pattern: new RegExp(`^toco Quitar en el campo ${P}$`),
		run: (world, field) => {
			changeSteps(world, (steps, form) => steps.filter((_, place) => place !== stepPlace(form, field)));
		}
	},
	{
		pattern: new RegExp(`^abro el panel para editar la tarea ${P} con los horarios ${P} y ${P}$`),
		run: (world, title, first, second) => openForEdit(world, { title, schedule: [timeWindow(first), timeWindow(second)] })
	},
	{
		pattern: /^abro el panel para crear una tarea$/,
		run: (world) => {
			world.panel = { pause: undefined, changes: changesOnCreate(DATA_ON_CREATE) };
		}
	},
	{
		pattern: new RegExp(`^el panel está abierto ${P}$`),
		run: (world, status) => {
			const written = ofTable(PANEL_STATUSES, status, 'Estado del panel');
			openForEdit(world, { title: TITLE_ON_OPEN });
			if (written) write(world, 'Título', written);
		}
	},
	{
		pattern: new RegExp(`^encima del panel hay ${P}$`),
		run: (world, onTop) => {
			const changes = thePanelOpen(world);
			changes.top = ofTable(ON_TOP_NAMES, onTop, 'Lo de arriba');
			// Una tarea puntual sin posponer ofrece Posponer: su aviso de acción puede estar abierto (§5.9).
			if (changes.top === 'aviso de acción') changes.action = optionAction('1 hora');
		}
	},
	{
		pattern: /^el aviso de deshacer está abierto$/,
		run: (world) => {
			world.noticeOfUndoOpen = true;
		}
	},
	{
		pattern: /^el aviso de deshacer sigue abierto$/,
		run: (world) => expect(world.noticeOfUndoOpen).toBe(true)
	},
	{
		pattern: /^el teclado en pantalla está abierto$/,
		run: (world) => {
			thePanelOpen(world).keyboardOpen = true;
		}
	},
	{
		pattern: new RegExp(`^escribo ${P} en el campo ${P}$`),
		run: (world, value, field) => write(world, field, value)
	},
	{
		pattern: new RegExp(`^escribo ${P} con espacios alrededor en el campo ${P}$`),
		run: (world, value, field) => write(world, field, `  ${value}  `)
	},
	{
		pattern: new RegExp(`^escribo solo espacios en el campo ${P}$`),
		run: (world, field) => write(world, field, '   ')
	},
	{
		pattern: new RegExp(`^vacío el campo ${P}$`),
		run: (world, field) => write(world, field, '')
	},
	{
		pattern: new RegExp(`^elijo ${P} en ${P}$`),
		run: (world, value, selector) => {
			const changes = thePanelOpen(world);
			changes.form = { ...changes.form, data: ofTable(SELECTORS, selector, 'Selector')(changes, value) };
		}
	},
	{
		pattern: new RegExp(`^cambio los horarios a ${P} y ${P}$`),
		run: (world, first, second) => changeSchedule(world, [timeWindow(first), timeWindow(second)])
	},
	{
		pattern: /^agrego una fila de horario vacía$/,
		run: (world) => changeSchedule(world, [...(thePanelOpen(world).form.data.schedule ?? []), { from: '', to: '' }])
	},
	{
		pattern: /^toco la X del panel$/,
		run: (world) => {
			const changes = thePanelOpen(world);
			closePanelFrom(world, changes, onClosePanel(withChanges(changes)));
		}
	},
	{
		pattern: /^toco Atrás$/,
		run: tapBack
	},
	{
		pattern: new RegExp(`^toco ${P} en el aviso$`),
		run: (world, button) => tapInNotice(world, button)
	},
	{
		pattern: new RegExp(`^toco ${P} en el aviso el ${P}$`),
		run: (world, button, moment) => tapInNotice(world, button, moment)
	},
	{
		pattern: new RegExp(`^elijo la acción ${P} el ${P}$`),
		run: chooseAction
	},
	{
		pattern: new RegExp(`^pasa el tiempo hasta ${P}$`),
		run: (world, moment) => {
			thePanelOpen(world).now = dateHour(moment);
		}
	},
	{
		pattern: new RegExp(`^queda abierto ${P}$`),
		run: (world, opened) => {
			const changes = panelOnDay(world);
			expect(changes ? (OPEN[changes.top] ?? 'el panel') : 'nada').toBe(opened);
		}
	},
	{
		pattern: new RegExp(`^el aviso dice ${P}$`),
		run: (world, message) => expect(theNotice(world, thePanelOpen(world)).message).toBe(message)
	},
	{
		pattern: new RegExp(`^el aviso ofrece ${P}$`),
		run: (world, buttons) => expect(theNotice(world, thePanelOpen(world)).buttons.map(({ text }) => text)).toEqual(list(buttons))
	},
	{
		pattern: new RegExp(`^el campo ${P} sigue con ${P}$`),
		run: (world, field, value) => expect(fieldOf(field).reads(thePanelOpen(world).form)).toBe(value)
	},
	{
		pattern: new RegExp(`^al recargar la app el navegador ${P}$`),
		run: (world, response) => {
			const changes = panelOnDay(world);
			expect(changes && withChanges(changes) ? ASKS_CONFIRMATION : DOES_NOT_ASK).toBe(response);
		}
	},
	{
		// §6.2: la confirmación del navegador es de recargar o cerrar la app; Atrás con el panel abierto no sale de la pantalla.
		pattern: new RegExp(`^el navegador ${P}$`),
		run: (world, response) => {
			expect(world.tapBack).toBe(true);
			expect(DOES_NOT_ASK).toBe(response);
		}
	}
];
