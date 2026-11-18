// Oráculo de edición y borrado: simula, con las reglas de docs/spec.md (§5 estado,
// §6.2 editar y borrar, §7 conflictos), los escenarios que editan, borran o
// modifican concurrentemente una tarea, y devuelve lo que cada paso Then observa.
// NO importa el core ni los step handlers: es una segunda implementación escrita
// desde el spec, así que la implementación no juzga a sus propios tests.
//
// Una mutación es equivalente cuando todas las observaciones son las mismas con
// el valor mutado (ver equivalence.ts). Todo lo que el oráculo no reconoce o no
// puede decidir lanza `Indeciso`, y el resultado es undefined (no se filtra).
import {
	SCHEDULE,
	SHOW_COMPLETED,
	NUMBER,
	classifySituation,
	insideOfTimeWindow,
	writtenOf,
	postponeButton,
	day,
	monthDays,
	weekdays,
	elements,
	isCompleted,
	date,
	dayStart,
	intervalValid,
	inWaitByPostponement,
	startThatCovers,
	isoDay,
	readSchedule,
	reasonsDueDate,
	reasonsEmoji,
	reasonsMonth,
	occurs,
	occurrenceThatCovers,
	sortPending,
	pWithSchedule,
	byTimeWindow,
	postponementOf,
	firstWithoutClose,
	calendarNext,
	nextByTimeWindow,
	resolve,
	lastCovered,
	type Calendar,
	type RowOracle,
	type Occurrence,
	type StepOracle,
	type Postponement,
	type Situation,
	type OrderTask,
	type TimeWindow
} from './oracle';
import { noticeSees, historyText, textOfLastTime, type OracleEntry } from './oracle-history';
import { returnOfNoticeOf } from './oracle-date-text';

class Undecided extends Error {}
const undecided = (reason: string): never => {
	throw new Undecided(reason);
};

type Recurrence = { relative: { every: string; unit: string } } | Calendar;

/** Lo guardado de una tarea (§4.1): puede tener un campo que no corresponde al tipo (§7). */
interface Doc {
	id: number;
	title: string;
	emoji?: string;
	note?: string;
	/** §4.1: una línea, recortada; sin el campo, sin primer paso. Un campo independiente (§7). */
	firstStep?: string;
	/** §4.1 (Pasos): los pasos 2 en adelante, en orden; sin el campo, no hay más pasos. Un solo campo, se reemplaza entero (§7). */
	steps?: string[];
	/** §4.1 (Pasos): el paso en que va la tarea; sin el campo, el paso 1. Otro campo independiente (§7). */
	currentStep?: number;
	/** §4.1 (Versión mínima): una línea, recortada; sin el campo, sin versión mínima. Un campo independiente (§7). */
	minimalVersion?: string;
	kind: 'puntual' | 'periodica';
	limit?: Date;
	recurrence?: Recurrence;
	/** §4.1: una o más ventanas, ordenadas; un solo campo (§7). */
	schedule?: TimeWindow[];
	created?: number;
	/** §5.8: pausada, y el momento de la última reanudación. */
	paused?: boolean;
	resumed?: number;
	/** §5.9: la posposición guardada; un solo campo (§7). */
	postponed?: Postponement;
}

interface Completion {
	id: number;
	taskId: number;
	at: number;
	/** §4.4: la ocurrencia cubierta sin hora (un día) o, con horario, su inicio. */
	covered?: Date;
	startCovered?: number;
	/** El id que el escenario le fija ("con id c1"); sirve para desempatar en el Historial. */
	ident?: string;
	/** §4.4: el paso en que iba la tarea al completarla; solo en tareas de dos pasos o más. */
	step?: number;
	/** §4.4: `true` si fue «Hice la mínima»; sin el campo, fue entero. Se fija al completar. */
	minimal?: boolean;
}

/** El aviso del último completado de este dispositivo (§5.4): nombra la tarea como se llamaba al completarla. */
interface Notice {
	title: string;
	completion: Completion;
}

interface Saved {
	docs: Doc[];
	completions: Completion[];
}

interface OracleWorld extends Saved {
	next: number;
	/** Lo guardado justo antes de mi último cambio: lo que ve otro dispositivo "sin ver ese cambio". */
	before?: Saved;
	rejection?: string;
	/** Clasificación de la última consulta de estado, con progreso. */
	status?: string;
	/** El momento consultado; sin consulta, lo que se afirma es del momento en que se tocó el checkbox. */
	queriedAt?: number;
	touchedAt?: number;
	order?: string;
	/** El momento en que se consultó Pendientes (§6.1); sin él pero con `consultoPendientes`, en cualquier momento. */
	pendingAt?: number;
	queryPending?: boolean;
	/** Por qué no se decide el orden de la última consulta de Pendientes: solo importa si un Then mira el orden. */
	orderUndecided?: boolean;
	/** El check "Mostrar completadas" (§6.1); sin él, apagado. */
	showCompleted?: boolean;
	updated?: Completion;
	/** Lo que se borró alguna vez: se puede nombrar aunque ya no exista. */
	deletedDocs: Doc[];
	deletedCompletions: Completion[];
	notice?: Notice;
	/** Lo que mostraba el aviso en el último momento consultado. */
	noticeSeen?: string;
	/** El texto del aviso en el último momento consultado (§5.4); sin aviso, 'sin aviso'. */
	noticeText?: string;
	/** El momento en que se consultó el aviso por última vez. */
	noticeIn?: number;
	history?: string;
	/** Lo que mostraba "Última vez" en el último momento consultado (§6.2). */
	lastTime?: string;
}

/** Los datos que carga el panel (§6.2). */
interface Data {
	title: string;
	/** Lo que quedaría guardado: ya sin espacios; sin valor, la tarea queda sin el campo (§4.1). */
	emoji?: string;
	note?: string;
	firstStep?: string;
	steps?: string[];
	minimalVersion?: string;
	kind: 'puntual' | 'periodica';
	limit?: Date;
	recurrence?: Recurrence;
	schedule?: TimeWindow[];
	/** Cuántas ventanas se escribieron, válidas o no (§4.1: más de una no va en una relativa en horas). */
	timeWindowsWritten: number;
	reasons: string[];
}

// ---- Valores ----

/** §4.2 los lista de lunes a domingo. */
const MONDAY_A_SUNDAY = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const daysKey = (days: string[]) => [...days].sort((a, b) => MONDAY_A_SUNDAY.indexOf(a) - MONDAY_A_SUNDAY.indexOf(b));

function recurrenceKey(r: Recurrence | undefined): string {
	if (r === undefined) return '-';
	if ('relative' in r) return `relativa ${Number(r.relative.every)} ${r.relative.unit}`;
	if ('weekly' in r) return `semanal ${daysKey(r.weekly).join(' ')}`;
	return `mensual ${[...r.monthly].sort((a, b) => a - b).join(' ')}`;
}

const scheduleKey = (h: TimeWindow[] | undefined) => (h === undefined ? '-' : h.map((v) => `${v.from}-${v.to}`).join(' '));

const docKey = (d: Doc) =>
	JSON.stringify([d.id, d.title, d.emoji, d.note, d.firstStep, d.steps, d.currentStep, d.minimalVersion, d.kind, d.limit?.getTime(), recurrenceKey(d.recurrence), scheduleKey(d.schedule), d.created, d.paused, d.resumed, d.postponed]);

const moment = (value: string) => date(value) ?? undecided(`fecha y hora ${value}`);
const dayOf = (value: string) => day(value) ?? undecided(`fecha ${value}`);
const numeric = (value: string) => (NUMBER.test(value) ? Number(value) : undecided(`número ${value}`));
const unitOf = (value: string) => (value === 'horas' || value === 'dias' ? value : undecided(`unidad ${value}`));

// ---- Datos nuevos de una edición y de una creación ----

function relativeRecurrence(every: string, unit: string): Data['recurrence'] {
	numeric(every);
	return { relative: { every, unit: unitOf(unit) } };
}

/** Semanal o mensual con días: los nombres o números ilegibles no se deciden; los fuera de rango son rechazo (§4.2). */
function calendarData(shape: string, value: string): Pick<Data, 'recurrence' | 'reasons'> {
	if (shape === 'semanal') {
		const calendar = weekdays(value) ?? undecided(`días ${value}`);
		return { recurrence: calendar, reasons: [] };
	}
	const list = elements(value) ?? undecided(`días ${value}`);
	list.forEach(numeric);
	const reasons = reasonsMonth(value) ?? undecided(`días ${value}`);
	return { recurrence: reasons.length === 0 ? (monthDays(value) as Calendar) : undefined, reasons };
}

const withoutDays = (): Pick<Data, 'recurrence' | 'reasons'> => ({ reasons: ['falta de días'] });

/** Sin horario escrito: el que corresponde lo agrega quien edita o crea. */
type Definition = [RegExp, (title: string, c: string[]) => Omit<Data, 'timeWindowsWritten'>];

const DEFINITIONS: Definition[] = [
	[
		/^puntual con fecha límite (\S+)$/,
		(title, [l]) => ({ title, kind: 'puntual', limit: day(l), reasons: reasonsDueDate(l) })
	],
	[/^puntual sin fecha límite$/, (title) => ({ title, kind: 'puntual', reasons: [] })],
	[
		/^periódica relativa cada (\S+) (\S+)$/,
		(title, [c, u]) => ({
			title,
			kind: 'periodica',
			recurrence: relativeRecurrence(c, u),
			reasons: intervalValid(c) ? [] : ['intervalo inválido']
		})
	],
	[
		/^periódica (semanal los|mensual los días) (.*)$/,
		(title, [f, d]) => ({ title, kind: 'periodica', ...calendarData(f.split(' ')[0], d) })
	],
	[/^periódica (?:semanal|mensual) sin días$/, (title) => ({ title, kind: 'periodica', ...withoutDays() })],
	[
		/^periódica de calendario con días de la semana y del mes a la vez$/,
		(title) => ({ title, kind: 'periodica', reasons: ['semanal y mensual combinados'] })
	]
];

