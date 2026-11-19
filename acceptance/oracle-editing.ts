// Editing and deletion oracle: simulates, with the rules of docs/spec.md (§5 state,
// §6.2 edit and delete, §7 conflicts), the scenarios that edit, delete or
// concurrently modify a task, and returns what each Then step observes.
// It does NOT import the core or the step handlers: it is a second implementation written
// from the spec, so the implementation does not judge its own tests.
//
// A mutation is equivalent when all the observations are the same with
// the mutated value (see equivalence.ts). Anything the oracle does not recognize or cannot
// decide throws `Indeciso`, and the result is undefined (not filtered).
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

/** What is stored of a task (§4.1): it may have a field that does not match the kind (§7). */
interface Doc {
	id: number;
	title: string;
	emoji?: string;
	note?: string;
	/** §4.1: one line, trimmed; without the field, no first step. An independent field (§7). */
	firstStep?: string;
	/** §4.1 (Pasos): steps 2 onward, in order; without the field, there are no more steps. A single field, replaced whole (§7). */
	steps?: string[];
	/** §4.1 (Pasos): the step the task is on; without the field, step 1. Another independent field (§7). */
	currentStep?: number;
	/** §4.1 (Versión mínima): one line, trimmed; without the field, no minimal version. An independent field (§7). */
	minimalVersion?: string;
	kind: 'puntual' | 'periodica';
	limit?: Date;
	recurrence?: Recurrence;
	/** §4.1: one or more windows, sorted; a single field (§7). */
	schedule?: TimeWindow[];
	created?: number;
	/** §5.8: paused, and the moment of the last resume. */
	paused?: boolean;
	resumed?: number;
	/** §5.9: the stored postponement; a single field (§7). */
	postponed?: Postponement;
}

interface Completion {
	id: number;
	taskId: number;
	at: number;
	/** §4.4: the covered occurrence without a time (a day) or, with a schedule, its start. */
	covered?: Date;
	startCovered?: number;
	/** The id the scenario fixes for it ("with id c1"); used to break ties in History. */
	ident?: string;
	/** §4.4: the step the task was on when completed; only on tasks with two or more steps. */
	step?: number;
	/** §4.4: `true` if it was «Hice la mínima»; without the field, it was the full one. Set on completion. */
	minimal?: boolean;
}

/** The notice of this device's last completion (§5.4): it names the task as it was called when completed. */
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
	/** What was stored right before my last change: what another device "that has not seen that change" sees. */
	before?: Saved;
	rejection?: string;
	/** Classification of the last state query, with progress. */
	status?: string;
	/** The queried moment; without a query, what is asserted is from the moment the checkbox was tapped. */
	queriedAt?: number;
	touchedAt?: number;
	order?: string;
	/** The moment Pending was queried (§6.1); without it but with `consultoPendientes`, at any moment. */
	pendingAt?: number;
	queryPending?: boolean;
	/** Why the order of the last Pending query is not decided: it only matters if a Then looks at the order. */
	orderUndecided?: boolean;
	/** The "Mostrar completadas" check (§6.1); without it, off. */
	showCompleted?: boolean;
	updated?: Completion;
	/** What was ever deleted: it can be named even if it no longer exists. */
	deletedDocs: Doc[];
	deletedCompletions: Completion[];
	notice?: Notice;
	/** What the notice showed at the last queried moment. */
	noticeSeen?: string;
	/** The notice text at the last queried moment (§5.4); without a notice, 'sin aviso'. */
	noticeText?: string;
	/** The moment the notice was last queried. */
	noticeIn?: number;
	history?: string;
	/** What "Última vez" showed at the last queried moment (§6.2). */
	lastTime?: string;
}

/** The data the panel loads (§6.2). */
interface Data {
	title: string;
	/** What would be stored: already without spaces; without a value, the task is left without the field (§4.1). */
	emoji?: string;
	note?: string;
	firstStep?: string;
	steps?: string[];
	minimalVersion?: string;
	kind: 'puntual' | 'periodica';
	limit?: Date;
	recurrence?: Recurrence;
	schedule?: TimeWindow[];
	/** How many windows were written, valid or not (§4.1: more than one does not go on a relative task in hours). */
	timeWindowsWritten: number;
	reasons: string[];
}

// ---- Values ----

/** §4.2 lists them from Monday to Sunday. */
const MONDAY_A_SUNDAY = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const daysKey = (days: string[]) => [...days].sort((a, b) => MONDAY_A_SUNDAY.indexOf(a) - MONDAY_A_SUNDAY.indexOf(b));

function recurrenceKey(r: Recurrence | undefined): string {
	if (r === undefined) return '-';
	if ('relative' in r) return `relative ${Number(r.relative.every)} ${r.relative.unit}`;
	if ('weekly' in r) return `weekly ${daysKey(r.weekly).join(' ')}`;
	return `monthly ${[...r.monthly].sort((a, b) => a - b).join(' ')}`;
}

const scheduleKey = (h: TimeWindow[] | undefined) => (h === undefined ? '-' : h.map((v) => `${v.from}-${v.to}`).join(' '));

const docKey = (d: Doc) =>
	JSON.stringify([d.id, d.title, d.emoji, d.note, d.firstStep, d.steps, d.currentStep, d.minimalVersion, d.kind, d.limit?.getTime(), recurrenceKey(d.recurrence), scheduleKey(d.schedule), d.created, d.paused, d.resumed, d.postponed]);

const moment = (value: string) => date(value) ?? undecided(`fecha y hora ${value}`);
const dayOf = (value: string) => day(value) ?? undecided(`fecha ${value}`);
const numeric = (value: string) => (NUMBER.test(value) ? Number(value) : undecided(`número ${value}`));
const unitOf = (value: string) => (value === 'horas' || value === 'dias' ? value : undecided(`unidad ${value}`));

// ---- New data of an edit and of a creation ----

function relativeRecurrence(every: string, unit: string): Data['recurrence'] {
	numeric(every);
	return { relative: { every, unit: unitOf(unit) } };
}

/** Weekly or monthly with days: unreadable names or numbers are not decided; out-of-range ones are a rejection (§4.2). */
function calendarData(shape: string, value: string): Pick<Data, 'recurrence' | 'reasons'> {
	if (shape === 'weekly') {
		const calendar = weekdays(value) ?? undecided(`días ${value}`);
		return { recurrence: calendar, reasons: [] };
	}
	const list = elements(value) ?? undecided(`días ${value}`);
	list.forEach(numeric);
	const reasons = reasonsMonth(value) ?? undecided(`días ${value}`);
	return { recurrence: reasons.length === 0 ? (monthDays(value) as Calendar) : undefined, reasons };
}

const withoutDays = (): Pick<Data, 'recurrence' | 'reasons'> => ({ reasons: ['missing days'] });

/** Without a written schedule: the one that applies is added by whoever edits or creates. */
type Definition = [RegExp, (title: string, c: string[]) => Omit<Data, 'timeWindowsWritten'>];

const DEFINITIONS: Definition[] = [
	[
		/^one-off with due date (\S+)$/,
		(title, [l]) => ({ title, kind: 'puntual', limit: day(l), reasons: reasonsDueDate(l) })
	],
	[/^one-off without a due date$/, (title) => ({ title, kind: 'puntual', reasons: [] })],
	[
		/^relative recurring every (\S+) (\S+)$/,
		(title, [c, u]) => ({
			title,
			kind: 'periodica',
			recurrence: relativeRecurrence(c, u),
			reasons: intervalValid(c) ? [] : ['invalid interval']
		})
	],
	[
		/^(weekly recurring on|monthly recurring on days) (.*)$/,
		(title, [f, d]) => ({ title, kind: 'periodica', ...calendarData(f.split(' ')[0], d) })
	],
	[/^(?:weekly|monthly) recurring without days$/, (title) => ({ title, kind: 'periodica', ...withoutDays() })],
	[
		/^calendar recurring with weekdays and month days at once$/,
		(title) => ({ title, kind: 'periodica', reasons: ['weekly and monthly combined'] })
	]
];

/** The text fields written in the panel (§4.1): emoji, note and first step trimmed, empty means no field; an emoji that is not a single one is invalid; a first step is never invalid. */
interface WrittenData {
	emoji?: string;
	note?: string;
	firstStep?: string;
	/** The extra steps, as written (§4.1, Pasos). */
	steps?: string[];
	/** §4.1 (Versión mínima): one line; Guardar trims it and empty means no minimal version; it is never invalid. */
	minimalVersion?: string;
}

