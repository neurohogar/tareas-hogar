// Oracle for the panel (§6.2), rewritten from the spec. Two parts:
// - Tabbed: 40rem cutoff, sections per mode, section of each field, order of the first error
//   and the Save bar with the keyboard.
// - Unsaved changes and Back: what counts as a change, the close and action notices, and what
//   Back closes (also §5.8, §5.9 and §7, "deletion wins").
// It does NOT import the core or the step handlers.
import { NUMBER, elements, writtenOf, date, scheduleValid, intervalMs, intervalValid, postponementOf, resolve, type RowOracle, type StepOracle, type Postponement } from './oracle';

/** §6.2: "celular" is a screen up to 40rem wide, inclusive. */
const MAX_PHONE_WIDTH = 40;
/** §6.2 Errors: the section of each field, in the order the fields appear (§6.2 Tarea and Cuándo). */
const FIELD_SECTION: [string, string][] = [
	['Título', 'Tarea'],
	['fecha límite', 'Cuándo'],
	['Cada', 'Cuándo'],
	['días', 'Cuándo'],
	['horario', 'Cuándo']
];
/** §6.2: when creating there are no Actions; when editing it always appears. */
const SECTIONS_BY_MODE: Record<string, string> = { crear: 'Tarea, Cuándo', editar: 'Tarea, Cuándo, Acciones' };
/** §6.2: a focused field with no on-screen keyboard does not hide the bar: focus does not decide. */
const PANEL_FOCUSES = ['un campo está enfocado', 'ningún campo está enfocado'];

interface PanelWorld {
	width?: number;
	mode?: string;
	/** The fields with an error, in the order they appear; undefined until a step declares them. */
	fields?: [string, string][];
	keyboard?: string;
}

/** The cell's fields in the order of §6.2; undefined if any is not a panel field. */
function panelFields(value: string): [string, string][] | undefined {
	if (value === 'ninguno') return [];
	const names = elements(value);
	if (!names || names.some((name) => !FIELD_SECTION.some(([field]) => field === name))) return undefined;
	return FIELD_SECTION.filter(([field]) => names.includes(field));
}

const inTabs = (m: PanelWorld) => m.width !== undefined && m.width <= MAX_PHONE_WIDTH;

/** Each panel Given leaves its part in the world; returns false if the value is not one the spec defines. */
const PANEL_ENTRIES: [RegExp, (m: PanelWorld, value: string) => boolean][] = [
	[
		/^a screen (\S+) rem wide$/,
		(m, value) => {
			m.width = Number(value);
			return NUMBER.test(value) && m.width > 0;
		}
	],
	[
		/^the panel opens for (.+)$/,
		(m, value) => {
			m.mode = value;
			return value in SECTIONS_BY_MODE;
		}
	],
	[
		/^(?:the panel shows errors|saving fails with errors) in the fields (.+)$/,
		(m, value) => {
			m.fields = panelFields(value);
			return m.fields !== undefined;
		}
	],
	[
		/^the on-screen keyboard is (.+)$/,
		(m, value) => {
			m.keyboard = value;
			return value === 'abierto' || value === 'cerrado';
		}
	],
	[/^the focus is (.+)$/, (_m, value) => PANEL_FOCUSES.includes(value)]
];

/** What each Then observes according to the spec; undefined if the world is not enough to decide it. */
const PANEL_OBSERVATIONS: [RegExp, (m: PanelWorld) => string | undefined][] = [
	[/^the panel is presented (.+)$/, (m) => (m.width === undefined ? undefined : inTabs(m) ? 'en pestañas' : 'en secciones seguidas')],
	[/^the panel offers the sections (.+)$/, (m) => (m.mode === undefined ? undefined : SECTIONS_BY_MODE[m.mode])],
	// §6.2: it always opens on Tarea, when creating and when editing.
	[/^the open tab is (.+)$/, (m) => (m.mode === undefined ? undefined : 'Tarea')],
	[
		/^the marked sections are (.+)$/,
		(m) => (m.fields === undefined ? undefined : [...new Set(m.fields.map(([, section]) => section))].join(', ') || 'ninguna')
	],
	// §6.2: Tarea before Cuándo; on wide screens there are no tabs.
	[/^the panel jumps to the tab (.+)$/, (m) => (m.width === undefined || !m.fields?.length ? undefined : inTabs(m) ? m.fields[0][1] : 'ninguna')],
	[/^the content scrolls to the field (.+)$/, (m) => m.fields?.[0]?.[0]],
	// §6.2: the bar is hidden only while the on-screen keyboard is open.
	[/^the Guardar bar is (.+)$/, (m) => (m.keyboard === undefined ? undefined : m.keyboard === 'abierto' ? 'oculta' : 'visible')]
];