/** Los campos de texto escritos en el panel (§4.1): emoji, nota y primer paso recortados, vacío es sin campo; un emoji que no es uno solo es inválido; un primer paso nunca es inválido. */
interface WrittenData {
	emoji?: string;
	note?: string;
	firstStep?: string;
	/** Los pasos más, tal como se escribieron (§4.1, Pasos). */
	steps?: string[];
	/** §4.1 (Versión mínima): una línea; Guardar la recorta y vacío es sin versión mínima; nunca es inválida. */
	minimalVersion?: string;
}

/**
 * §4.1 (Pasos): el primer paso y los pasos más se recortan, los vacíos se descartan y los de abajo suben: si el
 * primer paso queda vacío y el paso 2 no, el paso 2 pasa a ser el primer paso. Sin pasos más, el campo no se guarda.
 */
function stepsWritten(firstStep: string | undefined, steps: string[] | undefined): Pick<Data, 'firstStep' | 'steps'> {
	const list = [firstStep ?? '', ...(steps ?? [])].map((step) => step.trim()).filter((step) => step !== '');
	return { firstStep: list[0], steps: list.length > 1 ? list.slice(1) : undefined };
}

function withWritten(data: Data, { emoji, note, firstStep, steps, minimalVersion }: WrittenData): Data {
	return {
		...data,
		emoji: emoji?.trim() || undefined,
		note: note?.trim() || undefined,
		minimalVersion: minimalVersion?.trim() || undefined,
		...stepsWritten(firstStep, steps),
		reasons: [...reasonsEmoji(emoji ?? ''), ...data.reasons]
	};
}

/** Spec §4.1: el título no puede ser vacío (solo espacios cuenta como vacío). */
function withValidation(data: Data): Data {
	return data.title.trim() === '' ? { ...data, reasons: ['título vacío', ...data.reasons] } : data;
}

/** Los campos de texto y el horario de la tarea que se edita siguen igual salvo los que la edición escribe. */
const keeping = (base: Doc, data: Data, written: WrittenData = {}): Data => ({
	...withWritten(data, { emoji: base.emoji, note: base.note, firstStep: base.firstStep, steps: base.steps, minimalVersion: base.minimalVersion, ...written }),
	schedule: base.schedule,
	timeWindowsWritten: base.schedule?.length ?? 0
});

/** Ventanas escritas en el panel: cada una con sus dos horas, o alguna sin escribir. */
type WrittenPairs = [string | undefined, string | undefined][];

/** §4.1: los datos de la tarea con el horario escrito (sin ventanas, sin horario); uno inválido es un motivo de rechazo. */
function withScheduleWritten(data: Data, written: WrittenPairs): Data {
	if (written.length === 0) return { ...data, schedule: undefined, timeWindowsWritten: 0 };
	const read = readSchedule(written);
	const reasons = read.filter((l): l is string => typeof l === 'string');
	const withWritten = { ...data, timeWindowsWritten: written.length };
	return reasons.length > 0 ? { ...withWritten, reasons: [...data.reasons, ...reasons] } : { ...withWritten, schedule: read as TimeWindow[] };
}

const SCHEDULE_REASONS = ['horario incompleto', 'hora de fin no posterior', 'horarios superpuestos'];

/**
 * §4.1: una relativa en horas no puede tener más de una ventana. Si además el horario mismo es inválido, el spec
 * no dice cuál de los dos errores se ve.
 */
function withIntervalOfSchedule(data: Data): Data {
	const r = data.recurrence;
	const inHours = data.kind === 'periodica' && r !== undefined && 'relative' in r && r.relative.unit === 'horas';
	if (!inHours || data.timeWindowsWritten <= 1) return data;
	if (data.reasons.some((reason) => SCHEDULE_REASONS.includes(reason))) return undecided('dos errores del horario');
	return { ...data, reasons: [...data.reasons, 'varios horarios en una relativa en horas'] };
}

function dataOf(text: string, title: string): Data {
	for (const [pattern, build] of DEFINITIONS) {
		const matches = pattern.exec(text);
		if (matches) return withValidation({ ...build(title, matches.slice(1)), timeWindowsWritten: 0 });
	}
	return undecided(`definición ${text}`);
}

/** Los valores actuales de una tarea, como los carga el panel al editar. */
function docData(d: Doc): Data {
	const fields = { title: d.title, emoji: d.emoji, note: d.note, firstStep: d.firstStep, steps: d.steps, minimalVersion: d.minimalVersion, schedule: d.schedule, timeWindowsWritten: d.schedule?.length ?? 0, reasons: [] };
	if (d.kind === 'puntual') return { ...fields, kind: 'puntual', limit: d.limit };
	return { ...fields, kind: 'periodica', recurrence: d.recurrence };
}

// ---- Mundo ----

const copy = (g: Saved): Saved => ({ docs: [...g.docs], completions: [...g.completions] });

function only(g: Saved): Doc {
	return g.docs.length === 1 ? g.docs[0] : undecided('se esperaba una tarea');
}

function withTitle(g: Saved, title: string): Doc {
	const found = g.docs.filter((d) => d.title === title);
	return found.length === 1 ? found[0] : undecided(`tarea ${title}`);
}

/** La tarea con ese título, aunque ya se haya borrado. */
function theOneThatHad(m: OracleWorld, title: string): Doc {
	const found = [...m.docs, ...m.deletedDocs].filter((d) => d.title === title);
	return found.length === 1 ? found[0] : undecided(`tarea ${title}`);
}

const allCompletions = (m: OracleWorld) => [...m.completions, ...m.deletedCompletions];

/** Si todavía no hice ningún cambio, el otro dispositivo vio todo lo guardado. */
const thatSawOther = (m: OracleWorld): Saved => m.before ?? copy(m);
const completionsOf = (g: Saved, id: number) => g.completions.filter((c) => c.taskId === id);
/** §5.8, §6.2: una periódica reanudada se evalúa sin los completados anteriores a reanudadaEn; una puntual ignora reanudadaEn. */
const activeOf = (g: Saved, d: Doc) =>
	completionsOf(g, d.id).filter((c) => d.kind === 'puntual' || d.resumed === undefined || c.at >= d.resumed);
/** §5.8: la tarea se evalúa como recién creada en reanudadaEn. */
const createdActive = (d: Doc) => (d.kind === 'periodica' && d.resumed !== undefined ? d.resumed : d.created);

function create(m: OracleWorld, data: Data, created: number | undefined): void {
	if (data.reasons.length > 0) undecided('creación inválida');
	m.docs = [
		...m.docs,
		{
			id: m.next++,
			title: data.title,
			emoji: data.emoji,
			note: data.note,
			firstStep: data.firstStep,
			steps: data.steps,
			minimalVersion: data.minimalVersion,
			kind: data.kind,
			limit: data.limit,
			recurrence: data.recurrence,
			schedule: data.schedule,
			created
		}
	];
}

// ---- Editar (§6.2) y conflictos (§7) ----

/** La tarea que describe el documento: el campo que no corresponde al tipo se ignora (§7). */
function derived(d: Doc): Doc {
	return d.kind === 'puntual' ? { ...d, recurrence: undefined, paused: undefined, resumed: undefined } : { ...d, limit: undefined };
}

/** Los campos que la edición escribe: solo los que cambiaron; al cambiar de tipo, los dos campos de tipo (§7). */
function changeOf(base: Doc, updated: Data): Record<string, unknown> {
	const change: Record<string, unknown> = {};
	if (base.title !== updated.title) change.title = updated.title;
	if (base.emoji !== updated.emoji) change.emoji = updated.emoji ?? null;
	if (base.note !== updated.note) change.note = updated.note ?? null;
	if (base.firstStep !== updated.firstStep) change.firstStep = updated.firstStep ?? null;
	// §7: `pasos` es un solo campo que se reemplaza entero, solo si cambió; la edición nunca escribe `pasoActual`.
	if (JSON.stringify(base.steps) !== JSON.stringify(updated.steps)) change.steps = updated.steps ?? null;
	if (base.minimalVersion !== updated.minimalVersion) change.minimalVersion = updated.minimalVersion ?? null;
	if (scheduleKey(base.schedule) !== scheduleKey(updated.schedule)) change.schedule = updated.schedule ?? null;
	if (base.kind !== updated.kind) {
		return { ...change, tipo: updated.kind, limite: updated.limit ?? null, recurrencia: updated.recurrence ?? null };
	}
	if (base.limit?.getTime() !== updated.limit?.getTime()) change.limit = updated.limit ?? null;
	if (recurrenceKey(base.recurrence) !== recurrenceKey(updated.recurrence)) {
		change.recurrence = updated.recurrence ?? null;
	}
	return change;
}

function apply(doc: Doc, change: Record<string, unknown>): Doc {
	const edited: Record<string, unknown> = { ...doc };
	for (const [field, value] of Object.entries(change)) {
		if (value === null) delete edited[field];
		else edited[field] = value;
	}
	return edited as unknown as Doc;
}

/** Editar `base` (la tarea como la vio quien edita) con los datos nuevos; el cambio llega a lo guardado hoy. */
function edit(m: OracleWorld, base: Doc, data: Data, at?: number): void {
	const updated = withIntervalOfSchedule(data);
	if (updated.reasons.length > 0) {
		m.rejection = [...updated.reasons].sort().join(', ');
		return;
	}
	const change = changeOf(base, updated);
	// §5.8: cambiar una periódica pausada a puntual la reanuda (quita la pausa y guarda reanudadaEn).
	if (base.paused && updated.kind === 'puntual') Object.assign(change, { paused: null, resumed: at ?? undecided('sin momento de edición') });
	m.docs = m.docs.map((d) => (d.id === base.id ? apply(d, change) : d));
}

function editMe(m: OracleWorld, title: string | undefined, build: (base: Doc) => Data, at?: number): void {
	m.before = copy(m);
	const base = derived(title === undefined ? only(m) : withTitle(m, title));
	edit(m, base, build(base), at);
}

function editsOther(m: OracleWorld, build: (base: Doc) => Data): void {
	const base = derived(only(thatSawOther(m)));
	edit(m, base, build(base));
}

// ---- Borrar (§6.2, §7) ----

function remove(m: OracleWorld, task: Doc, known: Completion[]): void {
	const ids = known.filter((c) => c.taskId === task.id).map((c) => c.id);
	m.deletedDocs = [...m.deletedDocs, ...m.docs.filter((d) => d.id === task.id)];
	m.docs = m.docs.filter((d) => d.id !== task.id);
	deleteCompletions(m, ids);
}