/**
 * §4.1 (Pasos): the first step and the extra steps are trimmed, the empty ones are dropped and those below move up: if the
 * first step ends up empty and step 2 does not, step 2 becomes the first step. Without extra steps, the field is not stored.
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

/** Spec §4.1: the title cannot be empty (only spaces counts as empty). */
function withValidation(data: Data): Data {
	return data.title.trim() === '' ? { ...data, reasons: ['empty title', ...data.reasons] } : data;
}

/** The text fields and the schedule of the task being edited stay the same except those the edit writes. */
const keeping = (base: Doc, data: Data, written: WrittenData = {}): Data => ({
	...withWritten(data, { emoji: base.emoji, note: base.note, firstStep: base.firstStep, steps: base.steps, minimalVersion: base.minimalVersion, ...written }),
	schedule: base.schedule,
	timeWindowsWritten: base.schedule?.length ?? 0
});

/** Windows written in the panel: each with its two times, or some left unwritten. */
type WrittenPairs = [string | undefined, string | undefined][];

/** §4.1: the task's data with the written schedule (no windows, no schedule); an invalid one is a rejection reason. */
function withScheduleWritten(data: Data, written: WrittenPairs): Data {
	if (written.length === 0) return { ...data, schedule: undefined, timeWindowsWritten: 0 };
	const read = readSchedule(written);
	const reasons = read.filter((l): l is string => typeof l === 'string');
	const withWritten = { ...data, timeWindowsWritten: written.length };
	return reasons.length > 0 ? { ...withWritten, reasons: [...data.reasons, ...reasons] } : { ...withWritten, schedule: read as TimeWindow[] };
}

const SCHEDULE_REASONS = ['incomplete schedule', 'end time not after start', 'overlapping schedules'];

/**
 * §4.1: a relative task in hours cannot have more than one window. If the schedule itself is also invalid, the spec
 * does not say which of the two errors is seen.
 */
function withIntervalOfSchedule(data: Data): Data {
	const r = data.recurrence;
	const inHours = data.kind === 'periodica' && r !== undefined && 'relative' in r && r.relative.unit === 'horas';
	if (!inHours || data.timeWindowsWritten <= 1) return data;
	if (data.reasons.some((reason) => SCHEDULE_REASONS.includes(reason))) return undecided('dos errores del horario');
	return { ...data, reasons: [...data.reasons, 'several schedules in an hourly relative'] };
}

function dataOf(text: string, title: string): Data {
	for (const [pattern, build] of DEFINITIONS) {
		const matches = pattern.exec(text);
		if (matches) return withValidation({ ...build(title, matches.slice(1)), timeWindowsWritten: 0 });
	}
	return undecided(`definición ${text}`);
}

/** The current values of a task, as the panel loads them when editing. */
function docData(d: Doc): Data {
	const fields = { title: d.title, emoji: d.emoji, note: d.note, firstStep: d.firstStep, steps: d.steps, minimalVersion: d.minimalVersion, schedule: d.schedule, timeWindowsWritten: d.schedule?.length ?? 0, reasons: [] };
	if (d.kind === 'puntual') return { ...fields, kind: 'puntual', limit: d.limit };
	return { ...fields, kind: 'periodica', recurrence: d.recurrence };
}

// ---- World ----

const copy = (g: Saved): Saved => ({ docs: [...g.docs], completions: [...g.completions] });

function only(g: Saved): Doc {
	return g.docs.length === 1 ? g.docs[0] : undecided('se esperaba una tarea');
}

function withTitle(g: Saved, title: string): Doc {
	const found = g.docs.filter((d) => d.title === title);
	return found.length === 1 ? found[0] : undecided(`tarea ${title}`);
}

/** The task with that title, even if it has already been deleted. */
function theOneThatHad(m: OracleWorld, title: string): Doc {
	const found = [...m.docs, ...m.deletedDocs].filter((d) => d.title === title);
	return found.length === 1 ? found[0] : undecided(`tarea ${title}`);
}

const allCompletions = (m: OracleWorld) => [...m.completions, ...m.deletedCompletions];

/** If I have not made any change yet, the other device saw everything stored. */
const thatSawOther = (m: OracleWorld): Saved => m.before ?? copy(m);
const completionsOf = (g: Saved, id: number) => g.completions.filter((c) => c.taskId === id);
/** §5.8, §6.2: a resumed recurring task is evaluated without the completions before reanudadaEn; a one-off ignores reanudadaEn. */
const activeOf = (g: Saved, d: Doc) =>
	completionsOf(g, d.id).filter((c) => d.kind === 'puntual' || d.resumed === undefined || c.at >= d.resumed);
/** §5.8: the task is evaluated as just created at reanudadaEn. */
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

// ---- Edit (§6.2) and conflicts (§7) ----

/** The task the document describes: the field that does not match the kind is ignored (§7). */
function derived(d: Doc): Doc {
	return d.kind === 'puntual' ? { ...d, recurrence: undefined, paused: undefined, resumed: undefined } : { ...d, limit: undefined };
}