const IS_OF_PANEL = /^(?:a screen |the panel opens for |the panel shows errors |saving fails with errors |the on-screen keyboard is )/;

export const isScenarioOfPanel = (texts: string[]) => texts.some((text) => IS_OF_PANEL.test(text));

function runEntryOfPanel(text: string, m: PanelWorld): boolean {
	const rule = PANEL_ENTRIES.map(([pattern, apply]) => ({ matches: pattern.exec(text), apply })).find((r) => r.matches);
	return rule?.matches ? rule.apply(m, rule.matches[1]) : false;
}

function observeThenOfPanel(text: string, m: PanelWorld): [string, string] | undefined {
	const rule = PANEL_OBSERVATIONS.map(([pattern, view]) => ({ matches: pattern.exec(text), view })).find((r) => r.matches);
	const observed = rule?.view(m);
	return rule?.matches && observed !== undefined ? [observed, rule.matches[1]] : undefined;
}

/**
 * What each Then observes and asserts after the Givens with the row, or undefined if the oracle does not recognize
 * some step or value.
 */
export function observePanel(entries: StepOracle[], thens: StepOracle[], row: RowOracle): { observed: string[]; asserted: string[] } | undefined {
	const m: PanelWorld = {};
	for (const step of entries) {
		const text = resolve(step.text, row);
		if (text === undefined || !runEntryOfPanel(text, m)) return undefined;
	}
	const results = thens.map((step) => {
		const text = resolve(step.text, row);
		return text === undefined ? undefined : observeThenOfPanel(text, m);
	});
	if (results.some((result) => result === undefined)) return undefined;
	const pairs = results as [string, string][];
	return { observed: pairs.map(([observed]) => observed), asserted: pairs.map(([, asserted]) => asserted) };
}

// ---- §6.2: Unsaved changes and Back ----

class Undecided extends Error {}
const undecided = (reason: string): never => {
	throw new Undecided(reason);
};

/** What the panel form holds: the values Save would normalize, not yet normalized. */
interface Form {
	title: string;
	note: string;
	/** §4.1: one line; Save trims it and empty means no first step. */
	firstStep: string;
	/** §4.1 (Pasos): the steps plus, one per field «Paso 2», «Paso 3»…; Save trims them and drops the empty ones. */
	steps: string[];
	/** §4.1 (Versión mínima): one line; Save trims it and empty means no minimal version. */
	minimalVersion: string;
	repeats: string;
	/** The windows as typed; '' is an empty row. */
	schedules: string[];
	emoji: string;
}

interface TaskSaved {
	title: string;
	recurring: boolean;
	/** The interval in ms; undefined for a one-off. */
	interval?: number;
	paused: boolean;
	postponed?: Postponement;
}

interface ChangesWorld {
	task?: TaskSaved;
	onOpen?: Form;
	written?: Form;
	mode?: 'crear' | 'editar';
	/** What is on top of the panel; 'nada' with nothing on top. */
	onTop: string;
	action?: string;
	now?: string;
	keyboard: boolean;
	undo: boolean;
	tapBack: boolean;
	choseEmoji: boolean;
}

const FORM_ON_CREATE: Form = { title: '', note: '', firstStep: '', steps: [], minimalVersion: '', repeats: 'No se repite', schedules: [], emoji: '' };
const OF_TOP = ['nada', 'el aviso de cierre', 'el aviso de acción', 'la confirmación de Borrar tarea', 'el selector de emoji'];
/** §6.2 Back: what does not count as something open on top of the panel. */
const DOES_NOT_COUNT_AS_OPEN = ['nada'];
const REPEATS_THAT_KNOWS = ['No se repite', 'Intervalo'];
const ACTIONS = ['pausar', 'reanudar', 'quitar posponer', 'posponer 1 hora', 'posponer 3 horas', 'posponer hasta mañana'];
const POSTPONE_OPTION = /^posponer (.+)$/;
const CHANGES_MESSAGE = 'Tenés cambios sin guardar';
/** The moment the tasks of these steps are created: earlier than any scenario date (2000-01-01). */
const CREATED_BEFORE_OF_SCENARIO = new Date(2000, 0, 1).getTime();
const TIME_WINDOW_WRITTEN = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/;