/** Borrar completados que ya no existen no hace nada (§5.4). */
function deleteCompletions(m: OracleWorld, ids: number[]): void {
	m.deletedCompletions = [...m.deletedCompletions, ...m.completions.filter((c) => ids.includes(c.id))];
	m.completions = m.completions.filter((c) => !ids.includes(c.id));
}

// ---- Completar (§5.3) ----

/** Los valores sin hora (§5.3, §5.6): la fecha cubierta o, sin ocurrencia cubierta, el día de completadoEn. */
function contributions(comps: Completion[]): Date[] {
	return comps.filter((c) => c.startCovered === undefined).map((c) => c.covered ?? dayStart(c.at));
}

/** §5.6: las ocurrencias cubiertas con hora, por su inicio. */
const startsCovered = (comps: Completion[]) => comps.flatMap((c) => (c.startCovered === undefined ? [] : [c.startCovered]));

/** §5.6 y §5.7: N de una de calendario con horario o de una relativa por ventana. */
function nextWithSchedule(task: Doc, vs: TimeWindow[], own: Completion[]): Occurrence {
	const recurrence = task.recurrence ?? undecided('periódica sin recurrencia');
	const from = createdActive(task);
	const created = from === undefined ? undefined : new Date(from);
	const p = pWithSchedule(contributions(own), startsCovered(own), created) ?? undecided('sin P');
	if (!('relative' in recurrence)) return calendarNext(recurrence, vs, p, task.resumed) ?? undecided('sin ocurrencia');
	if (own.length === 0) return firstWithoutClose(vs, from ?? undecided('sin creación'));
	return nextByTimeWindow(vs, numeric(recurrence.relative.every), p);
}

/** Si la tarea cubre ocurrencias con hora (§5.6, §5.7): de calendario con horario, o relativa por ventana. */
function coversWithHour(task: Doc): TimeWindow[] | undefined {
	const { schedule, recurrence } = task;
	if (task.kind !== 'periodica' || !schedule || !recurrence) return undefined;
	return !('relative' in recurrence) || byTimeWindow(recurrence.relative.unit, schedule) ? schedule : undefined;
}

/** La ocurrencia que cubre un completado nuevo: de calendario, un día (§5.3) o, con hora, un inicio (§5.6, §5.7). */
function newCovered(task: Doc, known: Completion[], at: number): Pick<Completion, 'covered' | 'startCovered'> {
	const recurrence = task.recurrence;
	const own = activeOf({ docs: [], completions: known }, task);
	const vs = coversWithHour(task);
	if (vs) {
		const account = (d: Date) => !recurrence || 'relative' in recurrence || occurs(recurrence, d);
		return { startCovered: startThatCovers(nextWithSchedule(task, vs, own), vs, account, at) };
	}
	if (task.kind !== 'periodica' || !recurrence || 'relative' in recurrence) return {};
	if (startsCovered(own).length > 0) return undecided('sin horario, una ocurrencia cubierta con hora');
	const p = lastCovered(situationBase({ covered: contributions(own), created: createdActive(task) }));
	if (!p) return undecided('sin P');
	return { covered: occurrenceThatCovers(recurrence, p, dayStart(at)) ?? undecided('sin ocurrencia') };
}

function complete(m: OracleWorld, task: Doc, known: Completion[], at: number, ident?: string, minimal = false): Completion {
	const covered = newCovered(task, known, at);
	// §4.4: el completado de una tarea de dos pasos o más guarda el paso en que iba.
	const step = severalSteps(task) ? { step: stepInThatGoes(task) } : {};
	const completion = { id: m.next++, taskId: task.id, at, ...covered, ...step, ...(ident && { ident }), ...(minimal && { minimal }) };
	m.completions = [...m.completions, completion];
	return completion;
}

// ---- Pasos (§4.1, Pasos) ----

/** El primer paso y los pasos más: la lista de pasos de la tarea. */
const stepsOf = (d: Doc): string[] => [...(d.firstStep === undefined ? [] : [d.firstStep]), ...(d.steps ?? [])];

/** §4.1: dos pasos o más si tiene primer paso y al menos un paso más. */
const severalSteps = (d: Doc) => stepsOf(d).length >= 2;

/** §4.1: el paso en que va la tarea: sin el campo, el 1; si quedan menos pasos que el número, el último. */
const stepInThatGoes = (d: Doc) => Math.min(d.currentStep ?? 1, Math.max(stepsOf(d).length, 1));

/** Un número de paso es un entero desde 1. */
const stepNumber = (value: string) => (/^[1-9]\d*$/.test(value) ? Number(value) : undecided(`paso ${value}`));

/** Escribe el paso en que va la tarea; el paso 1 es sin el campo. */
function goOnStep(m: OracleWorld, id: number, step: number): void {
	m.docs = m.docs.map((d) => (d.id === id ? { ...d, currentStep: step === 1 ? undefined : step } : d));
}

/** Completo desde este dispositivo: es mi cambio (el otro dispositivo no lo ve) y abre el aviso (§5.4). */
function completeMe(m: OracleWorld, task: Doc, at: number, minimal = false): void {
	m.before = copy(m);
	m.updated = complete(m, task, m.completions, at, undefined, minimal);
	m.notice = { title: nameOf(task), completion: m.updated };
	// §4.1 (Pasos: Completar): completar, por el checkbox o por «Hecho», vuelve la tarea al paso 1.
	goOnStep(m, task.id, 1);
}

/** Spec §4.1: «emoji título», o solo el título sin emoji. */
const nameOf = (d: Doc) => (d.emoji === undefined ? d.title : `${d.emoji} ${d.title}`);

// ---- Deshacer (§5.4) ----

/** El completado de ese momento, aunque ya se haya borrado: tiene que ser uno solo. */
function theCompletionOf(m: OracleWorld, at: number): Completion {
	const ofMoment = allCompletions(m).filter((c) => c.at === at);
	return ofMoment.length === 1 ? ofMoment[0] : undecided(`completados del momento ${at}`);
}

/**
 * Deshacer en el aviso: borra solo el completado que nombra el aviso y lo cierra. El botón existe mientras el aviso
 * se ve (§5.4): fuera de esa ventana no hay nada que tocar y no pasa nada.
 */
function tapUndo(m: OracleWorld, now: number): void {
	m.before = copy(m);
	if (!m.notice || !noticeSees(m.notice.completion.at, now)) return;
	undoCompletion(m, m.notice.completion.id);
	m.notice = undefined;
}

/**
 * Borrar un completado desde el aviso, el Historial o el checkbox (§5.4). Si era el más reciente de una tarea de dos
 * pasos o más y guardaba su paso, la tarea vuelve a ese paso, con el tope del último (§4.1, Pasos: Deshacer).
 */
function undoCompletion(m: OracleWorld, id: number): void {
	const completion = m.completions.find((c) => c.id === id);
	const task = m.docs.find((d) => d.id === completion?.taskId);
	if (completion?.step !== undefined && task && severalSteps(task) && theMoreRecent(completionsOf(m, task.id)) === completion) {
		goOnStep(m, task.id, Math.min(completion.step, stepsOf(task).length));
	}
	deleteCompletions(m, [id]);
}

/** Lo que muestra el aviso en ese momento: la tarea y el completado que ofrece deshacer, o ninguno. */
function queryNotice(m: OracleWorld, now: number): string {
	const visible = m.notice && noticeSees(m.notice.completion.at, now) ? m.notice : undefined;
	return visible ? JSON.stringify([visible.title, visible.completion.at]) : 'sin aviso';
}

/** §5.4: «Completaste «nombre»», con « · mínima» si el completado fue la mínima. */
function noticeText(m: OracleWorld, now: number): string {
	const visible = m.notice && noticeSees(m.notice.completion.at, now) ? m.notice : undefined;
	return visible ? `Completaste «${visible.title}»${visible.completion.minimal ? ' · mínima' : ''}` : 'sin aviso';
}

/** §5.4 y §6.1: el «Vuelve …» del aviso visible en el último momento consultado; sin aviso a la vista, 'sin aviso'. */
function noticeReturn(m: OracleWorld): string {
	const now = m.noticeIn ?? undecided('sin consulta del aviso');
	if (!m.notice || !noticeSees(m.notice.completion.at, now)) return 'sin aviso';
	const task = m.docs.find((d) => d.id === m.notice?.completion.taskId) ?? undecided('la tarea del aviso ya no existe');
	return returnOfNoticeOf(situationOf(m, derived(task), now), now) ?? undecided('regreso del aviso');
}

// ---- Historial (§6.3) ----

function queryHistory(m: OracleWorld, now: number): string {
	const entries = m.completions.flatMap((c): OracleEntry[] => {
		const task = m.docs.find((d) => d.id === c.taskId);
		return task ? [{ completedAt: c.at, id: c.ident, title: nameOf(task), minimal: c.minimal }] : [];
	});
	return historyText(entries, now) ?? undecided('empate sin desempate en el Historial');
}

/** §6.2: la última vez de la única tarea, por el completadoEn más reciente de sus completados. */
function queryLastTime(m: OracleWorld, now: number): string {
	const task = only(m);
	return textOfLastTime(m.completions.filter((c) => c.taskId === task.id).map((c) => c.at), now);
}

// ---- Estado (§5) ----

function situationBase(data: { covered: Date[]; created?: number }): Situation {
	return {
		completions: [],
		anyMoment: false,
		covered: data.covered,
		withoutCovered: [],
		created: data.created === undefined ? undefined : new Date(data.created)
	};
}

function situationOf(m: Saved, task: Doc, now: number | undefined): Situation {
	const own = activeOf(m, task);
	const s: Situation = {
		...situationBase({ covered: [], created: createdActive(task) }),
		resumed: task.kind === 'periodica' ? task.resumed : undefined,
		completions: own.map((c) => c.at),
		coveredWithHour: startsCovered(own),
		anyMoment: now === undefined,
		now,
		schedule: task.schedule,
		postponed: task.postponed
	};
	const recurrence = task.recurrence;
	if (task.kind === 'puntual') return { ...s, oneOff: { limit: task.limit } };
	if (!recurrence) return undecided('periódica sin recurrencia');
	if ('relative' in recurrence) {
		// §5.7: los completados sin ocurrencia cubierta cubren el día entero de su completadoEn.
		return { ...s, every: recurrence.relative.every, unit: recurrence.relative.unit, withoutCovered: contributions(own) };
	}
	return { ...s, calendar: recurrence, covered: contributions(own) };
}