/** The fields the edit writes: only those that changed; when the kind changes, both kind fields (§7). */
function changeOf(base: Doc, updated: Data): Record<string, unknown> {
	const change: Record<string, unknown> = {};
	if (base.title !== updated.title) change.title = updated.title;
	if (base.emoji !== updated.emoji) change.emoji = updated.emoji ?? null;
	if (base.note !== updated.note) change.note = updated.note ?? null;
	if (base.firstStep !== updated.firstStep) change.firstStep = updated.firstStep ?? null;
	// §7: `pasos` is a single field replaced whole, only if it changed; the edit never writes `pasoActual`.
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

/** Edit `base` (the task as seen by whoever edits) with the new data; the change lands on what is stored today. */
function edit(m: OracleWorld, base: Doc, data: Data, at?: number): void {
	const updated = withIntervalOfSchedule(data);
	if (updated.reasons.length > 0) {
		m.rejection = [...updated.reasons].sort().join(', ');
		return;
	}
	const change = changeOf(base, updated);
	// §5.8: changing a paused recurring task to one-off resumes it (removes the pause and stores reanudadaEn).
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

// ---- Delete (§6.2, §7) ----

function remove(m: OracleWorld, task: Doc, known: Completion[]): void {
	const ids = known.filter((c) => c.taskId === task.id).map((c) => c.id);
	m.deletedDocs = [...m.deletedDocs, ...m.docs.filter((d) => d.id === task.id)];
	m.docs = m.docs.filter((d) => d.id !== task.id);
	deleteCompletions(m, ids);
}

/** Deleting completions that no longer exist does nothing (§5.4). */
function deleteCompletions(m: OracleWorld, ids: number[]): void {
	m.deletedCompletions = [...m.deletedCompletions, ...m.completions.filter((c) => ids.includes(c.id))];
	m.completions = m.completions.filter((c) => !ids.includes(c.id));
}

// ---- Complete (§5.3) ----

/** The values without a time (§5.3, §5.6): the covered date or, without a covered occurrence, the day of completadoEn. */
function contributions(comps: Completion[]): Date[] {
	return comps.filter((c) => c.startCovered === undefined).map((c) => c.covered ?? dayStart(c.at));
}

/** §5.6: the covered occurrences with a time, by their start. */
const startsCovered = (comps: Completion[]) => comps.flatMap((c) => (c.startCovered === undefined ? [] : [c.startCovered]));

/** §5.6 and §5.7: N of a calendar task with a schedule or of a relative task per window. */
function nextWithSchedule(task: Doc, vs: TimeWindow[], own: Completion[]): Occurrence {
	const recurrence = task.recurrence ?? undecided('periódica sin recurrencia');
	const from = createdActive(task);
	const created = from === undefined ? undefined : new Date(from);
	const p = pWithSchedule(contributions(own), startsCovered(own), created) ?? undecided('sin P');
	if (!('relative' in recurrence)) return calendarNext(recurrence, vs, p, task.resumed) ?? undecided('sin ocurrencia');
	if (own.length === 0) return firstWithoutClose(vs, from ?? undecided('sin creación'));
	return nextByTimeWindow(vs, numeric(recurrence.relative.every), p);
}

/** Whether the task covers occurrences with a time (§5.6, §5.7): calendar with a schedule, or relative per window. */
function coversWithHour(task: Doc): TimeWindow[] | undefined {
	const { schedule, recurrence } = task;
	if (task.kind !== 'periodica' || !schedule || !recurrence) return undefined;
	return !('relative' in recurrence) || byTimeWindow(recurrence.relative.unit, schedule) ? schedule : undefined;
}

/** The occurrence a new completion covers: for calendar, a day (§5.3) or, with a time, a start (§5.6, §5.7). */
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
	// §4.4: the completion of a task with two or more steps stores the step it was on.
	const step = severalSteps(task) ? { step: stepInThatGoes(task) } : {};
	const completion = { id: m.next++, taskId: task.id, at, ...covered, ...step, ...(ident && { ident }), ...(minimal && { minimal }) };
	m.completions = [...m.completions, completion];
	return completion;
}

// ---- Steps (§4.1, Pasos) ----

/** The first step and the extra steps: the task's list of steps. */
const stepsOf = (d: Doc): string[] => [...(d.firstStep === undefined ? [] : [d.firstStep]), ...(d.steps ?? [])];

/** §4.1: two or more steps if it has a first step and at least one extra step. */
const severalSteps = (d: Doc) => stepsOf(d).length >= 2;

/** §4.1: the step the task is on: without the field, 1; if fewer steps remain than the number, the last. */
const stepInThatGoes = (d: Doc) => Math.min(d.currentStep ?? 1, Math.max(stepsOf(d).length, 1));

/** A step number is an integer from 1. */
const stepNumber = (value: string) => (/^[1-9]\d*$/.test(value) ? Number(value) : undecided(`paso ${value}`));

/** Writes the step the task is on; step 1 is without the field. */
function goOnStep(m: OracleWorld, id: number, step: number): void {
	m.docs = m.docs.map((d) => (d.id === id ? { ...d, currentStep: step === 1 ? undefined : step } : d));
}

/** I complete from this device: it is my change (the other device does not see it) and opens the notice (§5.4). */
function completeMe(m: OracleWorld, task: Doc, at: number, minimal = false): void {
	m.before = copy(m);
	m.updated = complete(m, task, m.completions, at, undefined, minimal);
	m.notice = { title: nameOf(task), completion: m.updated };
	// §4.1 (Pasos: Completar): completing, by the checkbox or by «Hecho», returns the task to step 1.
	goOnStep(m, task.id, 1);
}

/** Spec §4.1: «emoji título», or just the title without an emoji. */
const nameOf = (d: Doc) => (d.emoji === undefined ? d.title : `${d.emoji} ${d.title}`);

// ---- Undo (§5.4) ----

/** The completion of that moment, even if it was already deleted: there must be exactly one. */
function theCompletionOf(m: OracleWorld, at: number): Completion {
	const ofMoment = allCompletions(m).filter((c) => c.at === at);
	return ofMoment.length === 1 ? ofMoment[0] : undecided(`completados del momento ${at}`);
}

/**
 * Undo on the notice: deletes only the completion the notice names and closes it. The button exists while the notice
 * is visible (§5.4): outside that window there is nothing to tap and nothing happens.
 */
function tapUndo(m: OracleWorld, now: number): void {
	m.before = copy(m);
	if (!m.notice || !noticeSees(m.notice.completion.at, now)) return;
	undoCompletion(m, m.notice.completion.id);
	m.notice = undefined;
}

/**
 * Delete a completion from the notice, History or the checkbox (§5.4). If it was the most recent one of a task with two
 * or more steps and it stored its step, the task returns to that step, capped at the last one (§4.1, Pasos: Deshacer).
 */
function undoCompletion(m: OracleWorld, id: number): void {
	const completion = m.completions.find((c) => c.id === id);
	const task = m.docs.find((d) => d.id === completion?.taskId);
	if (completion?.step !== undefined && task && severalSteps(task) && theMoreRecent(completionsOf(m, task.id)) === completion) {
		goOnStep(m, task.id, Math.min(completion.step, stepsOf(task).length));
	}
	deleteCompletions(m, [id]);
}

/** What the notice shows at that moment: the task and the completion it offers to undo, or none. */
function queryNotice(m: OracleWorld, now: number): string {
	const visible = m.notice && noticeSees(m.notice.completion.at, now) ? m.notice : undefined;
	return visible ? JSON.stringify([visible.title, visible.completion.at]) : 'sin aviso';
}

/** §5.4: «Completaste «nombre»», with « · mínima» if the completion was the minimal one. */
function noticeText(m: OracleWorld, now: number): string {
	const visible = m.notice && noticeSees(m.notice.completion.at, now) ? m.notice : undefined;
	return visible ? `Completaste «${visible.title}»${visible.completion.minimal ? ' · mínima' : ''}` : 'sin aviso';
}

/** §5.4 and §6.1: the «Vuelve …» of the notice visible at the last queried moment; with no notice in view, 'sin aviso'. */
function noticeReturn(m: OracleWorld): string {
	const now = m.noticeIn ?? undecided('sin consulta del aviso');
	if (!m.notice || !noticeSees(m.notice.completion.at, now)) return 'sin aviso';
	const task = m.docs.find((d) => d.id === m.notice?.completion.taskId) ?? undecided('la tarea del aviso ya no existe');
	return returnOfNoticeOf(situationOf(m, derived(task), now), now) ?? undecided('regreso del aviso');
}

// ---- History (§6.3) ----

function queryHistory(m: OracleWorld, now: number): string {
	const entries = m.completions.flatMap((c): OracleEntry[] => {
		const task = m.docs.find((d) => d.id === c.taskId);
		return task ? [{ completedAt: c.at, id: c.ident, title: nameOf(task), minimal: c.minimal }] : [];
	});
	return historyText(entries, now) ?? undecided('empate sin desempate en el Historial');
}

/** §6.2: the last time of the only task, by the most recent completadoEn of its completions. */
function queryLastTime(m: OracleWorld, now: number): string {
	const task = only(m);
	return textOfLastTime(m.completions.filter((c) => c.taskId === task.id).map((c) => c.at), now);
}

// ---- State (§5) ----

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
		// §5.7: completions without a covered occurrence cover the whole day of their completadoEn.
		return { ...s, every: recurrence.relative.every, unit: recurrence.relative.unit, withoutCovered: contributions(own) };
	}
	return { ...s, calendar: recurrence, covered: contributions(own) };
}

/** Classification with progress; "no aparece en Pendientes" if the one-off is completed. */
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

// ---- The row's checkbox (§6.1) ----

/** §6.1: completed at that moment (one-off with completions, or waiting recurring task with completions). */
function completedAt(m: OracleWorld, task: Doc, at: number): boolean {
	if (task.paused) return false;
	const s = situationOf(m, task, at);
	const classification = classifySituation(s, { progress: false }) ?? undecided('estado');
	// §5.9: a postponed task is not completed.
	return isCompleted(task.kind === 'puntual', classification === 'en espera' && !inWaitByPostponement(s), activeOf(m, task).length > 0);
}

/** The completion with the greatest completadoEn; if two tie, the spec does not say which. */
function theMoreRecent(comps: Completion[]): Completion {
	const last = Math.max(...comps.map((c) => c.at));
	const lastOnes = comps.filter((c) => c.at === last);
	return lastOnes.length === 1 ? lastOnes[0] : undecided('completados más recientes empatados');
}

/** §5.5: completing outside the schedule's window is not possible: the checkbox is disabled and does nothing. */
function completeIfPossible(m: OracleWorld, task: Doc, at: number, minimal = false): void {
	if (!task.schedule || insideOfTimeWindow(task.schedule, at)) completeMe(m, task, at, minimal);
}

/**
 * §6.1: the non-completed one is completed. For the completed one, the most recent completion is deleted if it is a one-off or
 * if it is from today or later (local day of completadoEn); if it is from an earlier day, it is completed again. Deleting is
 * possible at any time; completing, only within the window (§5.5).
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

// ---- Steps ----

type Step = [RegExp, (m: OracleWorld, c: string[]) => void];

const CREATION_MOMENT = (c: string | undefined) => (c === undefined ? undefined : moment(c));
/** Tasks with a title that do not say when they were created: earlier than any other date of the scenario. */
const SCENARIO_BEFORE = 0;

const SHAPES = 'weekly|monthly';
const created = '(?: created on (\\S+))?';