const theWritten = (m: ChangesWorld): Form => m.written ?? undecided('panel cerrado');

const schedulesKey = (schedules: string[]) => [...schedules].sort().join(' ');

/** §4.1 (Pasos): Save trims each step, drops the empty ones and those below move up. */
const stepsSaved = (f: Form) => [f.firstStep, ...f.steps].map((step) => step.trim()).filter((step) => step !== '');

/** §6.2: Save trims the title, the note, the steps and the minimal version and sorts the windows. */
const formKey = (f: Form) =>
	JSON.stringify([f.title.trim(), f.note.trim(), stepsSaved(f), f.minimalVersion.trim(), f.repeats, schedulesKey(f.schedules), f.emoji]);

/** §6.2: what Save would change. */
function hasChanges(m: ChangesWorld): boolean {
	const written = theWritten(m);
	if (!m.onOpen) return undecided('panel sin valores al abrir');
	return formKey(m.onOpen) !== formKey(written);
}

/** §4.1 and §4.2: what is typed can be saved. Interval without Cada, if the task was not an interval one, cannot. */
function savable(m: ChangesWorld): boolean {
	const f = theWritten(m);
	const everyEmpty = f.repeats === 'Intervalo' && m.task?.interval === undefined;
	return f.title.trim() !== '' && !f.schedules.includes('') && !everyEmpty;
}

/** §5.8: switching to one-off resumes. The task's state is recomputed with the new definition (§6.2). */
function asWouldRemain(m: ChangesWorld, task: TaskSaved): TaskSaved {
	const f = theWritten(m);
	const recurring = f.repeats !== 'No se repite';
	return { ...task, title: f.title.trim(), recurring, interval: recurring ? task.interval : undefined, paused: recurring && task.paused };
}

const theNow = (m: ChangesWorld): number => (m.now === undefined ? undefined : date(m.now)) ?? undecided('sin momento');

function active({ postponed }: TaskSaved, now: number): Postponement | undefined {
	if (postponed && now < postponed.from) undecided('relojes desfasados');
	return postponed && now < postponed.to ? postponed : undefined;
}

/** §5.1–§5.3: with no completions, a one-off without a due date is pending and a relative one, once its interval has elapsed, too. */
function pendingOOverdue({ recurring, interval }: TaskSaved, now: number): boolean {
	if (!recurring) return true;
	return interval !== undefined && now - CREATED_BEFORE_OF_SCENARIO >= interval ? true : undecided('estado de la periódica');
}

/** §5.8, §5.9 and §6.2: the conditions under which the panel shows each action. */
function shows(action: string, task: TaskSaved, now: number): boolean {
	if (action === 'pausar') return task.recurring && !task.paused;
	if (action === 'reanudar') return task.recurring && task.paused;
	if (action === 'quitar posponer') return active(task, now) !== undefined;
	return !task.paused && !active(task, now) && pendingOOverdue(task, now);
}

/** §6.2: the action's notice with the task and the now of the moment; undefined if the action no longer applies. */
function actionNotice(m: ChangesWorld): { message: string; buttons: string[] } | undefined {
	const action = m.action ?? undecided('aviso sin acción');
	const task = m.task ?? undecided('aviso sin tarea');
	const now = theNow(m);
	if (!shows(action, task, now)) return undefined;
	const withSave = ['Seguir editando', `Descartar y ${action}`, `Guardar y ${action}`];
	if (savable(m) && !shows(action, asWouldRemain(m, task), now))
		return { message: `Con estos cambios la tarea ya no se puede ${action}`, buttons: withSave.slice(0, 2) };
	return { message: CHANGES_MESSAGE, buttons: withSave };
}

