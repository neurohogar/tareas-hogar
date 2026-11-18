// Oráculo del panel (§6.2), reescrito desde el spec. Dos partes:
// - En pestañas: corte de 40rem, secciones por modo, sección de cada campo, orden del primer error
//   y barra de Guardar con el teclado.
// - Cambios sin guardar y Atrás: qué cuenta como cambio, los avisos de cierre y de acción, y qué
//   cierra Atrás (también §5.8, §5.9 y §7, "gana el borrado").
// NO importa el core ni los step handlers.
import { NUMBER, elements, writtenOf, date, scheduleValid, intervalMs, intervalValid, postponementOf, resolve, type RowOracle, type StepOracle, type Postponement } from './oracle';

/** §6.2: "celular" es una pantalla de hasta 40rem de ancho, inclusive. */
const MAX_PHONE_WIDTH = 40;
/** §6.2 Errores: la sección de cada campo, en el orden en que se ven los campos (§6.2 Tarea y Cuándo). */
const FIELD_SECTION: [string, string][] = [
	['Título', 'Tarea'],
	['fecha límite', 'Cuándo'],
	['Cada', 'Cuándo'],
	['días', 'Cuándo'],
	['horario', 'Cuándo']
];
/** §6.2: al crear no hay Acciones; al editar aparece siempre. */
const SECTIONS_BY_MODE: Record<string, string> = { crear: 'Tarea, Cuándo', editar: 'Tarea, Cuándo, Acciones' };
/** §6.2: un campo enfocado sin teclado en pantalla no oculta la barra: el foco no decide. */
const PANEL_FOCUSES = ['un campo está enfocado', 'ningún campo está enfocado'];

interface PanelWorld {
	width?: number;
	mode?: string;
	/** Los campos con error, en el orden en que se ven; undefined hasta que un paso los declara. */
	fields?: [string, string][];
	keyboard?: string;
}

/** Los campos de la celda en el orden de §6.2; undefined si alguno no es un campo del panel. */
function panelFields(value: string): [string, string][] | undefined {
	if (value === 'ninguno') return [];
	const names = elements(value);
	if (!names || names.some((name) => !FIELD_SECTION.some(([field]) => field === name))) return undefined;
	return FIELD_SECTION.filter(([field]) => names.includes(field));
}

const inTabs = (m: PanelWorld) => m.width !== undefined && m.width <= MAX_PHONE_WIDTH;

/** Cada Given del panel deja lo suyo en el mundo; devuelve false si el valor no es uno de los que el spec define. */
const PANEL_ENTRIES: [RegExp, (m: PanelWorld, value: string) => boolean][] = [
	[
		/^una pantalla de (\S+) rem de ancho$/,
		(m, value) => {
			m.width = Number(value);
			return NUMBER.test(value) && m.width > 0;
		}
	],
	[
		/^el panel se abre para (.+)$/,
		(m, value) => {
			m.mode = value;
			return value in SECTIONS_BY_MODE;
		}
	],
	[
		/^(?:el panel muestra errores|el guardado falla con errores) en los campos (.+)$/,
		(m, value) => {
			m.fields = panelFields(value);
			return m.fields !== undefined;
		}
	],
	[
		/^el teclado en pantalla está (.+)$/,
		(m, value) => {
			m.keyboard = value;
			return value === 'abierto' || value === 'cerrado';
		}
	],
	[/^el foco está (.+)$/, (_m, value) => PANEL_FOCUSES.includes(value)]
];