/** An already stored schedule (not a change from this device); an invalid one is not decided (§4.1). */
function saveSchedule(task: Doc, hours: string[]): void {
	const data = withIntervalOfSchedule(withScheduleWritten(docData(task), writtenOf(hours)));
	task.schedule = data.reasons.length > 0 ? undecided(`horario ${hours.join(' ')}`) : data.schedule;
}

/** Leaves the task already stored with that list of steps: the first is the first step. */
function saveSteps(task: Doc, text: string): void {
	const { firstStep, steps } = stepsWritten(...(([first, ...more]) => [first, more] as const)(elements(text) ?? undecided(`pasos ${text}`)));
	task.firstStep = firstStep;
	task.steps = steps;
}

const CREATIONS: Step[] = [
	[new RegExp(`^the task can be completed ${SCHEDULE}$`), (m, hours) => saveSchedule(only(m), hours)],
	[new RegExp(`^the task (\\S+) can be completed ${SCHEDULE}$`), (m, [t, ...hours]) => saveSchedule(withTitle(m, t), hours)],
	[
		/^a one-off task with due date (\S+) created on (\S+)$/,
		(m, [l, c]) => create(m, dataOf(`one-off with due date ${l}`, 'Tarea'), moment(c))
	],
	[
		/^a one-off task without a due date with emoji (.*)$/,
		(m, [e]) => create(m, withWritten(dataOf('one-off without a due date', 'Tarea'), { emoji: e }), undefined)
	],
	[
		/^a one-off task (\S+) without a due date with emoji (.*)$/,
		(m, [t, e]) => create(m, withWritten(dataOf('one-off without a due date', t), { emoji: e }), SCENARIO_BEFORE)
	],
	[
		/^a one-off task without a due date with note (.*)$/,
		(m, [n]) => create(m, withWritten(dataOf('one-off without a due date', 'Tarea'), { note: n }), undefined)
	],
	// §4.1: an already stored first step (not a change from this device); it is stored trimmed.
	[/^the first step of the task is (.*)$/, (m, [p]) => void (only(m).firstStep = p.trim() || undefined)],
	[/^the first step of the task (\S+) is (.*)$/, (m, [t, p]) => void (withTitle(m, t).firstStep = p.trim() || undefined)],
	// §4.1 (Versión mínima): an already stored one (not a change from this device); it is stored trimmed.
	[/^the minimal version of the task is (.*)$/, (m, [v]) => void (only(m).minimalVersion = v.trim() || undefined)],
	[/^the minimal version of the task (\S+) is (.*)$/, (m, [t, v]) => void (withTitle(m, t).minimalVersion = v.trim() || undefined)],
	// §4.1 (Pasos): the already stored steps (not a change from this device), with the first step and the extra steps.
	[/^the steps of the task are (.*)$/, (m, [p]) => saveSteps(only(m), p)],
	[/^the steps of the task (\S+) are (.*)$/, (m, [t, p]) => saveSteps(withTitle(m, t), p)],
	[/^the current step of the task is (\S+)$/, (m, [p]) => void (only(m).currentStep = stepNumber(p) === 1 ? undefined : stepNumber(p))],
	[
		/^a one-off task (\S+) without a due date$/,
		(m, [t]) => create(m, dataOf('one-off without a due date', t), SCENARIO_BEFORE)
	],
	[
		/^I create a one-off task with title (.*), emoji (.*) and note (.*)$/,
		(m, [t, e, n]) => create(m, withWritten(dataOf('one-off without a due date', t), { emoji: e, note: n }), undefined)
	],
	[new RegExp(`^a one-off task without a due date${created}$`), (m, [c]) => create(m, dataOf('one-off without a due date', 'Tarea'), CREATION_MOMENT(c))],
	[/^a one-off task with due date (\S+)$/, (m, [l]) => create(m, dataOf(`one-off with due date ${l}`, 'Tarea'), undefined)],
	[
		/^a one-off task (\S+) with due date (\S+)$/,
		(m, [t, l]) => create(m, dataOf(`one-off with due date ${l}`, t), SCENARIO_BEFORE)
	],
	[
		new RegExp(`^a relative recurring task every (\\S+) (\\S+)${created}$`),
		(m, [n, u, c]) => create(m, dataOf(`relative recurring every ${n} ${u}`, 'Tarea'), CREATION_MOMENT(c))
	],
	[/^a relative recurring task never completed$/, (m) => create(m, dataOf('relative recurring every 1 horas', 'Tarea'), undefined)],
	[
		/^a relative recurring task (?!every )(\S+) every (\S+) (\S+)$/,
		(m, [t, n, u]) => create(m, dataOf(`relative recurring every ${n} ${u}`, t), SCENARIO_BEFORE)
	],
	[
		/^a relative recurring task (\S+) never completed created on (\S+)$/,
		(m, [t, c]) => create(m, dataOf('relative recurring every 1 horas', t), moment(c))
	],
	[
		new RegExp(`^a (weekly|monthly) recurring task (on|on days) (.*?)${created}$`),
		(m, [f, k, d, c]) => create(m, dataOf(`${f} recurring ${k} ${d}`, 'Tarea'), CREATION_MOMENT(c))
	],
	[
		new RegExp(`^a (${SHAPES}) recurring task (\\S+) (on|on days) (.*?)${created}$`),
		(m, [f, t, k, d, c]) =>
			create(m, dataOf(`${f} recurring ${k} ${d}`, t), CREATION_MOMENT(c) ?? SCENARIO_BEFORE)
	]
];

/** "the task has a completion ..." already stored: its moment is the start of the covered day if the step does not give it. */
function saveCompletion(m: OracleWorld, task: Doc, at: number, covered: Date): void {
	m.completions = [...m.completions, { id: m.next++, taskId: task.id, at, covered }];
}

/** §4.4: a covered occurrence is a date (without a time) or, with a time, the start of an occurrence. */
function saveCompletionOf(m: OracleWorld, task: Doc, at: number, covered: string): void {
	const start = date(covered);
	if (start === undefined) return saveCompletion(m, task, at, dayOf(covered));
	m.completions = [...m.completions, { id: m.next++, taskId: task.id, at, startCovered: start }];
}

const COMPLETIONS: Step[] = [
	// §4.4: an already stored minimal-version completion (without a notice and without touching the step the task is on).
	[
		/^the task was completed on (\S+) at step (\S+) with the minimal one$/,
		(m, [t, step]) => {
			const completion = complete(m, only(m), m.completions, moment(t), undefined, true);
			completion.step = stepNumber(step);
		}
	],
	[/^the task was completed on (\S+) with the minimal one$/, (m, [t]) => void complete(m, only(m), m.completions, moment(t), undefined, true)],
	[/^the task (\S+) was completed on (\S+) with the minimal one$/, (m, [t, e]) => void complete(m, withTitle(m, t), m.completions, moment(e), undefined, true)],
	// §4.4: a completion that stores the step the task was on, without touching the step it is on today.
	[
		/^the task was completed on (\S+) at step (\S+)$/,
		(m, [t, step]) => void (complete(m, only(m), m.completions, moment(t)).step = stepNumber(step))
	],
	[/^the task was completed on (\S+)$/, (m, [t]) => void complete(m, only(m), m.completions, moment(t))],
	[/^the task (\S+) was completed on (\S+)$/, (m, [t, e]) => void complete(m, withTitle(m, t), m.completions, moment(e))],
	[/^I complete the task on (\S+)$/, (m, [e]) => completeMe(m, only(m), moment(e))],
	[/^I complete the task (\S+) on (\S+)$/, (m, [t, e]) => completeMe(m, withTitle(m, t), moment(e))],
	[
		/^the task (\S+) was completed on (\S+) with id (\S+)$/,
		(m, [t, e, id]) => void complete(m, withTitle(m, t), m.completions, moment(e), id)
	],
	[
		/^the task has a completion from (\S+) that covers (\S+)$/,
		(m, [e, c]) => saveCompletionOf(m, only(m), moment(e), c)
	],
	[
		/^the task has a completion that covers (\S+)$/,
		(m, [c]) => saveCompletion(m, only(m), dayOf(c).getTime(), dayOf(c))
	],
	[
		/^the task (\S+) has a completion that covers (\S+)$/,
		(m, [t, c]) => saveCompletion(m, withTitle(m, t), dayOf(c).getTime(), dayOf(c))
	]
];