/** §6.2 and §7: what another device or time did with the panel open. */
function onDay(m: ChangesWorld): void {
	if (m.mode === 'editar' && !m.task) closePanel(m);
	if (m.onTop === 'el aviso de acción' && m.action !== undefined && !actionNotice(m)) topClose(m);
}

function closePanel(m: ChangesWorld): void {
	m.written = undefined;
	m.mode = undefined;
	topClose(m);
}

function topClose(m: ChangesWorld): void {
	m.onTop = 'nada';
	m.action = undefined;
}

function closeWithX(m: ChangesWorld): void {
	if (hasChanges(m)) m.onTop = 'el aviso de cierre';
	else closePanel(m);
}

function applyAction(action: string, task: TaskSaved, moment: string): TaskSaved {
	if (action === 'pausar') return { ...task, paused: true };
	if (action === 'reanudar') return { ...task, paused: false };
	if (action === 'quitar posponer') return { ...task, postponed: undefined };
	const option = POSTPONE_OPTION.exec(action)?.[1] ?? undecided(`acción ${action}`);
	return { ...task, postponed: postponementOf(option, moment) ?? undecided('posposición') };
}

function saveFromClosing(m: ChangesWorld): void {
	if (!savable(m)) return topClose(m);
	m.task = asWouldRemain(m, m.task ?? { title: '', recurring: false, paused: false });
	closePanel(m);
}

const momentOf = (m: ChangesWorld) => m.now ?? undecided('sin momento');

function tapInNoticeOfAction(m: ChangesWorld, button: string): void {
	const notice = actionNotice(m);
	const action = m.action ?? undecided('aviso sin acción');
	const task = m.task ?? undecided('aviso sin tarea');
	if (!notice) return topClose(m);
	if (!notice.buttons.includes(button)) undecided(`botón ${button}`);
	if (button === 'Seguir editando') return topClose(m);
	if (button === `Descartar y ${action}`) m.task = applyAction(action, task, momentOf(m));
	else if (!savable(m)) return topClose(m);
	else m.task = applyAction(action, asWouldRemain(m, task), momentOf(m));
	closePanel(m);
}

function tapInNotice(m: ChangesWorld, button: string): void {
	if (m.onTop === 'el aviso de acción') return tapInNoticeOfAction(m, button);
	if (m.onTop !== 'el aviso de cierre') undecided('no hay aviso');
	if (button === 'Seguir editando') topClose(m);
	else if (button === 'Descartar') closePanel(m);
	else if (button === 'Guardar') saveFromClosing(m);
	else undecided(`botón ${button}`);
}

/** §6.2: the Delete task button only asks for confirmation; the other actions, with changes, open their notice; without changes, they act. */
function chooseAction(m: ChangesWorld, text: string, moment: string): void {
	m.now = moment;
	const action = text.toLowerCase();
	if (text === 'Borrar tarea') {
		m.onTop = 'la confirmación de Borrar tarea';
		return;
	}
	if (!ACTIONS.includes(action)) undecided(`acción ${text}`);
	const task = m.task ?? undecided('acción sin tarea');
	if (!shows(action, task, theNow(m))) undecided('el panel no ofrece la acción');
	if (hasChanges(m)) {
		m.onTop = 'el aviso de acción';
		m.action = action;
		return;
	}
	m.task = applyAction(action, task, moment);
	closePanel(m);
}

/** §6.2 Back: the keyboard first; then only the topmost thing; with nothing on top, like the X. */
function tapBack(m: ChangesWorld): void {
	m.tapBack = true;
	if (m.keyboard) m.keyboard = false;
	else if (DOES_NOT_COUNT_AS_OPEN.includes(m.onTop)) closeWithX(m);
	else topClose(m);
}

/** Creates the step's one-off (§4.1: non-empty title) and opens the panel with its values (§6.2). */
function openForEdit(m: ChangesWorld, values: Partial<Form> & { title: string }): void {
	if (values.title.trim() === '') undecided('empty title');
	m.task = { title: values.title.trim(), recurring: false, paused: false };
	openWithTask(m, values);
}

function openWithTask(m: ChangesWorld, values: Partial<Form> & { title: string }): void {
	m.mode = 'editar';
	openWith(m, { ...FORM_ON_CREATE, repeats: m.task?.recurring ? 'Intervalo' : 'No se repite', ...values });
}