/** Clasificación con progreso; "no aparece en Pendientes" si la puntual está completada. */
function classify(m: OracleWorld, now: number | undefined): string {
	const task = only(m);
	if (task.kind === 'periodica' && task.paused) return 'pausada';
	return classifySituation(situationOf(m, task, now), { progress: true }) ?? undecided('estado');
}

function orderTask(m: OracleWorld, d: Doc): OrderTask | undefined {
	const own = completionsOf(m, d.id);
	const base = {
		title: d.title,
		created: d.created ?? 0,
		completions: own.map((c) => c.at),
		covered: [] as Date[],
		coveredWithHour: startsCovered(own),
		schedule: d.schedule,
		postponed: d.postponed
	};
	if (d.kind === 'puntual') return { ...base, oneOff: true, limit: d.limit };
	const r = d.recurrence ?? undecided('periódica sin recurrencia');
	if ('relative' in r) {
		const ms = (Number(r.relative.every) * (r.relative.unit === 'horas' ? 1 : 24) * 3_600_000) as number;
		return { ...base, oneOff: false, interval: ms };
	}
	return { ...base, oneOff: false, calendar: r, covered: contributions(own) };
}

function orderIn(m: OracleWorld, now: number | undefined): string {
	if (m.docs.some((d) => d.paused || d.resumed !== undefined)) undecided('Pendientes con pausa o reanudación');
	const tasks = m.docs.flatMap((d) => orderTask(m, d) ?? []);
	if (now === undefined && tasks.some((t) => !t.oneOff || t.limit)) undecided('Pendientes en cualquier momento');
	return sortPending(tasks, now, m.showCompleted) ?? undecided('orden');
}

// ---- El checkbox de la fila (§6.1) ----

/** §6.1: completada en ese momento (puntual con completados, o periódica en espera con completados). */
function completedAt(m: OracleWorld, task: Doc, at: number): boolean {
	if (task.paused) return false;
	const s = situationOf(m, task, at);
	const classification = classifySituation(s, { progress: false }) ?? undecided('estado');
	// §5.9: una pospuesta no está completada.
	return isCompleted(task.kind === 'puntual', classification === 'en espera' && !inWaitByPostponement(s), activeOf(m, task).length > 0);
}

/** El completado de completadoEn mayor; si dos empatan, el spec no dice cuál. */
function theMoreRecent(comps: Completion[]): Completion {
	const last = Math.max(...comps.map((c) => c.at));
	const lastOnes = comps.filter((c) => c.at === last);
	return lastOnes.length === 1 ? lastOnes[0] : undecided('completados más recientes empatados');
}

/** §5.5: completar fuera de la ventana del horario no es posible: el checkbox está deshabilitado y no hace nada. */
function completeIfPossible(m: OracleWorld, task: Doc, at: number, minimal = false): void {
	if (!task.schedule || insideOfTimeWindow(task.schedule, at)) completeMe(m, task, at, minimal);
}

/**
 * §6.1: la no completada se completa. De la completada se borra el completado más reciente si es puntual o
 * si es de hoy o posterior (día local de completadoEn); si es de un día anterior, se completa de nuevo. Borrar se
 * puede a cualquier hora; completar, solo dentro de la ventana (§5.5).
 */
function tapCheckbox(m: OracleWorld, at: number): void {
	const task = derived(only(m));
	m.touchedAt ??= at;
	if (task.paused) return;
	if (!completedAt(m, task, at)) return completeIfPossible(m, task, at);
	const moreRecent = theMoreRecent(completionsOf(m, task.id));
	if (task.kind === 'periodica' && moreRecent.at < dayStart(at).getTime()) return completeIfPossible(m, task, at);
	m.before = copy(m);
	undoCompletion(m, moreRecent.id);
}

// ---- Pasos ----

type Step = [RegExp, (m: OracleWorld, c: string[]) => void];

const CREATION_MOMENT = (c: string | undefined) => (c === undefined ? undefined : moment(c));
/** Las tareas con título que no dicen cuándo se crearon: antes de cualquier otra fecha del escenario. */
const SCENARIO_BEFORE = 0;

const SHAPES = '(?:semanal|mensual)';
const created = '(?: creada el (\\S+))?';

/** Un horario ya guardado (no es un cambio de este dispositivo); uno inválido no se decide (§4.1). */
function saveSchedule(task: Doc, hours: string[]): void {
	const data = withIntervalOfSchedule(withScheduleWritten(docData(task), writtenOf(hours)));
	task.schedule = data.reasons.length > 0 ? undecided(`horario ${hours.join(' ')}`) : data.schedule;
}

/** Deja la tarea ya guardada con esa lista de pasos: el primero es el primer paso. */
function saveSteps(task: Doc, text: string): void {
	const { firstStep, steps } = stepsWritten(...(([first, ...more]) => [first, more] as const)(elements(text) ?? undecided(`pasos ${text}`)));
	task.firstStep = firstStep;
	task.steps = steps;
}

const CREATIONS: Step[] = [
	[new RegExp(`^la tarea se puede completar ${SCHEDULE}$`), (m, hours) => saveSchedule(only(m), hours)],
	[new RegExp(`^la tarea (\\S+) se puede completar ${SCHEDULE}$`), (m, [t, ...hours]) => saveSchedule(withTitle(m, t), hours)],
	[
		/^una tarea puntual con fecha límite (\S+) creada el (\S+)$/,
		(m, [l, c]) => create(m, dataOf(`puntual con fecha límite ${l}`, 'Tarea'), moment(c))
	],
	[
		/^una tarea puntual sin fecha límite con emoji (.*)$/,
		(m, [e]) => create(m, withWritten(dataOf('puntual sin fecha límite', 'Tarea'), { emoji: e }), undefined)
	],
	[
		/^una tarea puntual (\S+) sin fecha límite con emoji (.*)$/,
		(m, [t, e]) => create(m, withWritten(dataOf('puntual sin fecha límite', t), { emoji: e }), SCENARIO_BEFORE)
	],
	[
		/^una tarea puntual sin fecha límite con nota (.*)$/,
		(m, [n]) => create(m, withWritten(dataOf('puntual sin fecha límite', 'Tarea'), { note: n }), undefined)
	],
	// §4.1: un primer paso ya guardado (no es un cambio de este dispositivo); se guarda recortado.
	[/^el primer paso de la tarea es (.*)$/, (m, [p]) => void (only(m).firstStep = p.trim() || undefined)],
	[/^el primer paso de la tarea (\S+) es (.*)$/, (m, [t, p]) => void (withTitle(m, t).firstStep = p.trim() || undefined)],
	// §4.1 (Versión mínima): una ya guardada (no es un cambio de este dispositivo); se guarda recortada.
	[/^la versión mínima de la tarea es (.*)$/, (m, [v]) => void (only(m).minimalVersion = v.trim() || undefined)],
	[/^la versión mínima de la tarea (\S+) es (.*)$/, (m, [t, v]) => void (withTitle(m, t).minimalVersion = v.trim() || undefined)],
	// §4.1 (Pasos): los pasos ya guardados (no es un cambio de este dispositivo), con el primer paso y los pasos más.
	[/^los pasos de la tarea son (.*)$/, (m, [p]) => saveSteps(only(m), p)],
	[/^los pasos de la tarea (\S+) son (.*)$/, (m, [t, p]) => saveSteps(withTitle(m, t), p)],
	[/^el paso actual de la tarea es (\S+)$/, (m, [p]) => void (only(m).currentStep = stepNumber(p) === 1 ? undefined : stepNumber(p))],
	[
		/^una tarea puntual (\S+) sin fecha límite$/,
		(m, [t]) => create(m, dataOf('puntual sin fecha límite', t), SCENARIO_BEFORE)
	],
	[
		/^creo una tarea puntual con título (.*), emoji (.*) y nota (.*)$/,
		(m, [t, e, n]) => create(m, withWritten(dataOf('puntual sin fecha límite', t), { emoji: e, note: n }), undefined)
	],
	[new RegExp(`^una tarea puntual sin fecha límite${created}$`), (m, [c]) => create(m, dataOf('puntual sin fecha límite', 'Tarea'), CREATION_MOMENT(c))],
	[/^una tarea puntual con fecha límite (\S+)$/, (m, [l]) => create(m, dataOf(`puntual con fecha límite ${l}`, 'Tarea'), undefined)],
	[
		/^una tarea puntual (\S+) con fecha límite (\S+)$/,
		(m, [t, l]) => create(m, dataOf(`puntual con fecha límite ${l}`, t), SCENARIO_BEFORE)
	],
	[
		new RegExp(`^una tarea periódica relativa cada (\\S+) (\\S+)${created}$`),
		(m, [n, u, c]) => create(m, dataOf(`periódica relativa cada ${n} ${u}`, 'Tarea'), CREATION_MOMENT(c))
	],
	[/^una tarea periódica relativa nunca completada$/, (m) => create(m, dataOf('periódica relativa cada 1 horas', 'Tarea'), undefined)],
	[
		/^una tarea periódica relativa (?!cada )(\S+) cada (\S+) (\S+)$/,
		(m, [t, n, u]) => create(m, dataOf(`periódica relativa cada ${n} ${u}`, t), SCENARIO_BEFORE)
	],
	[
		/^una tarea periódica relativa (\S+) nunca completada creada el (\S+)$/,
		(m, [t, c]) => create(m, dataOf('periódica relativa cada 1 horas', t), moment(c))
	],
	[
		new RegExp(`^una tarea periódica (semanal los|mensual los días) (.*?)${created}$`),
		(m, [f, d, c]) => create(m, dataOf(`periódica ${f} ${d}`, 'Tarea'), CREATION_MOMENT(c))
	],
	[
		new RegExp(`^una tarea periódica (${SHAPES}) (\\S+) (?:los|los días) (.*?)${created}$`),
		(m, [f, t, d, c]) =>
			create(m, dataOf(`periódica ${f === 'semanal' ? 'semanal los' : 'mensual los días'} ${d}`, t), CREATION_MOMENT(c) ?? SCENARIO_BEFORE)
	]
];