const OTHER = 'another device, without seeing that change,';

const ONLY_SPACES = '   ';

/** Note changes (§4.1, §6.2): what is written in the panel, with the rest of the task as it is. */
const NOTE_CHANGES: [string, (c: string[]) => WrittenData][] = [
	['the note to (.*) with spaces at the start and end', ([n]) => ({ note: `  \n ${n} \n  ` })],
	['the note to (.*) and (.*) on separate lines', ([a, b]) => ({ note: `${a}\n${b}` })],
	['the note to one of only spaces', () => ({ note: ONLY_SPACES })],
	['the note to one of (\\S+) characters', ([l]) => ({ note: 'x'.repeat(numeric(l)) })],
	['the note to (.*)', ([n]) => ({ note: n })]
];

/** First step changes (§4.1, §6.2): what is written in the field; removing it is emptying it. */
const CHANGES_OF_FIRST_STEP: [string, (c: string[]) => WrittenData][] = [
	['the first step to (.*) with spaces at the start and end', ([p]) => ({ firstStep: `  ${p}  ` })],
	['the first step to one of only spaces', () => ({ firstStep: ONLY_SPACES })],
	['the first step to one of (\\S+) characters', ([l]) => ({ firstStep: 'x'.repeat(numeric(l)) })],
	['the first step to (.*)', ([p]) => ({ firstStep: p })]
];

const editsOfFirstStep = (): Step[] => [
	...CHANGES_OF_FIRST_STEP.flatMap(([text, written]): Step[] => [
		[new RegExp(`^I edit ${text}$`), (m, c) => editMe(m, undefined, (base) => keeping(base, docData(base), written(c)))],
		[new RegExp(`^${OTHER} edits ${text}$`), (m, c) => editsOther(m, (base) => keeping(base, docData(base), written(c)))]
	]),
	[/^I remove the first step$/, (m) => editMe(m, undefined, (base) => keeping(base, docData(base), { firstStep: '' }))],
	[new RegExp(`^${OTHER} removes the first step$`), (m) => editsOther(m, (base) => keeping(base, docData(base), { firstStep: '' }))]
];

/** Minimal version changes (§4.1, §6.2): what is written in the field; removing it is emptying it. */
const CHANGES_OF_MINIMAL_VERSION: [string, (c: string[]) => WrittenData][] = [
	['the minimal version to (.*) with spaces at the start and end', ([v]) => ({ minimalVersion: `  ${v}  ` })],
	['the minimal version to one of only spaces', () => ({ minimalVersion: ONLY_SPACES })],
	['the minimal version to one of (\\S+) characters', ([l]) => ({ minimalVersion: 'x'.repeat(numeric(l)) })],
	['the minimal version to (.*)', ([v]) => ({ minimalVersion: v })]
];

const editsOfMinimalVersion = (): Step[] => [
	...CHANGES_OF_MINIMAL_VERSION.flatMap(([text, written]): Step[] => [
		[new RegExp(`^I edit ${text}$`), (m, c) => editMe(m, undefined, (base) => keeping(base, docData(base), written(c)))],
		[new RegExp(`^${OTHER} edits ${text}$`), (m, c) => editsOther(m, (base) => keeping(base, docData(base), written(c)))]
	]),
	[/^I remove the minimal version$/, (m) => editMe(m, undefined, (base) => keeping(base, docData(base), { minimalVersion: '' }))],
	[new RegExp(`^${OTHER} removes the minimal version$`), (m) => editsOther(m, (base) => keeping(base, docData(base), { minimalVersion: '' }))]
];

/** Changes to a step (§4.1, Pasos): what is written in its field; emptying it drops it and those below move up. */
const STEP_CHANGES: [string, (c: string[]) => string][] = [
	['(.*) with spaces at the start and end', ([p]) => `  ${p}  `],
	['one of only spaces', () => ONLY_SPACES],
	['one of (\\S+) characters', ([l]) => 'x'.repeat(numeric(l))],
	['(.*)', ([p]) => p]
];

/** The task's steps with step `n` written; one more than the count appends it at the end. */
function withStep(base: Doc, n: string, text: string): WrittenData {
	const list = stepsOf(base);
	const place = numeric(n);
	if (!Number.isInteger(place) || place < 1 || place > list.length + 1) undecided(`paso ${n}`);
	const fresh = place === list.length + 1 ? [...list, text] : list.map((step, i) => (i === place - 1 ? text : step));
	return { firstStep: fresh[0], steps: fresh.slice(1) };
}

const stepsEdits = (): Step[] => [
	...STEP_CHANGES.flatMap(([text, written]): Step[] => [
		[new RegExp(`^I edit step (\\S+) to ${text}$`), (m, [n, ...c]) => editMe(m, undefined, (base) => keeping(base, docData(base), withStep(base, n, written(c))))],
		[new RegExp(`^${OTHER} edits step (\\S+) to ${text}$`), (m, [n, ...c]) => editsOther(m, (base) => keeping(base, docData(base), withStep(base, n, written(c))))]
	]),
	[/^I clear step (\S+)$/, (m, [n]) => editMe(m, undefined, (base) => keeping(base, docData(base), withStep(base, n, '')))],
	[
		/^I edit the task with (\S+) steps$/,
		(m, [count]) => {
			const steps = Array.from({ length: numeric(count) }, (_, i) => `Paso ${i + 1}`);
			editMe(m, undefined, (base) => keeping(base, docData(base), { firstStep: steps[0], steps: steps.slice(1) }));
		}
	]
];

/** §4.1 (Pasos: Avance) and §6.1: «Hecho» moves to the next step; on the last one it completes the task like the checkbox. */
function tapDone(m: OracleWorld, task: Doc, at: number): void {
	m.touchedAt ??= at;
	const d = derived(task);
	if (!severalSteps(d) || !seesLine(rowStatus(m, d, at))) undecided('«Hecho» no se ve');
	const step = stepInThatGoes(d);
	if (step === stepsOf(d).length) return completeIfPossible(m, d, at);
	m.before = copy(m);
	goOnStep(m, d.id, step + 1);
}

/** The other device decides with the task it saw, and its change lands on what is stored today (§7). */
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
 * §6.1: «Hice la mínima» is on the pending and overdue rows with a minimal version; it completes like the checkbox, with the
 * minimal-version completion, and when disabled (outside the window, §5.5) it does nothing.
 */
function tapMinimal(m: OracleWorld, task: Doc, at: number): void {
	m.touchedAt ??= at;
	const d = derived(task);
	if (d.minimalVersion === undefined || !seesLine(rowStatus(m, d, at))) undecided('«Hice la mínima» no se ve');
	completeIfPossible(m, d, at, true);
}

/** The other device decides with the task it saw, and its completion lands on what is stored today (§7). */
function dueMinimalOther(m: OracleWorld, at: number): void {
	const seen = thatSawOther(m);
	const d = derived(only(seen));
	if (d.minimalVersion === undefined || !seesLine(rowStatus(seen, d, at))) undecided('«Hice la mínima» no se ve');
	if (d.schedule && !insideOfTimeWindow(d.schedule, at)) return;
	complete(m, d, seen.completions, at, undefined, true);
	goOnStep(m, d.id, 1);
}

const ROW_STEPS: Step[] = [
	[/^I tap Hice la mínima on (\S+)$/, (m, [e]) => tapMinimal(m, only(m), moment(e))],
	[/^I tap Hice la mínima in the task (\S+) on (\S+)$/, (m, [t, e]) => tapMinimal(m, withTitle(m, t), moment(e))],
	[new RegExp(`^${OTHER} taps Hice la mínima on (\\S+)$`), (m, [e]) => dueMinimalOther(m, moment(e))],
	[/^I tap Hecho on (\S+)$/, (m, [e]) => tapDone(m, only(m), moment(e))],
	[/^I tap Hecho in the task (\S+) on (\S+)$/, (m, [t, e]) => tapDone(m, withTitle(m, t), moment(e))],
	[
		/^I tap Paso anterior$/,
		(m) => {
			const d = derived(only(m));
			if (!severalSteps(d)) undecided('«Paso anterior» no se ve');
			m.before = copy(m);
			goOnStep(m, d.id, Math.max(1, stepInThatGoes(d) - 1));
		}
	],
	[new RegExp(`^${OTHER} taps Hecho on (\\S+)$`), (m, [e]) => dueDoneOther(m, moment(e))]
];