/** The form starts with the values on opening; what is typed does not change those values. */
function openWith(m: ChangesWorld, onOpen: Form): void {
	m.onOpen = onOpen;
	m.written = { ...onOpen, steps: [...onOpen.steps], schedules: [...onOpen.schedules] };
}

function timeWindowsValid(first: string, second: string): string[] {
	const parts = [first, second].map((timeWindow) => TIME_WINDOW_WRITTEN.exec(timeWindow) ?? undecided(`ventana ${timeWindow}`));
	if (!scheduleValid(writtenOf([parts[0][1], parts[0][2], parts[1][1], parts[1][2]]))) undecided('horario inválido');
	return [first, second];
}

/** §6.2: the field «Paso N» (N ≥ 2) is slot N - 2 of the extra steps; it has to exist. */
const STEP_PLACE = /^Paso (\d+)$/;

function stepPlace(f: Form, field: string): number {
	const place = Number(STEP_PLACE.exec(field)?.[1]) - 2;
	return place >= 0 && place < f.steps.length ? place : undecided(`campo ${field}`);
}

function writeIn(m: ChangesWorld, field: string, value: string): void {
	const f = theWritten(m);
	if (field === 'Título') f.title = value;
	else if (field === 'Nota') f.note = value;
	else if (field === 'Primer paso') f.firstStep = value;
	else if (field === 'Versión mínima') f.minimalVersion = value;
	else if (STEP_PLACE.test(field)) f.steps[stepPlace(f, field)] = value;
	else undecided(`campo ${field}`);
}

function chooseIn(m: ChangesWorld, selector: string, value: string): void {
	const f = theWritten(m);
	if (selector === 'Se repite' && REPEATS_THAT_KNOWS.includes(value)) f.repeats = value;
	else undecided(`selector ${selector}: ${value}`);
}

const theTaskOfOther = (m: ChangesWorld) => m.task ?? undecided('otro dispositivo sin tarea');