/** "la tarea tiene un completado ..." ya guardado: su momento es el inicio del día cubierto si el paso no lo da. */
function saveCompletion(m: OracleWorld, task: Doc, at: number, covered: Date): void {
	m.completions = [...m.completions, { id: m.next++, taskId: task.id, at, covered }];
}

/** §4.4: una ocurrencia cubierta es una fecha (sin hora) o, con hora, el inicio de una ocurrencia. */
function saveCompletionOf(m: OracleWorld, task: Doc, at: number, covered: string): void {
	const start = date(covered);
	if (start === undefined) return saveCompletion(m, task, at, dayOf(covered));
	m.completions = [...m.completions, { id: m.next++, taskId: task.id, at, startCovered: start }];
}

const COMPLETIONS: Step[] = [
	// §4.4: un completado de la mínima, ya guardado (sin aviso y sin tocar el paso en que va la tarea).
	[
		/^la tarea fue completada el (\S+) en el paso (\S+) con la mínima$/,
		(m, [t, step]) => {
			const completion = complete(m, only(m), m.completions, moment(t), undefined, true);
			completion.step = stepNumber(step);
		}
	],
	[/^la tarea fue completada el (\S+) con la mínima$/, (m, [t]) => void complete(m, only(m), m.completions, moment(t), undefined, true)],
	[/^la tarea (\S+) fue completada el (\S+) con la mínima$/, (m, [t, e]) => void complete(m, withTitle(m, t), m.completions, moment(e), undefined, true)],
	// §4.4: un completado que guarda el paso en que iba la tarea, sin tocar el paso en que va hoy.
	[
		/^la tarea fue completada el (\S+) en el paso (\S+)$/,
		(m, [t, step]) => void (complete(m, only(m), m.completions, moment(t)).step = stepNumber(step))
	],
	[/^la tarea fue completada el (\S+)$/, (m, [t]) => void complete(m, only(m), m.completions, moment(t))],
	[/^la tarea (\S+) fue completada el (\S+)$/, (m, [t, e]) => void complete(m, withTitle(m, t), m.completions, moment(e))],
	[/^completo la tarea el (\S+)$/, (m, [e]) => completeMe(m, only(m), moment(e))],
	[/^completo la tarea (\S+) el (\S+)$/, (m, [t, e]) => completeMe(m, withTitle(m, t), moment(e))],
	[
		/^la tarea (\S+) fue completada el (\S+) con id (\S+)$/,
		(m, [t, e, id]) => void complete(m, withTitle(m, t), m.completions, moment(e), id)
	],
	[
		/^la tarea tiene un completado del (\S+) que cubre el (\S+)$/,
		(m, [e, c]) => saveCompletionOf(m, only(m), moment(e), c)
	],
	[
		/^la tarea tiene un completado que cubre el (\S+)$/,
		(m, [c]) => saveCompletion(m, only(m), dayOf(c).getTime(), dayOf(c))
	],
	[
		/^la tarea (\S+) tiene un completado que cubre el (\S+)$/,
		(m, [t, c]) => saveCompletion(m, withTitle(m, t), dayOf(c).getTime(), dayOf(c))
	]
];

const OTHER = 'otro dispositivo, sin ver ese cambio,';

const ONLY_SPACES = '   ';

/** Cambios de la nota (§4.1, §6.2): lo escrito en el panel, con el resto de la tarea como está. */
const NOTE_CHANGES: [string, (c: string[]) => WrittenData][] = [
	['la nota a (.*) con espacios al inicio y al final', ([n]) => ({ note: `  \n ${n} \n  ` })],
	['la nota a (.*) y (.*) en líneas separadas', ([a, b]) => ({ note: `${a}\n${b}` })],
	['la nota a una de solo espacios', () => ({ note: ONLY_SPACES })],
	['la nota a una de (\\S+) caracteres', ([l]) => ({ note: 'x'.repeat(numeric(l)) })],
	['la nota a (.*)', ([n]) => ({ note: n })]
];

/** Cambios del primer paso (§4.1, §6.2): lo escrito en el campo; quitarlo es vaciarlo. */
const CHANGES_OF_FIRST_STEP: [string, (c: string[]) => WrittenData][] = [
	['el primer paso a (.*) con espacios al inicio y al final', ([p]) => ({ firstStep: `  ${p}  ` })],
	['el primer paso a uno de solo espacios', () => ({ firstStep: ONLY_SPACES })],
	['el primer paso a uno de (\\S+) caracteres', ([l]) => ({ firstStep: 'x'.repeat(numeric(l)) })],
	['el primer paso a (.*)', ([p]) => ({ firstStep: p })]
];

const editsOfFirstStep = (): Step[] => [
	...CHANGES_OF_FIRST_STEP.flatMap(([text, written]): Step[] => [
		[new RegExp(`^edito ${text}$`), (m, c) => editMe(m, undefined, (base) => keeping(base, docData(base), written(c)))],
		[new RegExp(`^${OTHER} edita ${text}$`), (m, c) => editsOther(m, (base) => keeping(base, docData(base), written(c)))]
	]),
	[/^quito el primer paso$/, (m) => editMe(m, undefined, (base) => keeping(base, docData(base), { firstStep: '' }))],
	[new RegExp(`^${OTHER} quita el primer paso$`), (m) => editsOther(m, (base) => keeping(base, docData(base), { firstStep: '' }))]
];

/** Cambios de la versión mínima (§4.1, §6.2): lo escrito en el campo; quitarla es vaciarlo. */
const CHANGES_OF_MINIMAL_VERSION: [string, (c: string[]) => WrittenData][] = [
	['la versión mínima a (.*) con espacios al inicio y al final', ([v]) => ({ minimalVersion: `  ${v}  ` })],
	['la versión mínima a una de solo espacios', () => ({ minimalVersion: ONLY_SPACES })],
	['la versión mínima a una de (\\S+) caracteres', ([l]) => ({ minimalVersion: 'x'.repeat(numeric(l)) })],
	['la versión mínima a (.*)', ([v]) => ({ minimalVersion: v })]
];

const editsOfMinimalVersion = (): Step[] => [
	...CHANGES_OF_MINIMAL_VERSION.flatMap(([text, written]): Step[] => [
		[new RegExp(`^edito ${text}$`), (m, c) => editMe(m, undefined, (base) => keeping(base, docData(base), written(c)))],
		[new RegExp(`^${OTHER} edita ${text}$`), (m, c) => editsOther(m, (base) => keeping(base, docData(base), written(c)))]
	]),
	[/^quito la versión mínima$/, (m) => editMe(m, undefined, (base) => keeping(base, docData(base), { minimalVersion: '' }))],
	[new RegExp(`^${OTHER} quita la versión mínima$`), (m) => editsOther(m, (base) => keeping(base, docData(base), { minimalVersion: '' }))]
];

/** Cambios de un paso (§4.1, Pasos): lo escrito en su campo; vaciarlo lo descarta y los de abajo suben. */
const STEP_CHANGES: [string, (c: string[]) => string][] = [
	['(.*) con espacios al inicio y al final', ([p]) => `  ${p}  `],
	['uno de solo espacios', () => ONLY_SPACES],
	['uno de (\\S+) caracteres', ([l]) => 'x'.repeat(numeric(l))],
	['(.*)', ([p]) => p]
];

/** Los pasos de la tarea con el paso `n` escrito; uno más que la cantidad lo agrega al final. */
function withStep(base: Doc, n: string, text: string): WrittenData {
	const list = stepsOf(base);
	const place = numeric(n);
	if (!Number.isInteger(place) || place < 1 || place > list.length + 1) undecided(`paso ${n}`);
	const fresh = place === list.length + 1 ? [...list, text] : list.map((step, i) => (i === place - 1 ? text : step));
	return { firstStep: fresh[0], steps: fresh.slice(1) };
}

const stepsEdits = (): Step[] => [
	...STEP_CHANGES.flatMap(([text, written]): Step[] => [
		[new RegExp(`^edito el paso (\\S+) a ${text}$`), (m, [n, ...c]) => editMe(m, undefined, (base) => keeping(base, docData(base), withStep(base, n, written(c))))],
		[new RegExp(`^${OTHER} edita el paso (\\S+) a ${text}$`), (m, [n, ...c]) => editsOther(m, (base) => keeping(base, docData(base), withStep(base, n, written(c))))]
	]),
	[/^vacío el paso (\S+)$/, (m, [n]) => editMe(m, undefined, (base) => keeping(base, docData(base), withStep(base, n, '')))],
	[
		/^edito la tarea con (\S+) pasos$/,
		(m, [count]) => {
			const steps = Array.from({ length: numeric(count) }, (_, i) => `Paso ${i + 1}`);
			editMe(m, undefined, (base) => keeping(base, docData(base), { firstStep: steps[0], steps: steps.slice(1) }));
		}
	]
];

/** §4.1 (Pasos: Avance) y §6.1: «Hecho» pasa al paso siguiente; en el último completa la tarea como el checkbox. */
function tapDone(m: OracleWorld, task: Doc, at: number): void {
	m.touchedAt ??= at;
	const d = derived(task);
	if (!severalSteps(d) || !seesLine(rowStatus(m, d, at))) undecided('«Hecho» no se ve');
	const step = stepInThatGoes(d);
	if (step === stepsOf(d).length) return completeIfPossible(m, d, at);
	m.before = copy(m);
	goOnStep(m, d.id, step + 1);
}

/** El otro dispositivo decide con la tarea que veía, y su cambio llega a lo guardado hoy (§7). */
function dueDoneOther(m: OracleWorld, at: number): void {
	const seen = thatSawOther(m);
	const d = derived(only(seen));
	if (!severalSteps(d)) undecided('«Hecho» no se ve');
	const step = stepInThatGoes(d);
	if (step < stepsOf(d).length) return goOnStep(m, d.id, step + 1);
	if (d.schedule && !insideOfTimeWindow(d.schedule, at)) return;
	complete(m, d, seen.completions, at);
	goOnStep(m, d.id, 1);
}

/**
 * §6.1: «Hice la mínima» está en las filas pendiente y atrasada con versión mínima; completa como el checkbox, con el
 * completado de la mínima, y deshabilitado (fuera de la ventana, §5.5) no hace nada.
 */