/** Choosing an emoji in the picker or removing it (§6.2): whoever edits chooses or removes; removing is leaving the field empty. */
const EMOJI_CHANGES: [RegExp, string, (c: string[]) => WrittenData][] = [
	[/^I choose the emoji (.*) and edit the note to (.*)$/, 'me', ([e, n]) => ({ emoji: e, note: n })],
	[/^I choose the emoji (.*)$/, 'me', ([e]) => ({ emoji: e })],
	[/^I remove the emoji$/, 'me', () => ({ emoji: '' })],
	[new RegExp(`^${OTHER} chooses the emoji (.*)$`), 'other', ([e]) => ({ emoji: e })]
];

function editsOfEmojiAndNote(): Step[] {
	const ofNote = NOTE_CHANGES.flatMap(([text, written]): Step[] => [
		[
			new RegExp(`^I edit ${text}$`),
			(m, c) => editMe(m, undefined, (base) => keeping(base, docData(base), written(c)))
		],
		[
			new RegExp(`^${OTHER} edits ${text}$`),
			(m, c) => editsOther(m, (base) => keeping(base, docData(base), written(c)))
		]
	]);
	const ofEmoji = EMOJI_CHANGES.map(([pattern, who, written]): Step => [
		pattern,
		(m, c) =>
			who === 'me'
				? editMe(m, undefined, (base) => keeping(base, docData(base), written(c)))
				: editsOther(m, (base) => keeping(base, docData(base), written(c)))
	]);
	return [...ofNote, ...ofEmoji];
}

/** Changing the schedule (§6.2): whoever edits writes one or more windows, none (removes it) or one with a single time. */
const withSchedule = (written: WrittenPairs) => (base: Doc) => withScheduleWritten(docData(base), written);

const SCHEDULE_EDITS: Step[] = [
	[new RegExp(`^I set the schedule ${SCHEDULE}$`), (m, hours) => editMe(m, undefined, withSchedule(writtenOf(hours)))],
	[/^I remove the schedule$/, (m) => editMe(m, undefined, withSchedule([]))],
	[/^I set a schedule with only the start time (\S+)$/, (m, [d]) => editMe(m, undefined, withSchedule([[d, undefined]]))],
	[new RegExp(`^${OTHER} sets the schedule ${SCHEDULE}$`), (m, hours) => editsOther(m, withSchedule(writtenOf(hours)))],
	[new RegExp(`^${OTHER} removes the schedule$`), (m) => editsOther(m, withSchedule([]))],
	[
		new RegExp(`^in a single edit I edit the title to (.+) and the schedule ${SCHEDULE}$`),
		(m, [t, ...hours]) => editMe(m, undefined, (base) => withValidation({ ...withSchedule(writtenOf(hours))(base), title: t }))
	]
];

const EDITS: Step[] = [
	...SCHEDULE_EDITS,
	// §5.8: changing a paused recurring task to one-off resumes it at that moment.
	[
		/^I edit the task to one-off without a due date on (\S+)$/,
		(m, [e]) => editMe(m, undefined, (base) => keeping(base, dataOf('one-off without a due date', base.title)), moment(e))
	],
	[
		/^I edit the task to (.*)$/,
		(m, [def]) => editMe(m, undefined, (base) => keeping(base, dataOf(def, base.title)))
	],
	[
		/^I edit the task (\S+) to (.*)$/,
		(m, [t, def]) => editMe(m, t, (base) => keeping(base, dataOf(def, base.title)))
	],
	[new RegExp(`^${OTHER} edits the task to (.*)$`), (m, [def]) => editsOther(m, (base) => keeping(base, dataOf(def, base.title)))],
	[
		/^I edit the title to one of only spaces$/,
		(m) => editMe(m, undefined, (base) => withValidation({ ...docData(base), title: '   ' }))
	],
	[
		/^I edit the title to (.*)$/,
		(m, [t]) => editMe(m, undefined, (base) => withValidation({ ...docData(base), title: t }))
	],
	[
		new RegExp(`^${OTHER} edits the title to (.*)$`),
		(m, [t]) => editsOther(m, (base) => withValidation({ ...docData(base), title: t }))
	],
	[
		/^in a single edit I edit the title to (.+) and the due date to (\S+)$/,
		(m, [t, l]) => editMe(m, undefined, (base) => keeping(base, withValidation(dataOf(`one-off with due date ${l}`, t))))
	],
	[new RegExp(`^${OTHER} saves the task without changes$`), (m) => editsOther(m, docData)],
	...editsOfEmojiAndNote(),
	...editsOfFirstStep(),
	...editsOfMinimalVersion(),
	...stepsEdits(),
	...ROW_STEPS
];

/** Pause and resume (§5.8, §6.2): the panel button acts at the moment; only recurring tasks are paused. */
function pause(m: OracleWorld, d: Doc): void {
	if (d.kind !== 'periodica') undecided('la tarea no se puede pausar');
	m.docs = m.docs.map((x) => (x.id === d.id ? { ...x, paused: true } : x));
}

function resume(m: OracleWorld, d: Doc, at: number): void {
	if (!d.paused) undecided('la tarea no está pausada');
	m.docs = m.docs.map((x) => (x.id === d.id ? { ...x, paused: undefined, resumed: at } : x));
}

/**
 * §5.9 and §6.2: Posponer only acts if the panel, with what the person postponing sees, offers it at that moment. The change
 * writes only `pospuesta`, whole (§7), and lands on what is stored today.
 */
function postpone(m: OracleWorld, view: Saved, option: string, value: string): void {
	const postponed = postponementOf(option, value) ?? undecided('opción de posponer');
	const d = derived(only(view));
	if (postponeButton({ ...situationOf(view, d, postponed.from), paused: d.paused }) !== 'Posponer') undecided('el panel no ofrece Posponer');
	m.docs = m.docs.map((x) => (x.id === d.id ? { ...x, postponed } : x));
}

const POSTPONEMENTS: Step[] = [
	[/^the task was postponed with option (.+) on (\S+)$/, (m, [o, e]) => postpone(m, m, o, e)],
	[
		/^I postpone the task with option (.+) on (\S+)$/,
		(m, [o, e]) => {
			m.before = copy(m);
			postpone(m, m, o, e);
		}
	],
	[new RegExp(`^${OTHER} postpones the task with option (.+) on (\\S+)$`), (m, [o, e]) => postpone(m, thatSawOther(m), o, e)]
];

const PAUSES: Step[] = [
	[/^the task was paused$/, (m) => pause(m, derived(only(m)))],
	[/^the task (\S+) was paused$/, (m, [t]) => pause(m, derived(withTitle(m, t)))],
	[
		/^I pause the task$/,
		(m) => {
			m.before = copy(m);
			pause(m, derived(only(m)));
		}
	],
	// §7: pausing writes only `pausada`; it lands on what is stored today even if the other device has not seen the resume.
	[new RegExp(`^${OTHER} pauses the task$`), (m) => pause(m, derived(only(m)))],
	[
		/^I resume the task on (\S+)$/,
		(m, [e]) => {
			m.before = copy(m);
			resume(m, derived(only(m)), moment(e));
		}
	],
	[
		/^I resume the task (\S+) on (\S+)$/,
		(m, [t, e]) => {
			m.before = copy(m);
			resume(m, derived(withTitle(m, t)), moment(e));
		}
	]
];

const DELETED: Step[] = [
	[
		/^I delete the task$/,
		(m) => {
			m.before = copy(m);
			remove(m, only(m), m.completions);
		}
	],
	[
		/^I delete the task (\S+)$/,
		(m, [t]) => {
			m.before = copy(m);
			remove(m, withTitle(m, t), m.completions);
		}
	],
	[
		new RegExp(`^${OTHER} deletes the task$`),
		(m) => {
			const seen = thatSawOther(m);
			remove(m, only(seen), seen.completions);
		}
	],
	[
		new RegExp(`^${OTHER} completes the task (\\S+) on (\\S+)$`),
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
		/^I delete the completion from (\S+)$/,
		(m, [e]) => {
			m.before = copy(m);
			undoCompletion(m, theCompletionOf(m, moment(e)).id);
		}
	],
	[new RegExp(`^${OTHER} deletes the completion from (\\S+)$`), (m, [e]) => undoCompletion(m, theCompletionOf(m, moment(e)).id)],
	[/^I tap Deshacer in the notice on (\S+)$/, (m, [e]) => tapUndo(m, moment(e))],
	[/^I tap the task checkbox on (\S+)$/, (m, [e]) => tapCheckbox(m, moment(e))]
];