/** Lo que cada Then observa según el spec; undefined si el mundo no alcanza para decidirlo. */
const PANEL_OBSERVATIONS: [RegExp, (m: PanelWorld) => string | undefined][] = [
	[/^el panel se presenta (.+)$/, (m) => (m.width === undefined ? undefined : inTabs(m) ? 'en pestañas' : 'en secciones seguidas')],
	[/^el panel ofrece las secciones (.+)$/, (m) => (m.mode === undefined ? undefined : SECTIONS_BY_MODE[m.mode])],
	// §6.2: siempre abre en Tarea, al crear y al editar.
	[/^la pestaña abierta es (.+)$/, (m) => (m.mode === undefined ? undefined : 'Tarea')],
	[
		/^las secciones marcadas son (.+)$/,
		(m) => (m.fields === undefined ? undefined : [...new Set(m.fields.map(([, section]) => section))].join(', ') || 'ninguna')
	],
	// §6.2: Tarea antes que Cuándo; en pantallas anchas no hay pestañas.
	[/^el panel salta a la pestaña (.+)$/, (m) => (m.width === undefined || !m.fields?.length ? undefined : inTabs(m) ? m.fields[0][1] : 'ninguna')],
	[/^el contenido se desplaza hasta el campo (.+)$/, (m) => m.fields?.[0]?.[0]],
	// §6.2: la barra se oculta solo mientras el teclado en pantalla está abierto.
	[/^la barra de Guardar está (.+)$/, (m) => (m.keyboard === undefined ? undefined : m.keyboard === 'abierto' ? 'oculta' : 'visible')]
];

const IS_OF_PANEL = /^(?:una pantalla de |el panel se abre para |el panel muestra errores |el guardado falla con errores |el teclado en pantalla está )/;

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
 * Lo que observa y afirma cada Then tras los Given con la fila, o undefined si el oráculo no reconoce
 * algún paso o valor.
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

// ---- §6.2: Cambios sin guardar y Atrás ----

class Undecided extends Error {}
const undecided = (reason: string): never => {
	throw new Undecided(reason);
};

/** Lo que tiene el formulario del panel: los valores que Guardar normalizaría, sin normalizar. */
interface Form {
	title: string;
	note: string;
	/** §4.1: una línea; Guardar la recorta y vacío es sin primer paso. */
	firstStep: string;
	/** §4.1 (Pasos): los pasos más, uno por campo «Paso 2», «Paso 3»…; Guardar los recorta y descarta los vacíos. */
	steps: string[];
	/** §4.1 (Versión mínima): una línea; Guardar la recorta y vacío es sin versión mínima. */
	minimalVersion: string;
	repeats: string;
	/** Las ventanas tal como se escribieron; '' es una fila vacía. */
	schedules: string[];
	emoji: string;
}

interface TaskSaved {
	title: string;
	recurring: boolean;
	/** El intervalo en ms; undefined en una puntual. */
	interval?: number;
	paused: boolean;
	postponed?: Postponement;
}