function tapMinimal(m: OracleWorld, task: Doc, at: number): void {
	m.touchedAt ??= at;
	const d = derived(task);
	if (d.minimalVersion === undefined || !seesLine(rowStatus(m, d, at))) undecided('«Hice la mínima» no se ve');
	completeIfPossible(m, d, at, true);
}

/** El otro dispositivo decide con la tarea que veía, y su completado llega a lo guardado hoy (§7). */
function dueMinimalOther(m: OracleWorld, at: number): void {
	const seen = thatSawOther(m);
	const d = derived(only(seen));
	if (d.minimalVersion === undefined || !seesLine(rowStatus(seen, d, at))) undecided('«Hice la mínima» no se ve');
	if (d.schedule && !insideOfTimeWindow(d.schedule, at)) return;
	complete(m, d, seen.completions, at, undefined, true);
	goOnStep(m, d.id, 1);
}

const ROW_STEPS: Step[] = [
	[/^toco Hice la mínima el (\S+)$/, (m, [e]) => tapMinimal(m, only(m), moment(e))],
	[/^toco Hice la mínima en la tarea (\S+) el (\S+)$/, (m, [t, e]) => tapMinimal(m, withTitle(m, t), moment(e))],
	[new RegExp(`^${OTHER} toca Hice la mínima el (\\S+)$`), (m, [e]) => dueMinimalOther(m, moment(e))],
	[/^toco Hecho el (\S+)$/, (m, [e]) => tapDone(m, only(m), moment(e))],
	[/^toco Hecho en la tarea (\S+) el (\S+)$/, (m, [t, e]) => tapDone(m, withTitle(m, t), moment(e))],
	[
		/^toco Paso anterior$/,
		(m) => {
			const d = derived(only(m));
			if (!severalSteps(d)) undecided('«Paso anterior» no se ve');
			m.before = copy(m);
			goOnStep(m, d.id, Math.max(1, stepInThatGoes(d) - 1));
		}
	],
	[new RegExp(`^${OTHER} toca Hecho el (\\S+)$`), (m, [e]) => dueDoneOther(m, moment(e))]
];

/** Elegir un emoji en el selector o quitarlo (§6.2): quien edita elige o quita; quitar es dejar el campo vacío. */
const EMOJI_CHANGES: [RegExp, string, (c: string[]) => WrittenData][] = [
	[/^elijo el emoji (.*) y edito la nota a (.*)$/, 'yo', ([e, n]) => ({ emoji: e, note: n })],
	[/^elijo el emoji (.*)$/, 'yo', ([e]) => ({ emoji: e })],
	[/^quito el emoji$/, 'yo', () => ({ emoji: '' })],
	[new RegExp(`^${OTHER} elige el emoji (.*)$`), 'otro', ([e]) => ({ emoji: e })]
];

function editsOfEmojiAndNote(): Step[] {
	const ofNote = NOTE_CHANGES.flatMap(([text, written]): Step[] => [
		[
			new RegExp(`^edito ${text}$`),
			(m, c) => editMe(m, undefined, (base) => keeping(base, docData(base), written(c)))
		],
		[
			new RegExp(`^${OTHER} edita ${text}$`),
			(m, c) => editsOther(m, (base) => keeping(base, docData(base), written(c)))
		]
	]);
	const ofEmoji = EMOJI_CHANGES.map(([pattern, who, written]): Step => [
		pattern,
		(m, c) =>
			who === 'yo'
				? editMe(m, undefined, (base) => keeping(base, docData(base), written(c)))
				: editsOther(m, (base) => keeping(base, docData(base), written(c)))
	]);
	return [...ofNote, ...ofEmoji];
}

/** Cambiar el horario (§6.2): quien edita escribe una o más ventanas, ninguna (lo quita) o una con una sola hora. */
const withSchedule = (written: WrittenPairs) => (base: Doc) => withScheduleWritten(docData(base), written);

const SCHEDULE_EDITS: Step[] = [
	[new RegExp(`^pongo el horario ${SCHEDULE}$`), (m, hours) => editMe(m, undefined, withSchedule(writtenOf(hours)))],
	[/^quito el horario$/, (m) => editMe(m, undefined, withSchedule([]))],
	[/^pongo un horario con solo la hora de inicio (\S+)$/, (m, [d]) => editMe(m, undefined, withSchedule([[d, undefined]]))],
	[new RegExp(`^${OTHER} pone el horario ${SCHEDULE}$`), (m, hours) => editsOther(m, withSchedule(writtenOf(hours)))],
	[new RegExp(`^${OTHER} quita el horario$`), (m) => editsOther(m, withSchedule([]))],
	[
		new RegExp(`^edito en una misma edición el título a (.+) y el horario ${SCHEDULE}$`),
		(m, [t, ...hours]) => editMe(m, undefined, (base) => withValidation({ ...withSchedule(writtenOf(hours))(base), title: t }))
	]
];

const EDITS: Step[] = [
	...SCHEDULE_EDITS,
	// §5.8: pasar una periódica pausada a puntual la reanuda en ese momento.
	[
		/^edito la tarea a puntual sin fecha límite el (\S+)$/,
		(m, [e]) => editMe(m, undefined, (base) => keeping(base, dataOf('puntual sin fecha límite', base.title)), moment(e))
	],
	[
		/^edito la tarea a (.*)$/,
		(m, [def]) => editMe(m, undefined, (base) => keeping(base, dataOf(def, base.title)))
	],
	[
		/^edito la tarea (\S+) a (.*)$/,
		(m, [t, def]) => editMe(m, t, (base) => keeping(base, dataOf(def, base.title)))
	],
	[new RegExp(`^${OTHER} edita la tarea a (.*)$`), (m, [def]) => editsOther(m, (base) => keeping(base, dataOf(def, base.title)))],
	[
		/^edito el título a uno de solo espacios$/,
		(m) => editMe(m, undefined, (base) => withValidation({ ...docData(base), title: '   ' }))
	],
	[
		/^edito el título a (.*)$/,
		(m, [t]) => editMe(m, undefined, (base) => withValidation({ ...docData(base), title: t }))
	],
	[
		new RegExp(`^${OTHER} edita el título a (.*)$`),
		(m, [t]) => editsOther(m, (base) => withValidation({ ...docData(base), title: t }))
	],
	[
		/^edito en una misma edición el título a (.+) y la fecha límite a (\S+)$/,
		(m, [t, l]) => editMe(m, undefined, (base) => keeping(base, withValidation(dataOf(`puntual con fecha límite ${l}`, t))))
	],
	[new RegExp(`^${OTHER} guarda la tarea sin cambios$`), (m) => editsOther(m, docData)],
	...editsOfEmojiAndNote(),
	...editsOfFirstStep(),
	...editsOfMinimalVersion(),
	...stepsEdits(),
	...ROW_STEPS
];

/** Pausar y reanudar (§5.8, §6.2): el botón del panel actúa en el momento; solo las periódicas se pausan. */
function pause(m: OracleWorld, d: Doc): void {
	if (d.kind !== 'periodica') undecided('la tarea no se puede pausar');
	m.docs = m.docs.map((x) => (x.id === d.id ? { ...x, paused: true } : x));
}

function resume(m: OracleWorld, d: Doc, at: number): void {
	if (!d.paused) undecided('la tarea no está pausada');
	m.docs = m.docs.map((x) => (x.id === d.id ? { ...x, paused: undefined, resumed: at } : x));
}

/**
 * §5.9 y §6.2: Posponer solo actúa si el panel, con lo que ve quien pospone, lo ofrece en ese momento. El cambio
 * escribe solo `pospuesta`, entera (§7), y llega a lo guardado hoy.
 */
function postpone(m: OracleWorld, view: Saved, option: string, value: string): void {
	const postponed = postponementOf(option, value) ?? undecided('opción de posponer');
	const d = derived(only(view));
	if (postponeButton({ ...situationOf(view, d, postponed.from), paused: d.paused }) !== 'Posponer') undecided('el panel no ofrece Posponer');
	m.docs = m.docs.map((x) => (x.id === d.id ? { ...x, postponed } : x));
}

const POSTPONEMENTS: Step[] = [
	[/^la tarea fue pospuesta con la opción (.+) el (\S+)$/, (m, [o, e]) => postpone(m, m, o, e)],
	[
		/^pospongo la tarea con la opción (.+) el (\S+)$/,
		(m, [o, e]) => {
			m.before = copy(m);
			postpone(m, m, o, e);
		}
	],
	[new RegExp(`^${OTHER} pospone la tarea con la opción (.+) el (\\S+)$`), (m, [o, e]) => postpone(m, thatSawOther(m), o, e)]
];

const PAUSES: Step[] = [
	[/^la tarea fue pausada$/, (m) => pause(m, derived(only(m)))],
	[/^la tarea (\S+) fue pausada$/, (m, [t]) => pause(m, derived(withTitle(m, t)))],
	[
		/^pauso la tarea$/,
		(m) => {
			m.before = copy(m);
			pause(m, derived(only(m)));
		}
	],
	// §7: pausar escribe solo `pausada`; llega a lo guardado hoy aunque el otro dispositivo no haya visto la reanudación.
	[new RegExp(`^${OTHER} pausa la tarea$`), (m) => pause(m, derived(only(m)))],
	[
		/^reanudo la tarea el (\S+)$/,
		(m, [e]) => {
			m.before = copy(m);
			resume(m, derived(only(m)), moment(e));
		}
	],
	[
		/^reanudo la tarea (\S+) el (\S+)$/,
		(m, [t, e]) => {
			m.before = copy(m);
			resume(m, derived(withTitle(m, t)), moment(e));
		}
	]
];

const DELETED: Step[] = [
	[
		/^borro la tarea$/,
		(m) => {
			m.before = copy(m);
			remove(m, only(m), m.completions);
		}
	],
	[
		/^borro la tarea (\S+)$/,
		(m, [t]) => {
			m.before = copy(m);
			remove(m, withTitle(m, t), m.completions);
		}
	],
	[
		new RegExp(`^${OTHER} borra la tarea$`),
		(m) => {
			const seen = thatSawOther(m);
			remove(m, only(seen), seen.completions);
		}
	],
	[
		new RegExp(`^${OTHER} completa la tarea (\\S+) el (\\S+)$`),
		(m, [t, e]) => {
			const seen = thatSawOther(m);
			const task = withTitle(seen, t);
			complete(m, task, seen.completions, moment(e));
			goOnStep(m, task.id, 1);
		}
	]
];