/** The list order is sometimes not decided: it only matters if a Then looks at it; the steps row does not need it. */
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
		/^I query the notice on (\S+)$/,
		(m, [t]) => {
			m.noticeSeen = queryNotice(m, moment(t));
			m.noticeText = noticeText(m, moment(t));
			m.noticeIn = moment(t);
		}
	],
	[/^I query the Historial on (\S+)$/, (m, [t]) => void (m.history = queryHistory(m, moment(t)))],
	[/^I query the last time on (\S+)$/, (m, [t]) => void (m.lastTime = queryLastTime(m, moment(t)))],
	[
		/^I query the status on (\S+)$/,
		(m, [t]) => {
			m.queriedAt = moment(t);
			m.status = classify(m, m.queriedAt);
		}
	],
	[/^I query the status at any moment$/, (m) => void (m.status = classify(m, undefined))],
	[/^I query Pendientes on (\S+)$/, (m, [t]) => queryPending(m, moment(t))],
	[/^I query Pendientes at any moment$/, (m) => queryPending(m, undefined)],
	[new RegExp(`^${SHOW_COMPLETED}$`), (m) => void (m.showCompleted = true)],
	// §6.1: paused tasks are shown with this check; the step line is not shown on them.
	[/^Mostrar pausadas is on$/, () => undefined]
];

const STEPS: Step[] = [...CREATIONS, ...COMPLETIONS, ...PAUSES, ...POSTPONEMENTS, ...EDITS, ...DELETED, ...UNDOS, ...QUERIES];

// ---- What each Then observes ----

const statusQueried = (m: OracleWorld) => m.status ?? (m.touchedAt === undefined ? undecided('sin consulta de estado') : classify(m, m.touchedAt));
const statusKind = (classification: string) => (classification.startsWith('en espera') ? 'en espera' : classification);
const day_ = (d: Date | undefined) => (d === undefined ? '-' : isoDay(d));

/** §4.4: the covered occurrence, with a time if it has one (different formats). */
const coveredInText = (c: Completion) => (c.startCovered === undefined ? day_(c.covered) : `inicio ${c.startCovered}`);
const theTask = (m: OracleWorld) => derived(only(m));
const theOneThatHadBefore = theOneThatHad;
/** §6.1: the queried task is completed (one-off with completions, or waiting recurring task with completions). */
const completedQueried = (m: OracleWorld) =>
	!isPaused(m) && isCompleted(theTask(m).kind === 'puntual', statusKind(statusQueried(m)) === 'en espera' && !postponedQueried(m), activeOf(m, only(m)).length > 0);
/** §5.9: waiting because of the postponement at the queried moment: it is not completed. */
const postponedQueried = (m: OracleWorld) => {
	const at = m.queriedAt ?? m.touchedAt;
	return at !== undefined && inWaitByPostponement(situationOf(m, only(m), at));
};
const postponementKey = (p: Postponement | undefined) => (p ? `${p.from} ${p.to}` : '-');
/** §5.8: a paused task has no state, is not completed and its checkbox is disabled. */
const isPaused = (m: OracleWorld) => theTask(m).paused === true;
const fresh = (m: OracleWorld) => m.updated ?? undecided('no se completó');
/** What remains of the task: whether each completion is from the moment the step names, and whether it covers an occurrence. */
const onlyCompletionOf = (m: OracleWorld, d: Doc, named: string) =>
	JSON.stringify(completionsOf(m, d.id).map((c) => [c.at === moment(named), c.covered !== undefined || c.startCovered !== undefined]));

/** §6.1: the task's row at that moment (or any): paused, waiting because of the postponement, or the state of §5. */
function rowStatus(m: Saved, task: Doc, at: number | undefined): string {
	if (task.kind === 'periodica' && task.paused) return 'pausada';
	if (at === undefined && task.postponed) undecided('posposición en cualquier momento');
	const s = situationOf(m, task, at);
	return at !== undefined && inWaitByPostponement(s) ? 'en espera' : (classifySituation(s, { progress: false }) ?? undecided('estado'));
}

/** §6.1: the step line (and its buttons) is only shown on pending and overdue rows; not on `en espera` or paused ones. */
const seesLine = (status: string) => status === 'pendiente' || status === 'atrasada';

/** What the row shows of the steps in the last Pending query (§6.1). */
interface StepsRow {
	line: string;
	buttons: string;
	/** Whether «Hecho» is enabled; only decided when a Then looks at it (the checkbox may be undecided). */
	done: () => string;
}

const WITHOUT_BUTTONS = 'sin botones';

/**
 * §6.1: the line of the step the task is on, «Primer paso: …» on step 1 and «Paso: …» on another; with two steps or more,
 * «Paso anterior» (not on step 1) and «Hecho», enabled except on the last step if the checkbox is disabled.
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
	return { line, buttons: step > 1 ? 'Paso anterior y Hecho' : 'Hecho', done: () => (step < steps.length ? 'enabled' : checkbox()) };
}

/**
 * §6.1: the minimal-version line and its button: shown only on pending and overdue rows with a minimal version; the button
 * is enabled like the checkbox that would complete (§5.5).
 */
function theRowOfMinimal(m: OracleWorld): { line: string; button: () => string } {
	if (!m.queryPending) undecided('sin consulta de Pendientes');
	const task = only(m);
	if (task.minimalVersion === undefined || !seesLine(rowStatus(m, task, m.pendingAt))) return { line: 'sin mínima', button: () => 'sin mínima' };
	const checkbox = () => classifySituation(situationOf(m, task, m.pendingAt), { progress: false, checkbox: true, onlyCheckbox: true })?.replace('checkbox ', '') ?? undecided('checkbox');
	return { line: `Mínima: ${task.minimalVersion}`, button: checkbox };
}

const OF_ROW_OF_STEPS = /^(?:the task row (?:shows the step |shows the buttons |shows no step buttons$|shows no first step$|shows the minimal one |shows no minimal one$)|the Hecho button of the task is |the Hice la mínima button of the task is |the task checkbox is )/;

type Observation = [RegExp, (m: OracleWorld, c: string[]) => string];

