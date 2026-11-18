// Unsaved changes and Atrás (spec §6.2, §7): what is written in the panel, the notices that closing
// it or using an action opens, and what Atrás closes. The panel is world.panel; what it writes and what
// it has on top, world.panel.changes. With the panel closed, world.panel does not exist.
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

/** A malformed value fails the scenario: nothing is interpreted by resemblance. */
function ofTable<T>(table: Record<string, T>, value: string, that: string): T {
	if (!Object.hasOwn(table, value)) throw new Error(`Invalid ${that}: "${value}"`);
	return table[value];
}

function openForEdit(world: World, data: CommonData): void {
	recordCreation(world, (id) => createOneOff(data, id, SCENARIO_BEFORE));
	expect(world.errors).toBeUndefined();
	const task = theTask(world);
	world.panel = { pause: undefined, changes: changesOnEdit(task) };
}

/** The "HH:MM-HH:MM" window of a step. */
function timeWindow(value: string): TypedSchedule[number] {
	const parts = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(value);
	if (!parts) throw new Error(`Invalid window: "${value}"`);
	return { from: parts[1], to: parts[2] };
}

function actionContext(world: World, changes: PanelChanges, taskOnOpen: Task, action: PanelAction): NoticeAction {
	const task = tasksOf(world).find(({ id }) => id === taskOnOpen.id);
	if (!task) throw new Error('The task of the panel no longer exists');
	return { action, taskOnOpen, task, completions: world.completions, now: theMoment(changes), form: changes.form };
}

/** What another device or the passage of time did while the panel was open (§6.2, §7). */
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
	if (!changes) throw new Error('The panel is not open');
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

// ---- What is written ----

const FIELDS: Record<string, { reads: (f: PanelForm) => string | undefined; writes: (f: PanelForm, value: string) => PanelForm }> = {
	Título: { reads: (f) => f.data.title, writes: (f, title) => ({ ...f, data: { ...f.data, title } }) },
	Nota: { reads: (f) => f.data.note, writes: (f, note) => ({ ...f, data: { ...f.data, note } }) },
	'Primer paso': { reads: (f) => f.data.firstStep, writes: (f, firstStep) => ({ ...f, data: { ...f.data, firstStep } }) },
	'Versión mínima': { reads: (f) => f.data.minimalVersion, writes: (f, minimalVersion) => ({ ...f, data: { ...f.data, minimalVersion } }) }
};

/** The extra steps of the panel: the «Paso N» field (N ≥ 2) is place N - 2 of `steps` (§6.2). */
const STEP_PLACE = /^Paso (\d+)$/;

function stepPlace(form: PanelForm, field: string): number {
	const place = Number(STEP_PLACE.exec(field)?.[1]) - 2;
	if (!(place >= 0 && place < (form.data.steps ?? []).length)) throw new Error(`Invalid field: "${field}"`);
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

/** «Agregar paso» adds an empty field at the end; «Quitar» removes the field's own (§6.2). */
function changeSteps(world: World, change: (steps: readonly string[], form: PanelForm) => string[]): void {
	const changes = thePanelOpen(world);
	const { form } = changes;
	changes.form = { ...form, data: { ...form.data, steps: change(form.data.steps ?? [], form) } };
}

const commonOf = ({ title, emoji, note, firstStep, steps, minimalVersion, schedule }: TaskData): CommonData => ({ title, emoji, note, firstStep, steps, minimalVersion, schedule });

/** The fields of each "Se repite" option: those of the task if it has that shape; otherwise, as when creating (§6.2). */
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

// ---- The notices ----

const ACTIONS_FIXED: Record<string, PanelAction | 'borrar tarea'> = { Pausar: 'pausar', Reanudar: 'reanudar', 'Quitar posponer': 'quitar posponer', 'Borrar tarea': 'borrar tarea' };

function actionOf(text: string): PanelAction | 'borrar tarea' {
	const option = POSTPONE_OPTIONS.find(({ option }) => text === `Posponer ${option}`);
	return option ? optionAction(option.option) : ofTable(ACTIONS_FIXED, text, 'Acción');
}

function theNotice(world: World, changes: PanelChanges): ChangesNotice {
	if (changes.top === 'aviso de cierre') return CLOSE_NOTICE;
	const { taskOnOpen, action } = changes;
	const notice = changes.top === 'aviso de acción' && taskOnOpen && action && actionNotice(actionContext(world, changes, taskOnOpen, action));
	if (!notice) throw new Error('There is no open notice');
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

/** Choosing the action: the panel, with the current task, has to offer it (§6.2). */
function chooseAction(world: World, text: string, moment: string): void {
	const changes = thePanelOpen(world);
	changes.now = dateHour(moment);
	const action = actionOf(text);
	const task = changes.taskOnOpen;
	if (!task) throw new Error('Actions only exist when editing');
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

/** If Guardar fails (§6.2): nothing is executed, the notice closes and the panel keeps what was written. */
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
	if (!button) throw new Error(`The notice does not offer "${text}"`);
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

/** The title written in each state of the step "el panel está abierto". */
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
			// A one-off task without postponement offers Posponer: its action notice may be open (§5.9).
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
		// §6.2: the browser confirmation is for reloading or closing the app; Atrás with the panel open does not leave the screen.
		pattern: new RegExp(`^el navegador ${P}$`),
		run: (world, response) => {
			expect(world.tapBack).toBe(true);
			expect(DOES_NOT_ASK).toBe(response);
		}
	}
];