const UNDOS: Step[] = [
	[
		/^borro el completado del (\S+)$/,
		(m, [e]) => {
			m.before = copy(m);
			undoCompletion(m, theCompletionOf(m, moment(e)).id);
		}
	],
	[new RegExp(`^${OTHER} borra el completado del (\\S+)$`), (m, [e]) => undoCompletion(m, theCompletionOf(m, moment(e)).id)],
	[/^toco Deshacer en el aviso el (\S+)$/, (m, [e]) => tapUndo(m, moment(e))],
	[/^toco el checkbox de la tarea el (\S+)$/, (m, [e]) => tapCheckbox(m, moment(e))]
];

/** El orden de la lista no se decide a veces: solo importa si un Then lo mira; la fila de los pasos no lo necesita. */
function queryPending(m: OracleWorld, now: number | undefined): void {
	m.pendingAt = now;
	m.queryPending = true;
	try {
		m.order = orderIn(m, now);
		m.orderUndecided = false;
	} catch (error) {
		if (!(error instanceof Undecided)) throw error;
		m.order = undefined;
		m.orderUndecided = true;
	}
}

const QUERIES: Step[] = [
	[
		/^consulto el aviso el (\S+)$/,
		(m, [t]) => {
			m.noticeSeen = queryNotice(m, moment(t));
			m.noticeText = noticeText(m, moment(t));
			m.noticeIn = moment(t);
		}
	],
	[/^consulto el Historial el (\S+)$/, (m, [t]) => void (m.history = queryHistory(m, moment(t)))],
	[/^consulto la última vez el (\S+)$/, (m, [t]) => void (m.lastTime = queryLastTime(m, moment(t)))],
	[
		/^consulto el estado el (\S+)$/,
		(m, [t]) => {
			m.queriedAt = moment(t);
			m.status = classify(m, m.queriedAt);
		}
	],
	[/^consulto el estado en cualquier momento$/, (m) => void (m.status = classify(m, undefined))],
	[/^consulto Pendientes el (\S+)$/, (m, [t]) => queryPending(m, moment(t))],
	[/^consulto Pendientes en cualquier momento$/, (m) => queryPending(m, undefined)],
	[new RegExp(`^${SHOW_COMPLETED}$`), (m) => void (m.showCompleted = true)],
	// §6.1: las pausadas se ven con este check; la línea del paso no se ve en ellas.
	[/^Mostrar pausadas está encendido$/, () => undefined]
];

const STEPS: Step[] = [...CREATIONS, ...COMPLETIONS, ...PAUSES, ...POSTPONEMENTS, ...EDITS, ...DELETED, ...UNDOS, ...QUERIES];

// ---- Lo que cada Then observa ----

const statusQueried = (m: OracleWorld) => m.status ?? (m.touchedAt === undefined ? undecided('sin consulta de estado') : classify(m, m.touchedAt));
const statusKind = (classification: string) => (classification.startsWith('en espera') ? 'en espera' : classification);
const day_ = (d: Date | undefined) => (d === undefined ? '-' : isoDay(d));

/** §4.4: la ocurrencia cubierta, con hora si la tiene (formatos distintos). */
const coveredInText = (c: Completion) => (c.startCovered === undefined ? day_(c.covered) : `inicio ${c.startCovered}`);
const theTask = (m: OracleWorld) => derived(only(m));
const theOneThatHadBefore = theOneThatHad;
/** §6.1: la tarea consultada está completada (puntual con completados, o periódica en espera con completados). */
const completedQueried = (m: OracleWorld) =>
	!isPaused(m) && isCompleted(theTask(m).kind === 'puntual', statusKind(statusQueried(m)) === 'en espera' && !postponedQueried(m), activeOf(m, only(m)).length > 0);
/** §5.9: en espera por la posposición en el momento consultado: no está completada. */
const postponedQueried = (m: OracleWorld) => {
	const at = m.queriedAt ?? m.touchedAt;
	return at !== undefined && inWaitByPostponement(situationOf(m, only(m), at));
};
const postponementKey = (p: Postponement | undefined) => (p ? `${p.from} ${p.to}` : '-');
/** §5.8: una pausada no tiene estado, no está completada y su checkbox está deshabilitado. */
const isPaused = (m: OracleWorld) => theTask(m).paused === true;
const fresh = (m: OracleWorld) => m.updated ?? undecided('no se completó');
/** Lo que queda de la tarea: si cada completado es del momento que el paso nombra, y si cubre una ocurrencia. */
const onlyCompletionOf = (m: OracleWorld, d: Doc, named: string) =>
	JSON.stringify(completionsOf(m, d.id).map((c) => [c.at === moment(named), c.covered !== undefined || c.startCovered !== undefined]));

/** §6.1: la fila de la tarea en ese momento (o en cualquiera): pausada, en espera por la posposición o el estado de §5. */
function rowStatus(m: Saved, task: Doc, at: number | undefined): string {
	if (task.kind === 'periodica' && task.paused) return 'pausada';
	if (at === undefined && task.postponed) undecided('posposición en cualquier momento');
	const s = situationOf(m, task, at);
	return at !== undefined && inWaitByPostponement(s) ? 'en espera' : (classifySituation(s, { progress: false }) ?? undecided('estado'));
}

/** §6.1: la línea del paso (y sus botones) solo se ve en las filas pendiente y atrasada; no en `en espera` ni pausadas. */
const seesLine = (status: string) => status === 'pendiente' || status === 'atrasada';

/** Lo que la fila muestra de los pasos en la última consulta de Pendientes (§6.1). */
interface StepsRow {
	line: string;
	buttons: string;
	/** Si «Hecho» está habilitado; solo se decide cuando un Then lo mira (el checkbox puede no decidirse). */
	done: () => string;
}

const WITHOUT_BUTTONS = 'sin botones';

/**
 * §6.1: la línea del paso en que va la tarea, «Primer paso: …» en el paso 1 y «Paso: …» en otro; con dos pasos o más,
 * «Paso anterior» (no en el paso 1) y «Hecho», habilitado salvo en el último paso si el checkbox está deshabilitado.
 */
function theRowOfSteps(m: OracleWorld): StepsRow {
	if (!m.queryPending) undecided('sin consulta de Pendientes');
	const task = only(m);
	const steps = stepsOf(task);
	const withoutButtons = () => WITHOUT_BUTTONS;
	const withoutLine = { line: 'sin texto', buttons: WITHOUT_BUTTONS, done: withoutButtons };
	if (steps.length === 0 || !seesLine(rowStatus(m, task, m.pendingAt))) return withoutLine;
	const step = stepInThatGoes(task);
	const line = `${step === 1 ? 'Primer paso' : 'Paso'}: ${steps[step - 1]}`;
	if (steps.length < 2) return { line, buttons: WITHOUT_BUTTONS, done: withoutButtons };
	const checkbox = () => classifySituation(situationOf(m, task, m.pendingAt), { progress: false, checkbox: true, onlyCheckbox: true })?.replace('checkbox ', '') ?? undecided('checkbox');
	return { line, buttons: step > 1 ? 'Paso anterior y Hecho' : 'Hecho', done: () => (step < steps.length ? 'habilitado' : checkbox()) };
}

/**
 * §6.1: la línea de la mínima y su botón: se ven solo en las filas pendiente y atrasada con versión mínima; el botón
 * está habilitado como el checkbox que completaría (§5.5).
 */
function theRowOfMinimal(m: OracleWorld): { line: string; button: () => string } {
	if (!m.queryPending) undecided('sin consulta de Pendientes');
	const task = only(m);
	if (task.minimalVersion === undefined || !seesLine(rowStatus(m, task, m.pendingAt))) return { line: 'sin mínima', button: () => 'sin mínima' };
	const checkbox = () => classifySituation(situationOf(m, task, m.pendingAt), { progress: false, checkbox: true, onlyCheckbox: true })?.replace('checkbox ', '') ?? undecided('checkbox');
	return { line: `Mínima: ${task.minimalVersion}`, button: checkbox };
}

const OF_ROW_OF_STEPS = /^(?:la fila de la tarea (?:muestra el paso |muestra los botones |no muestra botones de paso$|no muestra primer paso$|muestra la mínima |no muestra mínima$)|el botón Hecho de la tarea está |el botón Hice la mínima de la tarea está |el checkbox de la tarea está )/;

type Observation = [RegExp, (m: OracleWorld, c: string[]) => string];