const CHANGES_STEPS: [RegExp, (m: ChangesWorld, ...groups: string[]) => void][] = [
	[/^I open the panel to edit the task (.+) with note (.+)$/, (m, title, note) => openForEdit(m, { title, note })],
	[/^I open the panel to edit the task (.+) with minimal version (.+)$/, (m, title, minimalVersion) => openForEdit(m, { title, minimalVersion })],
	[/^I open the panel to edit the task (.+) with first step (.+)$/, (m, title, firstStep) => openForEdit(m, { title, firstStep })],
	[
		/^I open the panel to edit the task (.+) with the steps (.+)$/,
		(m, title, steps) => {
			const [firstStep, ...more] = elements(steps) ?? undecided(`pasos ${steps}`);
			openForEdit(m, { title, firstStep, steps: more });
		}
	],
	[/^I tap Agregar paso$/, (m) => void theWritten(m).steps.push('')],
	[
		/^I tap Quitar in the field (.+)$/,
		(m, field) => {
			const f = theWritten(m);
			f.steps.splice(stepPlace(f, field), 1);
		}
	],
	[/^I open the panel to edit the task (.+) with the schedules (.+) and (.+)$/, (m, title, a, b) => openForEdit(m, { title, schedules: timeWindowsValid(a, b) })],
	[
		/^I open the panel to create a task$/,
		(m) => {
			m.mode = 'crear';
			openWith(m, FORM_ON_CREATE);
		}
	],
	[
		/^the panel is open (.+)$/,
		(m, status) => {
			if (status !== 'con cambios sin guardar' && status !== 'sin cambios') undecided(`estado ${status}`);
			openForEdit(m, { title: 'Pagar' });
			if (status === 'con cambios sin guardar') theWritten(m).title = 'Pagar luz';
			// The action notice declared by "encima del panel hay" is that of a one-off that can be postponed.
			m.now = '2026-07-15T08:00:00';
		}
	],
	[
		/^on top of the panel there is (.+)$/,
		(m, onTop) => {
			if (!OF_TOP.includes(onTop)) undecided(`encima ${onTop}`);
			m.onTop = onTop;
			if (onTop === 'el aviso de acción') m.action = 'posponer 1 hora';
		}
	],
	[/^the undo notice is open$/, (m) => void (m.undo = true)],
	[/^the on-screen keyboard is open$/, (m) => void (m.keyboard = true)],
	[
		/^a relative recurring task Regar every (.+) (.+)$/,
		(m, every, unit) => {
			const interval = intervalValid(every) ? intervalMs(every, unit) : undefined;
			m.task = { title: 'Regar', recurring: true, interval: interval ?? undecided('intervalo'), paused: false };
		}
	],
	[/^a one-off task without a due date$/, (m) => void (m.task = { title: 'Tarea', recurring: false, paused: false })],
	[/^the task Regar was paused$/, (m) => void (theTaskOfOther(m).paused = true)],
	[
		/^the task was postponed with option (.+) on (.+)$/,
		(m, option, moment) => {
			const task = theTaskOfOther(m);
			if (task.recurring) undecided('posponer una periódica antes de abrir');
			task.postponed = postponementOf(option, moment) ?? undecided('posposición');
		}
	],
	[
		/^I open the task in the edit panel on (.+)$/,
		(m, moment) => {
			m.now = moment;
			openWithTask(m, { title: theTaskOfOther(m).title });
		}
	],
	[/^I type (.+) with spaces around it in the field (.+)$/, (m, value, field) => writeIn(m, field, `  ${value}  `)],
	[/^I type only spaces in the field (.+)$/, (m, field) => writeIn(m, field, '   ')],
	[/^I clear the field (.+)$/, (m, field) => writeIn(m, field, '')],
	[/^I type (.+) in the field (.+)$/, (m, value, field) => writeIn(m, field, value)],
	[/^I choose the action (.+) on (.+)$/, (m, action, moment) => chooseAction(m, action, moment)],
	[
		/^I choose an emoji that was not among the recent ones$/,
		(m) => {
			theWritten(m).emoji = 'elegido';
			m.choseEmoji = true;
		}
	],
	[/^there are no recent emojis$/, () => undefined],
	[/^I choose (.+) in (.+)$/, (m, value, selector) => chooseIn(m, selector, value)],
	[/^I change the schedules to (.+) and (.+)$/, (m, a, b) => void (theWritten(m).schedules = timeWindowsValid(a, b))],
	[/^I add an empty schedule row$/, (m) => void theWritten(m).schedules.push('')],
	[/^I tap the X of the panel$/, closeWithX],
	[/^I tap Atrás$/, tapBack],
	[/^I tap (.+) in the notice on (.+)$/, (m, button, moment) => ((m.now = moment), tapInNotice(m, button))],
	[/^I tap (.+) in the notice$/, (m, button) => tapInNotice(m, button)],
	[/^time passes until (.+)$/, (m, moment) => void (m.now = moment)],
	[
		/^another device, without seeing that change, edits the title to (.+)$/,
		(m, title) => {
			if (title.trim() === '') undecided('empty title');
			theTaskOfOther(m).title = title.trim();
		}
	],
	[/^another device, without seeing that change, pauses the task$/, (m) => void (theTaskOfOther(m).paused = true)],
	[/^another device, without seeing that change, deletes the task$/, (m) => void (m.task = undefined)]
];

const OPEN_ON_TOP: Record<string, string> = {
	'el aviso de cierre': 'el panel con el aviso de cierre',
	'el aviso de acción': 'el panel con el aviso de acción',
	'la confirmación de Borrar tarea': 'el panel con la confirmación de Borrar tarea',
	'el selector de emoji': 'el panel con el selector de emoji'
};

function theNoticeOpen(m: ChangesWorld): { message: string; buttons: string[] } {
	if (m.onTop === 'el aviso de cierre') return { message: CHANGES_MESSAGE, buttons: ['Seguir editando', 'Descartar', 'Guardar'] };
	return (m.onTop === 'el aviso de acción' ? actionNotice(m) : undefined) ?? undecided('no hay aviso');
}

const FIELD_WRITTEN: Record<string, (f: Form) => string> = { Título: (f) => f.title, Nota: (f) => f.note, 'Primer paso': (f) => f.firstStep, 'Versión mínima': (f) => f.minimalVersion };