const OBSERVATIONS: Observation[] = [
	[/^the status is (?:pendiente|en espera|atrasada)$/, (m) => statusKind(statusQueried(m))],
	[/^the progress is (\S+)$/, (m) => statusQueried(m)],
	// With Mostrar completadas off, completed tasks have no row (§6.1).
	[/^the task does not appear in Pendientes$/, (m) => String(!m.showCompleted && completedQueried(m))],
	[/^the task is completed$/, (m) => String(completedQueried(m))],
	[/^the task is not completed$/, (m) => String(!completedQueried(m))],
	[/^the task is paused$/, (m) => String(isPaused(m))],
	[/^the task is not paused$/, (m) => String(!isPaused(m))],
	[/^the task has no status$/, (m) => String(isPaused(m))],
	[/^the task is postponed from (\S+) to (\S+)$/, (m) => postponementKey(only(m).postponed)],
	[/^the task is not postponed$/, (m) => String(only(m).postponed === undefined)],
	[/^the task has (?:a completion|two completions)$/, (m) => String(completionsOf(m, only(m).id).length)],
	[/^the new completion is added without changing the previous ones$/, (m) => String(m.updated !== undefined)],
	[/^a completion without a covered occurrence was recorded$/, (m) => String(fresh(m).covered === undefined && fresh(m).startCovered === undefined)],
	[/^the recorded completion is from (\S+)$/, (m) => String(fresh(m).at)],
	[/^Pendientes shows in order (.*)$/, (m) => m.order ?? undecided('sin consulta of Pendientes')],
	[/^the task has title (.+)$/, (m) => theTask(m).title],
	[/^the task is (?:one-off|recurring)$/, (m) => theTask(m).kind],
	[/^its due date is (\S+)$/, (m) => (theTask(m).kind === 'puntual' ? day_(theTask(m).limit) : undecided('no is one-off'))],
	[/^the task has no due date$/, (m) => String(only(m).limit === undefined)],
	[/^the task has emoji (.*)$/, (m) => only(m).emoji ?? '-'],
	[/^the task has no emoji$/, (m) => String(only(m).emoji === undefined)],
	[/^the task has note (.*)$/, (m) => only(m).note ?? '-'],
	[/^the task has no note$/, (m) => String(only(m).note === undefined)],
	[/^the task has first step (.*)$/, (m) => only(m).firstStep ?? '-'],
	[/^the task row (?:shows the first step .*|shows the step .*|shows no first step)$/, (m) => theRowOfSteps(m).line],
	[/^the task row (?:shows the buttons .*|shows no step buttons)$/, (m) => theRowOfSteps(m).buttons],
	[/^the Hecho button of the task is (?:habilitado|deshabilitado)$/, (m) => theRowOfSteps(m).done()],
	[
		/^the task checkbox is (?:enabled|disabled)$/,
		(m) => {
			const at = m.pendingAt ?? m.queriedAt ?? m.touchedAt ?? undecided('sin momento');
			return classifySituation(situationOf(m, derived(only(m)), at), { progress: false, checkbox: true, onlyCheckbox: true }) ?? undecided('checkbox');
		}
	],
	[/^the task is on step (\S+)$/, (m) => String(stepInThatGoes(derived(only(m))))],
	[/^the task has the steps (.*)$/, (m) => stepsOf(only(m)).join(', ')],
	[/^the task has no more steps$/, (m) => String(only(m).steps === undefined)],
	[/^the task has (\S+) steps$/, (m) => String(stepsOf(only(m)).length)],
	[/^step (\S+) of the task has (\S+) characters$/, (m, [n]) => String(stepsOf(only(m))[stepNumber(n) - 1]?.length)],
	[/^the last completion of the task saves step (\S+)$/, (m) => String(theMoreRecent(completionsOf(m, only(m).id)).step)],
	[/^the last completion of the task saves no step$/, (m) => String(theMoreRecent(completionsOf(m, only(m).id)).step === undefined)],
	[/^the task has no first step$/, (m) => String(only(m).firstStep === undefined)],
	[/^the task has minimal version (.*)$/, (m) => only(m).minimalVersion ?? '-'],
	[/^the task has no minimal version$/, (m) => String(only(m).minimalVersion === undefined)],
	[/^the task has a minimal version of (\S+) characters$/, (m) => String(only(m).minimalVersion?.length)],
	[/^the task row (?:shows the minimal one .*|shows no minimal one)$/, (m) => theRowOfMinimal(m).line],
	[/^the Hice la mínima button of the task is (?:enabled|disabled)$/, (m) => theRowOfMinimal(m).button()],
	[/^the last completion of the task was (?:the minimal one|whole)$/, (m) => String(theMoreRecent(completionsOf(m, only(m).id)).minimal === true)],
	[/^the task has two completions, one whole and one minimal$/, (m) => JSON.stringify(completionsOf(m, only(m).id).map((c) => c.minimal === true).sort())],
	[/^the completion notice says (.*)$/, (m) => m.noticeText ?? undecided('sin consulta del aviso')],
	[/^the task has a first step of (\S+) characters$/, (m) => String(only(m).firstStep?.length)],
	[/^the task note has two lines: .*$/, (m) => JSON.stringify(only(m).note?.split('\n'))],
	[/^the task has a note of (\S+) characters$/, (m) => String(only(m).note?.length)],
	[/^the task name is .*$/, (m) => nameOf(only(m))],
	[/^the task has no recurrence$/, (m) => String(only(m).recurrence === undefined)],
	[
		/^its recurrence is (?:relative every|weekly on|monthly on days) .*$/,
		(m) => (theTask(m).kind === 'periodica' ? recurrenceKey(theTask(m).recurrence) : undecided('not recurring'))
	],
	[/^the task is still created on (\S+)$/, (m) => String(only(m).created)],
	[/^the task keeps its id$/, (m) => String(only(m).id === only(thatSawOther(m)).id)],
	[/^the task keeps a single completion, from (\S+)$/, (m, [e]) => onlyCompletionOf(m, only(m), e)],
	[/^the task (\S+) keeps a single completion, from (\S+)$/, (m, [t, e]) => onlyCompletionOf(m, withTitle(m, t), e)],
	[/^the completion notice (?:shows the return .*|shows no return)$/, (m) => noticeReturn(m)],
	[/^the task has no completions$/, (m) => String(completionsOf(m, only(m).id).length === 0)],
	[/^the notice offers to undo the completion of (\S+) from (\S+)$/, (m) => m.noticeSeen ?? undecided('sin consulta del aviso')],
	[/^there is no notice$/, (m) => String((m.noticeSeen ?? undecided('sin consulta del aviso')) === 'sin aviso')],
	[/^the Historial shows (.*)$/, (m) => m.history ?? undecided('sin consulta from Historial')],
	[/^the last time shows (.*)$/, (m) => m.lastTime ?? undecided('sin consulta de la última vez')],
	[/^the Historial is empty$/, (m) => String((m.history ?? undecided('sin consulta from Historial')) === '')],
	[/^editing is rejected for .*$/, (m) => m.rejection ?? undecided('no hubo rechazo')],
	[/^editing is rejected because the end time is not after the start time$/, (m) => m.rejection ?? undecided('no hubo rechazo')],
	[new RegExp(`^the task has schedule ${SCHEDULE}$`), (m) => scheduleKey(only(m).schedule)],
	[/^the task has no schedule$/, (m) => String(only(m).schedule === undefined)],
	[
		/^the task does not change$/,
		(m) => String(JSON.stringify(m.docs.map(docKey)) === JSON.stringify(thatSawOther(m).docs.map(docKey)))
	],
	[
		/^there is no task (\S+)$/,
		(m, [t]) => {
			const id = theOneThatHadBefore(m, t).id;
			return String(!m.docs.some((d) => d.id === id) && !m.docs.some((d) => d.title === t));
		}
	],
	[/^no completion remains of (\S+)$/, (m, [t]) => String(completionsOf(m, theOneThatHadBefore(m, t).id).length === 0)],
	[/^no task remains$/, (m) => String(m.docs.length === 0)],
	[
		/^the orphan completions to clean are only the one of (\S+) from (\S+)$/,
		(m, [t]) => {
			const orphaned = m.completions.filter((c) => !m.docs.some((d) => d.id === c.taskId));
			return JSON.stringify([theOneThatHadBefore(m, t).id, orphaned.map((c) => [c.taskId, c.at])]);
		}
	],
	[
		/^a completion was recorded that covers (\S+)$/,
		// That the completion lands at the completion moment is an invariant; what varies is the occurrence it covers.
		(m) => (m.updated ? coveredInText(m.updated) : undecided('no se completó'))
	]
];

/** This oracle's own steps: scenarios that edit, delete or concurrently modify. */
const IS_OF_EDITING =
	/^(?:I edit |in a single edit I edit |I clear step |the steps of the task |the current step of the task is |I tap Hecho |I tap Paso anterior$|the task row (?:shows the buttons |shows no step buttons$)|the Hecho button of the task is |I choose |I remove the emoji$|I remove the schedule$|I remove the first step$|the first step of the task |the minimal version of the task |I remove the minimal version$|I tap Hice la mínima |the task row (?:shows the minimal one |shows no minimal one$)|the Hice la mínima button |I set |I delete |I tap Deshacer |I tap the task checkbox |I query the notice |I query the Historial |I query the last time |another device, without seeing that change,)/;

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
	// Without a decided order, only the Thens of the steps row can be observed.
	if (m.orderUndecided && !texts.every((text) => OF_ROW_OF_STEPS.test(text))) undecided('orden de Pendientes');
	return texts.map((text) => {
		const rule = OBSERVATIONS.map(([pattern, view]) => ({ matches: pattern.exec(text), view })).find((r) => r.matches);
		return rule?.matches ? rule.view(m, rule.matches.slice(1)) : undecided(`Then ${text}`);
	});
}

/**
 * What each Then observes after running the input steps with the row, or undefined if the oracle does not
 * recognize some step or the spec does not decide the result (for example, the task does not exist).
 */
export function observeEditing(entries: StepOracle[], thens: StepOracle[], row: RowOracle): string[] | undefined {
	try {
		return observe(entries, thens, row);
	} catch (error) {
		if (error instanceof Undecided) return undefined;
		throw error;
	}
}