const OBSERVATIONS: Observation[] = [
	[/^el estado es (?:pendiente|en espera|atrasada)$/, (m) => statusKind(statusQueried(m))],
	[/^el progreso es (\S+)$/, (m) => statusQueried(m)],
	// Con Mostrar completadas apagado, las completadas no tienen fila (§6.1).
	[/^la tarea no aparece en Pendientes$/, (m) => String(!m.showCompleted && completedQueried(m))],
	[/^la tarea está completada$/, (m) => String(completedQueried(m))],
	[/^la tarea no está completada$/, (m) => String(!completedQueried(m))],
	[/^la tarea está pausada$/, (m) => String(isPaused(m))],
	[/^la tarea no está pausada$/, (m) => String(!isPaused(m))],
	[/^la tarea no tiene estado$/, (m) => String(isPaused(m))],
	[/^la tarea está pospuesta desde (\S+) hasta (\S+)$/, (m) => postponementKey(only(m).postponed)],
	[/^la tarea no está pospuesta$/, (m) => String(only(m).postponed === undefined)],
	[/^la tarea tiene (?:un completado|dos completados)$/, (m) => String(completionsOf(m, only(m).id).length)],
	[/^el nuevo completado se agrega sin modificar los anteriores$/, (m) => String(m.updated !== undefined)],
	[/^se registró un completado sin ocurrencia cubierta$/, (m) => String(fresh(m).covered === undefined && fresh(m).startCovered === undefined)],
	[/^el completado registrado es del (\S+)$/, (m) => String(fresh(m).at)],
	[/^Pendientes muestra en orden (.*)$/, (m) => m.order ?? undecided('sin consulta de Pendientes')],
	[/^la tarea tiene título (.+)$/, (m) => theTask(m).title],
	[/^la tarea es (?:puntual|periódica)$/, (m) => theTask(m).kind],
	[/^su fecha límite es (\S+)$/, (m) => (theTask(m).kind === 'puntual' ? day_(theTask(m).limit) : undecided('no es puntual'))],
	[/^la tarea no tiene fecha límite$/, (m) => String(only(m).limit === undefined)],
	[/^la tarea tiene emoji (.*)$/, (m) => only(m).emoji ?? '-'],
	[/^la tarea no tiene emoji$/, (m) => String(only(m).emoji === undefined)],
	[/^la tarea tiene nota (.*)$/, (m) => only(m).note ?? '-'],
	[/^la tarea no tiene nota$/, (m) => String(only(m).note === undefined)],
	[/^la tarea tiene primer paso (.*)$/, (m) => only(m).firstStep ?? '-'],
	[/^la fila de la tarea (?:muestra el primer paso .*|muestra el paso .*|no muestra primer paso)$/, (m) => theRowOfSteps(m).line],
	[/^la fila de la tarea (?:muestra los botones .*|no muestra botones de paso)$/, (m) => theRowOfSteps(m).buttons],
	[/^el botón Hecho de la tarea está (?:habilitado|deshabilitado)$/, (m) => theRowOfSteps(m).done()],
	[
		/^el checkbox de la tarea está (?:habilitado|deshabilitado)$/,
		(m) => {
			const at = m.pendingAt ?? m.queriedAt ?? m.touchedAt ?? undecided('sin momento');
			return classifySituation(situationOf(m, derived(only(m)), at), { progress: false, checkbox: true, onlyCheckbox: true }) ?? undecided('checkbox');
		}
	],
	[/^la tarea va en el paso (\S+)$/, (m) => String(stepInThatGoes(derived(only(m))))],
	[/^la tarea tiene los pasos (.*)$/, (m) => stepsOf(only(m)).join(', ')],
	[/^la tarea no tiene más pasos$/, (m) => String(only(m).steps === undefined)],
	[/^la tarea tiene (\S+) pasos$/, (m) => String(stepsOf(only(m)).length)],
	[/^el paso (\S+) de la tarea tiene (\S+) caracteres$/, (m, [n]) => String(stepsOf(only(m))[stepNumber(n) - 1]?.length)],
	[/^el último completado de la tarea guarda el paso (\S+)$/, (m) => String(theMoreRecent(completionsOf(m, only(m).id)).step)],
	[/^el último completado de la tarea no guarda paso$/, (m) => String(theMoreRecent(completionsOf(m, only(m).id)).step === undefined)],
	[/^la tarea no tiene primer paso$/, (m) => String(only(m).firstStep === undefined)],
	[/^la tarea tiene versión mínima (.*)$/, (m) => only(m).minimalVersion ?? '-'],
	[/^la tarea no tiene versión mínima$/, (m) => String(only(m).minimalVersion === undefined)],
	[/^la tarea tiene una versión mínima de (\S+) caracteres$/, (m) => String(only(m).minimalVersion?.length)],
	[/^la fila de la tarea (?:muestra la mínima .*|no muestra mínima)$/, (m) => theRowOfMinimal(m).line],
	[/^el botón Hice la mínima de la tarea está (?:habilitado|deshabilitado)$/, (m) => theRowOfMinimal(m).button()],
	[/^el último completado de la tarea fue (?:la mínima|entero)$/, (m) => String(theMoreRecent(completionsOf(m, only(m).id)).minimal === true)],
	[/^la tarea tiene dos completados, uno entero y uno de la mínima$/, (m) => JSON.stringify(completionsOf(m, only(m).id).map((c) => c.minimal === true).sort())],
	[/^el aviso del completado dice (.*)$/, (m) => m.noticeText ?? undecided('sin consulta del aviso')],
	[/^la tarea tiene un primer paso de (\S+) caracteres$/, (m) => String(only(m).firstStep?.length)],
	[/^la nota de la tarea tiene dos líneas: .*$/, (m) => JSON.stringify(only(m).note?.split('\n'))],
	[/^la tarea tiene una nota de (\S+) caracteres$/, (m) => String(only(m).note?.length)],
	[/^el nombre de la tarea es .*$/, (m) => nameOf(only(m))],
	[/^la tarea no tiene recurrencia$/, (m) => String(only(m).recurrence === undefined)],
	[
		/^su recurrencia es (?:relativa cada|semanal los|mensual los días) .*$/,
		(m) => (theTask(m).kind === 'periodica' ? recurrenceKey(theTask(m).recurrence) : undecided('no es periódica'))
	],
	[/^la tarea sigue creada el (\S+)$/, (m) => String(only(m).created)],
	[/^la tarea conserva su id$/, (m) => String(only(m).id === only(thatSawOther(m)).id)],
	[/^la tarea conserva un solo completado, del (\S+)$/, (m, [e]) => onlyCompletionOf(m, only(m), e)],
	[/^la tarea (\S+) conserva un solo completado, del (\S+)$/, (m, [t, e]) => onlyCompletionOf(m, withTitle(m, t), e)],
	[/^el aviso del completado (?:muestra el regreso .*|no muestra regreso)$/, (m) => noticeReturn(m)],
	[/^la tarea no tiene completados$/, (m) => String(completionsOf(m, only(m).id).length === 0)],
	[/^el aviso ofrece deshacer el completado de (\S+) del (\S+)$/, (m) => m.noticeSeen ?? undecided('sin consulta del aviso')],
	[/^no hay aviso$/, (m) => String((m.noticeSeen ?? undecided('sin consulta del aviso')) === 'sin aviso')],
	[/^el Historial muestra (.*)$/, (m) => m.history ?? undecided('sin consulta del Historial')],
	[/^la última vez muestra (.*)$/, (m) => m.lastTime ?? undecided('sin consulta de la última vez')],
	[/^el Historial está vacío$/, (m) => String((m.history ?? undecided('sin consulta del Historial')) === '')],
	[/^la edición se rechaza por .*$/, (m) => m.rejection ?? undecided('no hubo rechazo')],
	[/^la edición se rechaza porque la hora de fin no es posterior a la de inicio$/, (m) => m.rejection ?? undecided('no hubo rechazo')],
	[new RegExp(`^la tarea tiene horario ${SCHEDULE}$`), (m) => scheduleKey(only(m).schedule)],
	[/^la tarea no tiene horario$/, (m) => String(only(m).schedule === undefined)],
	[
		/^la tarea no cambia$/,
		(m) => String(JSON.stringify(m.docs.map(docKey)) === JSON.stringify(thatSawOther(m).docs.map(docKey)))
	],
	[
		/^no existe la tarea (\S+)$/,
		(m, [t]) => {
			const id = theOneThatHadBefore(m, t).id;
			return String(!m.docs.some((d) => d.id === id) && !m.docs.some((d) => d.title === t));
		}
	],
	[/^no queda ningún completado de (\S+)$/, (m, [t]) => String(completionsOf(m, theOneThatHadBefore(m, t).id).length === 0)],
	[/^no queda ninguna tarea$/, (m) => String(m.docs.length === 0)],
	[
		/^los completados huérfanos a limpiar son solo el de (\S+) del (\S+)$/,
		(m, [t]) => {
			const orphaned = m.completions.filter((c) => !m.docs.some((d) => d.id === c.taskId));
			return JSON.stringify([theOneThatHadBefore(m, t).id, orphaned.map((c) => [c.taskId, c.at])]);
		}
	],
	[
		/^se registró un completado que cubre el (\S+)$/,
		// Que el completado quede en el momento de completar es una invariante; lo que varía es la ocurrencia que cubre.
		(m) => (m.updated ? coveredInText(m.updated) : undecided('no se completó'))
	]
];

/** Los pasos propios de este oráculo: escenarios que editan, borran o modifican concurrentemente. */
const IS_OF_EDITING =
	/^(?:edito |vacío el paso |los pasos de la tarea |el paso actual de la tarea es |toco Hecho |toco Paso anterior$|la fila de la tarea (?:muestra los botones |no muestra botones de paso$)|el botón Hecho de la tarea está |elijo |quito el emoji$|quito el horario$|quito el primer paso$|el primer paso de la tarea |la versión mínima de la tarea |quito la versión mínima$|toco Hice la mínima |la fila de la tarea (?:muestra la mínima |no muestra mínima$)|el botón Hice la mínima |pongo |borro |toco Deshacer |toco el checkbox |consulto el aviso |consulto el Historial |consulto la última vez |otro dispositivo, sin ver ese cambio,)/;

export const isScenarioOfEditing = (texts: string[]) => texts.some((text) => IS_OF_EDITING.test(text));

function run(steps: StepOracle[], row: RowOracle, m: OracleWorld): void {
	for (const step of steps) {
		const text = resolve(step.text, row) ?? undecided(`columna faltante en ${step.text}`);
		const rule = STEPS.map(([pattern, apply]) => ({ matches: pattern.exec(text), apply })).find((r) => r.matches);
		if (!rule?.matches) undecided(`paso ${text}`);
		else rule.apply(m, rule.matches.slice(1));
	}
}

function observe(entries: StepOracle[], thens: StepOracle[], row: RowOracle): string[] {
	const m: OracleWorld = { docs: [], completions: [], next: 1, deletedDocs: [], deletedCompletions: [] };
	run(entries, row, m);
	const texts = thens.map((step) => resolve(step.text, row) ?? undecided(`columna faltante en ${step.text}`));
	// Sin orden decidido, solo los Then de la fila de los pasos se pueden observar.
	if (m.orderUndecided && !texts.every((text) => OF_ROW_OF_STEPS.test(text))) undecided('orden de Pendientes');
	return texts.map((text) => {
		const rule = OBSERVATIONS.map(([pattern, view]) => ({ matches: pattern.exec(text), view })).find((r) => r.matches);
		return rule?.matches ? rule.view(m, rule.matches.slice(1)) : undecided(`Then ${text}`);
	});
}

/**
 * Lo que observa cada Then tras ejecutar los pasos de entrada con la fila, o undefined si el oráculo no
 * reconoce algún paso o el spec no decide el resultado (por ejemplo, la tarea no existe).
 */
export function observeEditing(entries: StepOracle[], thens: StepOracle[], row: RowOracle): string[] | undefined {
	try {
		return observe(entries, thens, row);
	} catch (error) {
		if (error instanceof Undecided) return undefined;
		throw error;
	}
}