const whetherHasTask = (m: ChangesWorld, view: (t: TaskSaved) => string) => (m.task ? view(m.task) : 'sin tarea');
const instant = (value: string) => String(date(value) ?? undecided(`fecha ${value}`));
const thePostponed = ({ postponed }: TaskSaved) => (postponed ? `${postponed.from} ${postponed.to}` : 'sin posponer');

/** What each Then observes and asserts. */
const CHANGES_THENS: [RegExp, (m: ChangesWorld, ...groups: string[]) => [string, string]][] = [
	[/^what stays open is (.+)$/, (m, opened) => [m.written ? (OPEN_ON_TOP[m.onTop] ?? 'el panel') : 'nada', opened]],
	[/^the notice says (.+)$/, (m, message) => [theNoticeOpen(m).message, message]],
	[/^the notice offers (.+)$/, (m, buttons) => [theNoticeOpen(m).buttons.join(', '), elements(buttons)?.join(', ') ?? undecided('botones')]],
	[/^the field (.+) still has (.+)$/, (m, field, value) => [(FIELD_WRITTEN[field] ?? undecided(`campo ${field}`))(theWritten(m)), value]],
	[/^the task has title (.+)$/, (m, title) => [whetherHasTask(m, (t) => t.title), title]],
	[/^no task remains$/, (m) => [whetherHasTask(m, () => 'hay una'), 'sin tarea']],
	[/^a one-off task is created with title (.+)$/, (m, title) => [whetherHasTask(m, (t) => (t.recurring ? 'recurring' : t.title)), title]],
	[/^there is no task (.+)$/, (m) => [whetherHasTask(m, () => 'existe'), 'sin tarea']],
	[/^the task is paused$/, (m) => [whetherHasTask(m, (t) => String(t.paused)), 'true']],
	[/^the task is not paused$/, (m) => [whetherHasTask(m, (t) => String(t.paused)), 'false']],
	[/^the task is recurring$/, (m) => [whetherHasTask(m, (t) => String(t.recurring)), 'true']],
	[/^the task is postponed from (.+) to (.+)$/, (m, from, to) => [whetherHasTask(m, thePostponed), `${instant(from)} ${instant(to)}`]],
	[/^the first one is the one I chose$/, (m) => [String(m.choseEmoji), 'true']],
	[/^the undo notice is still open$/, (m) => [String(m.undo), 'true']],
	[/^on reloading the app the browser (.+)$/, (m, response) => [m.written && hasChanges(m) ? 'pide confirmación' : 'no pregunta', response]],
	// §6.2: never by Back with the panel open.
	[/^the browser (.+)$/, (m, response) => [m.tapBack ? 'no pregunta' : undecided('sin Atrás'), response]]
];

const IS_OF_CHANGES = /^(?:I open the panel to |the panel is open |I tap the X of the panel$|I tap Atrás$|I choose the action )/;

export const isScenarioOfChanges = (texts: string[]) => texts.some((text) => IS_OF_CHANGES.test(text));

function applyFirst<R>(rules: [RegExp, (m: ChangesWorld, ...groups: string[]) => R][], text: string, m: ChangesWorld): R {
	for (const [pattern, apply] of rules) {
		const matches = pattern.exec(text);
		if (matches) return apply(m, ...matches.slice(1));
	}
	return undecided(`paso ${text}`);
}

const resolved = (step: StepOracle, row: RowOracle) => resolve(step.text, row) ?? undecided(`columna en ${step.text}`);

/**
 * What each Then observes and asserts after the steps with the row, or undefined if the oracle does not recognize or cannot
 * decide some step or value. The Thens are observed after all the input steps.
 */
export function observeChanges(entries: StepOracle[], thens: StepOracle[], row: RowOracle): { observed: string[]; asserted: string[] } | undefined {
	const m: ChangesWorld = { onTop: 'nada', keyboard: false, undo: false, tapBack: false, choseEmoji: false };
	try {
		for (const step of entries) applyFirst(CHANGES_STEPS, resolved(step, row), m);
		onDay(m);
		const pairs = thens.map((step) => applyFirst(CHANGES_THENS, resolved(step, row), m));
		return { observed: pairs.map(([observed]) => observed), asserted: pairs.map(([, asserted]) => asserted) };
	} catch (error) {
		if (error instanceof Undecided) return undefined;
		throw error;
	}
}