interface ChangesWorld {
	task?: TaskSaved;
	onOpen?: Form;
	written?: Form;
	mode?: 'crear' | 'editar';
	/** Lo que está arriba del panel; 'nada' sin nada arriba. */
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
/** §6.2 Atrás: lo que no cuenta como algo abierto encima del panel. */
const DOES_NOT_COUNT_AS_OPEN = ['nada'];
const REPEATS_THAT_KNOWS = ['No se repite', 'Intervalo'];
const ACTIONS = ['pausar', 'reanudar', 'quitar posponer', 'posponer 1 hora', 'posponer 3 horas', 'posponer hasta mañana'];
const POSTPONE_OPTION = /^posponer (.+)$/;
const CHANGES_MESSAGE = 'Tenés cambios sin guardar';
/** El momento en que se crean las tareas de estos pasos: anterior a cualquier fecha del escenario (2000-01-01). */
const CREATED_BEFORE_OF_SCENARIO = new Date(2000, 0, 1).getTime();
const TIME_WINDOW_WRITTEN = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/;

const theWritten = (m: ChangesWorld): Form => m.written ?? undecided('panel cerrado');

const schedulesKey = (schedules: string[]) => [...schedules].sort().join(' ');

/** §4.1 (Pasos): Guardar recorta cada paso, descarta los vacíos y los de abajo suben. */
const stepsSaved = (f: Form) => [f.firstStep, ...f.steps].map((step) => step.trim()).filter((step) => step !== '');

/** §6.2: Guardar recorta el título, la nota, los pasos y la versión mínima y ordena las ventanas. */
const formKey = (f: Form) =>
	JSON.stringify([f.title.trim(), f.note.trim(), stepsSaved(f), f.minimalVersion.trim(), f.repeats, schedulesKey(f.schedules), f.emoji]);

/** §6.2: lo que Guardar cambiaría. */
function hasChanges(m: ChangesWorld): boolean {
	const written = theWritten(m);
	if (!m.onOpen) return undecided('panel sin valores al abrir');
	return formKey(m.onOpen) !== formKey(written);
}

/** §4.1 y §4.2: lo escrito se puede guardar. Intervalo sin Cada, si la tarea no era de intervalo, no. */
function savable(m: ChangesWorld): boolean {
	const f = theWritten(m);
	const everyEmpty = f.repeats === 'Intervalo' && m.task?.interval === undefined;
	return f.title.trim() !== '' && !f.schedules.includes('') && !everyEmpty;
}

/** §5.8: pasar a puntual reanuda. El estado de la tarea se recalcula con la definición nueva (§6.2). */
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

/** §5.1–§5.3: sin completados, una puntual sin fecha límite está pendiente y una relativa, cumplido su intervalo, también. */
function pendingOOverdue({ recurring, interval }: TaskSaved, now: number): boolean {
	if (!recurring) return true;
	return interval !== undefined && now - CREATED_BEFORE_OF_SCENARIO >= interval ? true : undecided('estado de la periódica');
}

/** §5.8, §5.9 y §6.2: las condiciones con que el panel muestra cada acción. */
function shows(action: string, task: TaskSaved, now: number): boolean {
	if (action === 'pausar') return task.recurring && !task.paused;
	if (action === 'reanudar') return task.recurring && task.paused;
	if (action === 'quitar posponer') return active(task, now) !== undefined;
	return !task.paused && !active(task, now) && pendingOOverdue(task, now);
}

/** §6.2: el aviso de la acción con la tarea y el ahora del momento; undefined si la acción ya no corresponde. */
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

/** §6.2 y §7: lo que hizo otro dispositivo o el tiempo con el panel abierto. */
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

/** §6.2: el botón Borrar tarea solo pide su confirmación; las otras acciones, con cambios, abren su aviso; sin cambios, actúan. */
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

/** §6.2 Atrás: el teclado primero; después solo lo de más arriba; sin nada arriba, como la X. */
function tapBack(m: ChangesWorld): void {
	m.tapBack = true;
	if (m.keyboard) m.keyboard = false;
	else if (DOES_NOT_COUNT_AS_OPEN.includes(m.onTop)) closeWithX(m);
	else topClose(m);
}

/** Crea la puntual del paso (§4.1: título no vacío) y abre el panel con sus valores (§6.2). */
function openForEdit(m: ChangesWorld, values: Partial<Form> & { title: string }): void {
	if (values.title.trim() === '') undecided('título vacío');
	m.task = { title: values.title.trim(), recurring: false, paused: false };
	openWithTask(m, values);
}

function openWithTask(m: ChangesWorld, values: Partial<Form> & { title: string }): void {
	m.mode = 'editar';
	openWith(m, { ...FORM_ON_CREATE, repeats: m.task?.recurring ? 'Intervalo' : 'No se repite', ...values });
}

/** El formulario arranca con los valores al abrir; lo que se escribe no cambia esos valores. */
function openWith(m: ChangesWorld, onOpen: Form): void {
	m.onOpen = onOpen;
	m.written = { ...onOpen, steps: [...onOpen.steps], schedules: [...onOpen.schedules] };
}

function timeWindowsValid(first: string, second: string): string[] {
	const parts = [first, second].map((timeWindow) => TIME_WINDOW_WRITTEN.exec(timeWindow) ?? undecided(`ventana ${timeWindow}`));
	if (!scheduleValid(writtenOf([parts[0][1], parts[0][2], parts[1][1], parts[1][2]]))) undecided('horario inválido');
	return [first, second];
}

/** §6.2: el campo «Paso N» (N ≥ 2) es el lugar N - 2 de los pasos más; tiene que existir. */
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
	[/^abro el panel para editar la tarea (.+) con nota (.+)$/, (m, title, note) => openForEdit(m, { title, note })],
	[/^abro el panel para editar la tarea (.+) con versión mínima (.+)$/, (m, title, minimalVersion) => openForEdit(m, { title, minimalVersion })],
	[/^abro el panel para editar la tarea (.+) con primer paso (.+)$/, (m, title, firstStep) => openForEdit(m, { title, firstStep })],
	[
		/^abro el panel para editar la tarea (.+) con los pasos (.+)$/,
		(m, title, steps) => {
			const [firstStep, ...more] = elements(steps) ?? undecided(`pasos ${steps}`);
			openForEdit(m, { title, firstStep, steps: more });
		}
	],
	[/^toco Agregar paso$/, (m) => void theWritten(m).steps.push('')],
	[
		/^toco Quitar en el campo (.+)$/,
		(m, field) => {
			const f = theWritten(m);
			f.steps.splice(stepPlace(f, field), 1);
		}
	],
	[/^abro el panel para editar la tarea (.+) con los horarios (.+) y (.+)$/, (m, title, a, b) => openForEdit(m, { title, schedules: timeWindowsValid(a, b) })],
	[
		/^abro el panel para crear una tarea$/,
		(m) => {
			m.mode = 'crear';
			openWith(m, FORM_ON_CREATE);
		}
	],
	[
		/^el panel está abierto (.+)$/,
		(m, status) => {
			if (status !== 'con cambios sin guardar' && status !== 'sin cambios') undecided(`estado ${status}`);
			openForEdit(m, { title: 'Pagar' });
			if (status === 'con cambios sin guardar') theWritten(m).title = 'Pagar luz';
			// El aviso de acción que declara "encima del panel hay" es el de una puntual que se puede posponer.
			m.now = '2026-07-15T08:00:00';
		}
	],
	[
		/^encima del panel hay (.+)$/,
		(m, onTop) => {
			if (!OF_TOP.includes(onTop)) undecided(`encima ${onTop}`);
			m.onTop = onTop;
			if (onTop === 'el aviso de acción') m.action = 'posponer 1 hora';
		}
	],
	[/^el aviso de deshacer está abierto$/, (m) => void (m.undo = true)],
	[/^el teclado en pantalla está abierto$/, (m) => void (m.keyboard = true)],
	[
		/^una tarea periódica relativa Regar cada (.+) (.+)$/,
		(m, every, unit) => {
			const interval = intervalValid(every) ? intervalMs(every, unit) : undefined;
			m.task = { title: 'Regar', recurring: true, interval: interval ?? undecided('intervalo'), paused: false };
		}
	],
	[/^una tarea puntual sin fecha límite$/, (m) => void (m.task = { title: 'Tarea', recurring: false, paused: false })],
	[/^la tarea Regar fue pausada$/, (m) => void (theTaskOfOther(m).paused = true)],
	[
		/^la tarea fue pospuesta con la opción (.+) el (.+)$/,
		(m, option, moment) => {
			const task = theTaskOfOther(m);
			if (task.recurring) undecided('posponer una periódica antes de abrir');
			task.postponed = postponementOf(option, moment) ?? undecided('posposición');
		}
	],
	[
		/^abro la tarea en el panel de edición el (.+)$/,
		(m, moment) => {
			m.now = moment;
			openWithTask(m, { title: theTaskOfOther(m).title });
		}
	],
	[/^escribo (.+) con espacios alrededor en el campo (.+)$/, (m, value, field) => writeIn(m, field, `  ${value}  `)],
	[/^escribo solo espacios en el campo (.+)$/, (m, field) => writeIn(m, field, '   ')],
	[/^vacío el campo (.+)$/, (m, field) => writeIn(m, field, '')],
	[/^escribo (.+) en el campo (.+)$/, (m, value, field) => writeIn(m, field, value)],
	[/^elijo la acción (.+) el (.+)$/, (m, action, moment) => chooseAction(m, action, moment)],
	[
		/^elijo un emoji que no estaba entre los recientes$/,
		(m) => {
			theWritten(m).emoji = 'elegido';
			m.choseEmoji = true;
		}
	],
	[/^que no hay emojis recientes$/, () => undefined],
	[/^elijo (.+) en (.+)$/, (m, value, selector) => chooseIn(m, selector, value)],
	[/^cambio los horarios a (.+) y (.+)$/, (m, a, b) => void (theWritten(m).schedules = timeWindowsValid(a, b))],
	[/^agrego una fila de horario vacía$/, (m) => void theWritten(m).schedules.push('')],
	[/^toco la X del panel$/, closeWithX],
	[/^toco Atrás$/, tapBack],
	[/^toco (.+) en el aviso el (.+)$/, (m, button, moment) => ((m.now = moment), tapInNotice(m, button))],
	[/^toco (.+) en el aviso$/, (m, button) => tapInNotice(m, button)],
	[/^pasa el tiempo hasta (.+)$/, (m, moment) => void (m.now = moment)],
	[
		/^otro dispositivo, sin ver ese cambio, edita el título a (.+)$/,
		(m, title) => {
			if (title.trim() === '') undecided('título vacío');
			theTaskOfOther(m).title = title.trim();
		}
	],
	[/^otro dispositivo, sin ver ese cambio, pausa la tarea$/, (m) => void (theTaskOfOther(m).paused = true)],
	[/^otro dispositivo, sin ver ese cambio, borra la tarea$/, (m) => void (m.task = undefined)]
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

/** Lo que observa y lo que afirma cada Then. */
const CHANGES_THENS: [RegExp, (m: ChangesWorld, ...groups: string[]) => [string, string]][] = [
	[/^queda abierto (.+)$/, (m, opened) => [m.written ? (OPEN_ON_TOP[m.onTop] ?? 'el panel') : 'nada', opened]],
	[/^el aviso dice (.+)$/, (m, message) => [theNoticeOpen(m).message, message]],
	[/^el aviso ofrece (.+)$/, (m, buttons) => [theNoticeOpen(m).buttons.join(', '), elements(buttons)?.join(', ') ?? undecided('botones')]],
	[/^el campo (.+) sigue con (.+)$/, (m, field, value) => [(FIELD_WRITTEN[field] ?? undecided(`campo ${field}`))(theWritten(m)), value]],
	[/^la tarea tiene título (.+)$/, (m, title) => [whetherHasTask(m, (t) => t.title), title]],
	[/^no queda ninguna tarea$/, (m) => [whetherHasTask(m, () => 'hay una'), 'sin tarea']],
	[/^se crea una tarea puntual con título (.+)$/, (m, title) => [whetherHasTask(m, (t) => (t.recurring ? 'periódica' : t.title)), title]],
	[/^no existe la tarea (.+)$/, (m) => [whetherHasTask(m, () => 'existe'), 'sin tarea']],
	[/^la tarea está pausada$/, (m) => [whetherHasTask(m, (t) => String(t.paused)), 'true']],
	[/^la tarea no está pausada$/, (m) => [whetherHasTask(m, (t) => String(t.paused)), 'false']],
	[/^la tarea es periódica$/, (m) => [whetherHasTask(m, (t) => String(t.recurring)), 'true']],
	[/^la tarea está pospuesta desde (.+) hasta (.+)$/, (m, from, to) => [whetherHasTask(m, thePostponed), `${instant(from)} ${instant(to)}`]],
	[/^el primero es el que elegí$/, (m) => [String(m.choseEmoji), 'true']],
	[/^el aviso de deshacer sigue abierto$/, (m) => [String(m.undo), 'true']],
	[/^al recargar la app el navegador (.+)$/, (m, response) => [m.written && hasChanges(m) ? 'pide confirmación' : 'no pregunta', response]],
	// §6.2: nunca por Atrás con el panel abierto.
	[/^el navegador (.+)$/, (m, response) => [m.tapBack ? 'no pregunta' : undecided('sin Atrás'), response]]
];

const IS_OF_CHANGES = /^(?:abro el panel para |el panel está abierto |toco la X del panel$|toco Atrás$|elijo la acción )/;

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
 * Lo que observa y afirma cada Then tras los pasos con la fila, o undefined si el oráculo no reconoce o no
 * puede decidir algún paso o valor. Los Then se observan tras todos los pasos de entrada.
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
