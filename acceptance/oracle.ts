// Independent oracle for the equivalent-mutation filter: classifies a row with the
// rules of docs/spec.md (§5.2 relative state; §5.3 state and coverage in calendar
// mode; §4.1 and §4.2 validity on creation; §5.1 one-off state; §5.5–§5.7
// schedule, with one or more windows, and the checkbox outside them, §6.1; §5.8 pause and resume, and the pause button
// of the panel, §6.2; §5.9 postpone, and its button and text in the panel, §6.2), reading the text of the Gherkin steps. It does NOT import the core or the step
// handlers: if it did, the implementation would judge its own tests and
// no survivor (not even one that reveals a bug) would be visible.
// If it does not recognize a step or a value, it returns undefined (not filtered).

export interface StepOracle {
	text: string;
}
export type RowOracle = Record<string, string>;
/** What the scenario's Thens observe besides the state kind. */
export interface Observes {
	progress: boolean;
	/** Whether the row's checkbox is enabled (§6.1, §5.5). */
	checkbox?: boolean;
	/** If there is no Then about the state kind, progress or appearance: only the checkbox (§6.1, §5.5). */
	onlyCheckbox?: boolean;
	/** If no Then tells pending from overdue apart: Pending shows both the same (§6.1). */
	onlyAppearance?: boolean;
	/** If a Then asserts the occurrence covered by the new completion (§5.3), besides the queried state. */
	covered?: boolean;
	/** If a Then asserts the stored value of `pospuesta` (§4.1). */
	postponed?: boolean;
	/** If a Then asserts what the panel says about the postponement (§6.2). */
	panelText?: boolean;
}

const HOUR_MS = 3_600_000;
const DATE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;
const WHOLE_POSITIVE = /^\d+$/;

export function date(value: string): number | undefined {
	const parts = DATE.exec(value);
	if (!parts) return undefined;
	const [a, m, d, h, mi, s] = parts.slice(1).map(Number);
	const f = new Date(a, m - 1, d, h, mi, s);
	const exact = f.getFullYear() === a && f.getMonth() === m - 1 && f.getDate() === d && f.getHours() === h;
	return exact ? f.getTime() : undefined;
}

/** Spec §4.2: integer N ≥ 1. */
export function intervalValid(every: string | undefined): boolean {
	return every !== undefined && WHOLE_POSITIVE.test(every) && Number(every) >= 1;
}

/** "cada N dias" is equivalent to N × 24 hours (§5). */
export function intervalMs(every: string | undefined, unit: string | undefined): number | undefined {
	if (!intervalValid(every)) return undefined;
	if (unit === 'horas') return Number(every) * HOUR_MS;
	if (unit === 'dias') return Number(every) * 24 * HOUR_MS;
	return undefined;
}

/** §4.2: a relative task with an invalid interval is not created (the scenario fails, it does not classify). */
const intervalDeclaredValid = (s: { every?: string; unit?: string }) => s.every === undefined || intervalMs(s.every, s.unit) !== undefined;

/** Calendar recurrence (§4.2): weekdays (names) or month days. */
export type Calendar = { weekly: string[] } | { monthly: number[] };

export interface Situation {
	every?: string;
	unit?: string;
	completions: number[];
	now?: number;
	anyMoment: boolean;
	/** Title and rejection reasons specific to the shape; with no reasons and a title, it is created. */
	creation?: { title: string; reasons: string[] };
	calendar?: Calendar;
	created?: Date;
	/** Covered occurrences without a time (days) by the recorded completions, in order. */
	covered: Date[];
	/** §4.4: covered occurrences with a time (with a schedule), by their start. */
	coveredWithHour?: number[];
	/** Days of completions made before being calendar-based (without ocurrenciaCubierta); §5.3 adds them to P. */
	withoutCovered: Date[];
	/** Occurrence covered by the completion made by "I complete the task". */
	coveredNew?: Date;
	/** One-off task (§5.1): its due date, if it has one; `cualquiera` if the scenario says it does not matter. */
	oneOff?: { limit?: Date; any?: boolean };
	/** §4.1 and §5.5: the daily windows in which it can be completed, sorted. */
	schedule?: TimeWindow[];
	/** §5.8: paused; and the moment of the last resume (earlier completions no longer count). */
	paused?: boolean;
	resumed?: number;
	/** There is a covered occurrence declared without the moment of its completion: it is unknown whether it predates the resume. */
	coveredWithoutMoment?: boolean;
	/** §5.8: a completion after resuming with a moment earlier than reanudadaEn: reanudadaEn is now, so it cannot happen. */
	anachronistic?: boolean;
	/** §6.2: the edit panel was opened; the pause button it offers is observed. */
	panel?: boolean;
	/** §5.9: the stored postponement. */
	postponed?: Postponement;
	/** §6.2: the panel was opened at `ahora`; its postpone button is observed. */
	postponePanel?: boolean;
}

// ---- Spec §5.9: postpone ----

export interface Postponement {
	from: number;
	to: number;
}

const OPTION_HOURS = new Map([
	['1 hora', 1],
	['3 horas', 3]
]);

/** §5.9: pospuesta = { desde: ahora, hasta }; "hasta mañana" is 07:00 of the next local day. */
export function postponementOf(option: string, value: string): Postponement | undefined {
	const from = date(value);
	if (from === undefined) return undefined;
	if (option === 'hasta mañana') {
		const tomorrow = addDays(new Date(from), 1);
		return { from, to: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 7).getTime() };
	}
	const hours = OPTION_HOURS.get(option);
	return hours === undefined ? undefined : { from, to: from + hours * HOUR_MS };
}

// ---- Spec §4.1, §5.5, §5.6 and §5.7: schedule ----

/** A daily window [desde, hasta), in minutes since local 00:00. */
export interface TimeWindow {
	from: number;
	to: number;
}

const HOUR_AND_MINUTE = /^(\d{2}):(\d{2})$/;

/** 24-hour "HH:MM", in minutes; undefined if it is not a time. */
export function hourMinutes(value: string | undefined): number | undefined {
	const parts = value === undefined ? null : HOUR_AND_MINUTE.exec(value);
	if (!parts) return undefined;
	const [hour, minute] = [Number(parts[1]), Number(parts[2])];
	return hour < 24 && minute < 60 ? hour * 60 + minute : undefined;
}

/** §4.1: with both times and desde < hasta, the window; otherwise, the rejection reasons. */
function readTimeWindow(from: string | undefined, to: string | undefined): TimeWindow | string[] {
	const d = hourMinutes(from);
	const h = hourMinutes(to);
	if (d === undefined || h === undefined) return ['incomplete schedule'];
	return d < h ? { from: d, to: h } : ['end time not after start'];
}

/**
 * §4.1: the written windows, sorted by desde, or all the rejection reasons (the spec does not say which one is
 * shown if there are several: with more than one, the row is not decided as equivalent to one with a single one). Two
 * windows overlap if one starts before the other ends; contiguous ones do not.
 */
export function readSchedule(written: [string | undefined, string | undefined][]): TimeWindow[] | string[] {
	const read = written.map(([d, h]) => readTimeWindow(d, h));
	const reasons = [...new Set(read.filter((l): l is string[] => Array.isArray(l)).flat())];
	const timeWindows = read.filter((l): l is TimeWindow => !Array.isArray(l)).sort((a, b) => a.from - b.from);
	if (timeWindows.some((v, i) => i > 0 && v.from < timeWindows[i - 1].to)) reasons.push('overlapping schedules');
	return reasons.length > 0 ? reasons : timeWindows;
}

/** A schedule from a Given step: valid, or undefined. */
export function scheduleValid(written: [string, string][]): TimeWindow[] | undefined {
	const read = readSchedule(written);
	return read.every((v) => typeof v !== 'string') ? (read as TimeWindow[]) : undefined;
}

/** One or two windows from a step: "from D to H" or "from D to H and from D2 to H2". */
export const SCHEDULE = 'from (\\S+) to (\\S+)(?: and from (\\S+) to (\\S+))?';

/** The windows named by the HORARIO captures. */
export const writtenOf = ([d, h, d2, h2]: (string | undefined)[]): [string, string][] =>
	(d2 === undefined ? [[d, h]] : [[d, h], [d2, h2]]) as [string, string][];

/** The instant of day `d` at those minutes, local time. */
const atMinutes = (d: Date, minutes: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, minutes).getTime();

/** A window on a day (§5.6: one occurrence), in ms. */
export interface Occurrence {
	opens: number;
	closes: number;
}

const occurrencesOf = (vs: TimeWindow[], d: Date): Occurrence[] => vs.map((v) => ({ opens: atMinutes(d, v.from), closes: atMinutes(d, v.to) }));

/** The windows of the instant's days, in order: `desde` days before to `hasta` days after. */
const timeWindowsAround = (vs: TimeWindow[], instant: number, from: number, to: number) =>
	Array.from({ length: to - from + 1 }, (_, i) => occurrencesOf(vs, addDays(dayStart(instant), from + i))).flat();

/** §5.5: A, the first instant ≥ t within a window, and C, the hasta of that window. */
export function availableAndClosing(vs: TimeWindow[], t: number): { a: number; c: number } {
	const timeWindow = timeWindowsAround(vs, t, 0, 1).find(({ closes }) => t < closes) as Occurrence;
	return { a: Math.max(t, timeWindow.opens), c: timeWindow.closes };
}

export const insideOfTimeWindow = (vs: TimeWindow[], t: number) => availableAndClosing(vs, t).a === t;

/** The hasta of the last window of day `d`. */
export const closingOf = (vs: TimeWindow[], d: Date) => atMinutes(d, Math.max(...vs.map((v) => v.to)));

/** §5.5 at a moment: the state, the instant that orders it (§6.1) and, when waiting, from the start to the return. */
export interface WithSchedule {
	group: 'atrasada' | 'pendiente' | 'en espera';
	instant?: number;
	wait?: { start: number; returns: number };
}

/** Overdue from the overdue point; before A, waiting until A from the waiting start; otherwise, pending from A. */
function perDeadlines(a: number, lateness: number, start: number, now: number): WithSchedule {
	if (now >= lateness) return { group: 'atrasada', instant: lateness };
	if (now < a) return { group: 'en espera', instant: a, wait: { start, returns: a } };
	return { group: 'pendiente', instant: a };
}

/**
 * §5.5, recurring: T (would become pending without a schedule), the waiting start and the overdue point without a schedule of §5.2. Overdue
 * from the first of C and that overdue point; before A, waiting until A; otherwise, pending from A.
 */
export function recurringWithSchedule(vs: TimeWindow[], t: number, start: number, latenessWithoutSchedule: number | undefined, now: number): WithSchedule {
	const { a, c } = availableAndClosing(vs, t);
	return perDeadlines(a, Math.min(c, latenessWithoutSchedule ?? Infinity), start, now);
}

/** §5.6 and §5.7: A is the start of N and the overdue point is its hasta (C). */
export const perOccurrence = (n: Occurrence, start: number, now: number) => perDeadlines(n.opens, n.closes, start, now);

/**
 * §5.5 and §5.7, one-off: with a due date, overdue from the hasta of the last window of that day. Otherwise, before A
 * waiting from creadaEn; afterwards, within a window it is pending (ordered by its due date, §6.1) and outside it
 * waits from the previous hasta until the next desde.
 */
export function oneOffWithSchedule(vs: TimeWindow[], created: number, limit: Date | undefined, now: number): WithSchedule {
	const lateness = limit && closingOf(vs, limit);
	if (lateness !== undefined && now >= lateness) return { group: 'atrasada', instant: lateness };
	const { a } = availableAndClosing(vs, created);
	if (now < a) return { group: 'en espera', instant: a, wait: { start: created, returns: a } };
	if (insideOfTimeWindow(vs, now)) return { group: 'pendiente', instant: limit?.getTime() };
	const returns = availableAndClosing(vs, now).a;
	const closed = Math.max(...timeWindowsAround(vs, now, -1, 0).map(({ closes }) => closes).filter((closes) => closes <= now));
	return { group: 'en espera', instant: returns, wait: { start: closed, returns } };
}

/** The last instant of the day: covers any occurrence of that day (§5.6, values without a time). */
const dayEnd = (d: Date) => addDays(d, 1).getTime() - 1;

/**
 * §5.6, P with a schedule, in ms: the greatest of the covered occurrences with a time (instants) and the values without a time
 * (covered days and days of completadoEn without ocurrenciaCubierta), which cover the whole day; with none, the whole day
 * before creation.
 */
export function pWithSchedule(days: Date[], starts: number[], created: Date | undefined): number | undefined {
	const contributions = [...days.map(dayEnd), ...starts];
	if (contributions.length > 0) return Math.max(...contributions);
	return created && dayEnd(addDays(dayStart(created.getTime()), -1));
}

/**
 * §5.6: N, the first occurrence (occurrence day × window) starting after P. §5.8: an occurrence
 * whose window closed before reanudadaEn (or right at resume: the window is [desde, hasta)) does not count.
 */
export function calendarNext(calendar: Calendar, vs: TimeWindow[], p: number, resumed = -Infinity): Occurrence | undefined {
	return Array.from({ length: 33 }, (_, i) => addDays(dayStart(p), i))
		.filter((d) => occurs(calendar, d))
		.flatMap((d) => occurrencesOf(vs, d))
		.find(({ opens, closes }) => opens > p && closes > resumed);
}

/** §5.7: a relative task with more than one window and the interval in days is completed once per window. */
export const byTimeWindow = (unit: string | undefined, vs: TimeWindow[]) => unit === 'dias' && vs.length > 1;

/** §5.7, N of a relative task per window never completed: the first window whose hasta is after creation. */
export const firstWithoutClose = (vs: TimeWindow[], created: number) =>
	timeWindowsAround(vs, created, 0, 1).find(({ closes }) => closes > created) as Occurrence;

/** §5.7, N of a relative task per window: the first window starting after P on P's day or `cada` days later. */
export function nextByTimeWindow(vs: TimeWindow[], every: number, p: number): Occurrence {
	const days = [0, every].map((n) => addDays(dayStart(p), n));
	return days.flatMap((d) => occurrencesOf(vs, d)).find(({ opens }) => opens > p) as Occurrence;
}

/**
 * §5.6 and §5.7: the start of the occurrence covered by a new completion: before the hasta of N, N; otherwise, the most
 * recent one with start ≤ ahora among the days that count (calendar: its occurrence days; relative: any).
 */
export function startThatCovers(n: Occurrence, vs: TimeWindow[], account: (d: Date) => boolean, now: number): number {
	if (now < n.closes) return n.opens;
	const days: Date[] = [];
	for (let d = dayStart(now); d.getTime() >= dayStart(n.opens).getTime(); d = addDays(d, -1)) days.push(d);
	const started = days.filter(account).flatMap((d) => occurrencesOf(vs, d).filter(({ opens }) => opens <= now));
	return Math.max(...started.map(({ opens }) => opens));
}

export const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const NUMBER = /^-?\d+(\.\d+)?$/;
const ONLY_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** ISO-8601 without a time: the start of that local day. */
export function day(value: string): Date | undefined {
	const parts = ONLY_DATE.exec(value);
	const moment = parts ? date(`${value}T00:00:00`) : undefined;
	return moment === undefined ? undefined : new Date(moment);
}

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const dayStart = (ms: number) => addDays(new Date(ms), 0);
const lastDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
export const isoDay = (d: Date) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** §4.2: a month day that does not exist in that month falls on its last day. */
export function occurs(calendar: Calendar, d: Date): boolean {
	if ('weekly' in calendar) return calendar.weekly.includes(WEEKDAYS[d.getDay()]);
	return calendar.monthly.some((chosen) => Math.min(chosen, lastDayOfMonth(d)) === d.getDate());
}

/** The first occurrence after day `p` (N). */
export function firstLater(calendar: Calendar, p: Date): Date | undefined {
	return Array.from({ length: 31 }, (_, i) => addDays(p, i + 1)).find((d) => occurs(calendar, d));
}

/** §5.3: in (P, today] the most recent; if there is none, N. */
export function occurrenceThatCovers(calendar: Calendar, p: Date, today: Date): Date | undefined {
	const between = [];
	for (let d = today; d > p; d = addDays(d, -1)) between.push(d);
	return between.find((d) => occurs(calendar, d)) ?? firstLater(calendar, p);
}

/**
 * §5.3, P: the greatest of the covered occurrences and the days of completadoEn of completions without
 * ocurrenciaCubierta; if there are no completions, the day before creation.
 */
export function lastCovered(s: Situation): Date | undefined {
	// Without a schedule, the spec does not say how a covered occurrence with a time counts (§5.3 speaks of days).
	if ((s.coveredWithHour ?? []).length > 0) return undefined;
	const contributions = [...s.covered, ...s.withoutCovered];
	if (contributions.length > 0) return new Date(Math.max(...contributions.map((d) => d.getTime())));
	return s.created && addDays(dayStart(s.created.getTime()), -1);
}

/** Comma-separated list; undefined if any element is empty. */
export function elements(value: string): string[] | undefined {
	const parts = value.split(',').map((part) => part.trim());
	return parts.some((part) => part === '') ? undefined : parts;
}

export function weekdays(value: string): Calendar | undefined {
	const list = elements(value);
	return list?.every((d) => WEEKDAYS.includes(d)) ? { weekly: list } : undefined;
}

export function monthDays(value: string): Calendar | undefined {
	const list = elements(value);
	return list?.every((d) => NUMBER.test(d) && isDayOfMonth(Number(d))) ? { monthly: list.map(Number) } : undefined;
}

const isDayOfMonth = (n: number) => Number.isInteger(n) && n >= 1 && n <= 31;

type Rule = [RegExp, (s: Situation, c: string[]) => boolean | void];

const MOMENT = (value: string) => date(value);

function record(s: Situation, value: string): boolean {
	const moment = MOMENT(value);
	if (moment === undefined) return false;
	// §5.8: reanudadaEn is the moment of resuming, and a later completion cannot have an earlier moment.
	if (s.resumed !== undefined && moment < s.resumed) {
		s.anachronistic = true;
		return true;
	}
	if (s.schedule && (s.calendar || byTimeWindow(s.unit, s.schedule))) return recordWithSchedule(s, s.schedule, moment);
	s.completions.push(moment);
	if (!s.calendar) {
		s.withoutCovered.push(dayStart(moment));
		return true;
	}
	const p = lastCovered(s);
	const covered = p && occurrenceThatCovers(s.calendar, p, dayStart(moment));
	if (!covered) return false;
	s.covered.push(covered);
	return true;
}

/** §5.6 and §5.7: the completion stores the start of the occurrence it covers. */
function recordWithSchedule(s: Situation, vs: TimeWindow[], moment: number): boolean {
	const n = nextWithSchedule(s, vs);
	if (!n) return false;
	const calendar = s.calendar;
	s.completions.push(moment);
	s.coveredWithHour = [...(s.coveredWithHour ?? []), startThatCovers(n, vs, (d) => !calendar || occurs(calendar, d), moment)];
	return true;
}

/** "I complete the task on <t>": it is also the new completion whose coverage is verified. */
function complete(s: Situation, value: string): boolean {
	const before = s.covered.length;
	if (!record(s, value)) return false;
	s.coveredNew = s.covered.length > before ? s.covered.at(-1) : undefined;
	return true;
}

/**
 * §5.8: resuming removes the pause and from then on the task is evaluated as just created at reanudadaEn: with creadaEn =
 * reanudadaEn and without the earlier completions. If some completion is not earlier (or unknown), it is not modeled.
 */
function resumeSituation(s: Situation, value: string): boolean {
	const moment = MOMENT(value);
	if (moment === undefined || !s.paused || !intervalDeclaredValid(s)) return false;
	if (s.coveredWithoutMoment || s.completions.some((c) => c >= moment)) return false;
	Object.assign(s, { paused: false, resumed: moment, created: new Date(moment), completions: [], covered: [], withoutCovered: [] });
	if (s.coveredWithHour) s.coveredWithHour = [];
	return true;
}

function declare(s: Situation, calendar: Calendar | undefined, created?: string): boolean {
	s.calendar = calendar;
	if (created !== undefined) s.created = MOMENT(created) === undefined ? undefined : new Date(MOMENT(created) as number);
	return calendar !== undefined && (created === undefined || s.created !== undefined);
}

/** §4.4: a covered occurrence is a date (without a time) or the start of an occurrence (with a time). */
function coveredDeclared(s: Situation, covered: string, moment?: string): boolean {
	const d = day(covered);
	const start = MOMENT(covered);
	const completedAt = moment === undefined ? undefined : MOMENT(moment);
	if (d) s.covered.push(d);
	if (start !== undefined) s.coveredWithHour = [...(s.coveredWithHour ?? []), start];
	if (completedAt !== undefined) s.completions.push(completedAt);
	if (moment === undefined) s.coveredWithoutMoment = true;
	return (d !== undefined || start !== undefined) && (moment === undefined || completedAt !== undefined);
}

/** Calendar creation: rejection reasons for the days and the title. */
function createCalendar(s: Situation, title: string, reasons: string[] | undefined): boolean {
	if (reasons) s.creation = { title, reasons };
	return reasons !== undefined;
}

const reasonsWeek = (value: string) => (weekdays(value) ? [] : undefined);
/** §4.2: each month day is an integer between 1 and 31; otherwise the whole task is rejected. */
export function reasonsMonth(value: string): string[] | undefined {
	const list = elements(value);
	if (!list?.every((d) => NUMBER.test(d))) return undefined;
	return list.every((d) => isDayOfMonth(Number(d))) ? [] : ['invalid month day'];
}

/** §4.1: the due date must be an existing YYYY-MM-DD date; the past is accepted. */
export const reasonsDueDate = (value: string) => (day(value) ? [] : ['invalid due date']);

/** §4.1: empty or only spaces means no emoji; otherwise exactly one emoji grapheme (pictogram, flag or keycap). */
export function reasonsEmoji(value: string): string[] {
	const written = value.trim();
	const graphemes = [...new Intl.Segmenter('es', { granularity: 'grapheme' }).segment(written)].length;
	const isEmoji = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3)/u.test(written);
	const emoji = graphemes === 1 && isEmoji;
	return written === '' || emoji ? [] : ['invalid emoji'];
}

/** Declared one-off: with a valid due date, without one, or with any one. */
function declareOneOff(s: Situation, limit?: string): boolean {
	const d = limit === undefined ? undefined : day(limit);
	s.oneOff = { limit: d };
	return limit === undefined || d !== undefined;
}

const ONE_OFF_COMPLETIONS: Record<string, number> = { 'a completion': 1, 'two completions': 2 };

/** Already recorded completions whose moment the scenario says does not matter (§5.1). */
function hasCompletions(s: Situation, count: string): boolean {
	s.completions.push(...Array.from({ length: ONE_OFF_COMPLETIONS[count] }, () => 0));
	return true;
}

/** §4.1: the rejection reasons for the schedule written on creation (none if valid). */
function scheduleReasons(written: [string | undefined, string | undefined][]): string[] {
	const read = readSchedule(written);
	return read.filter((reason): reason is string => typeof reason === 'string');
}

/** §4.1: a relative task in hours cannot have more than one window. */
const relativeReasons = (every: string, unit: string, written: unknown[]) => [
	...(intervalValid(every) ? [] : ['invalid interval']),
	...(unit === 'horas' && written.length > 1 ? ['several schedules in an hourly relative'] : [])
];

/** An already stored schedule: it has to be valid, also for a relative task's interval (§4.1). */
function declareSchedule(s: Situation, written: [string, string][]): boolean {
	s.schedule = scheduleValid(written);
	return s.schedule !== undefined && !(s.unit === 'horas' && s.schedule.length > 1);
}

function declareCreated(s: Situation, created: string): boolean {
	const moment = MOMENT(created);
	s.created = moment === undefined ? undefined : new Date(moment);
	return moment !== undefined;
}

/** Schedule (§4.1, §5.5), before the general rules: its steps also end in free text. */
const SCHEDULE_RULES: Rule[] = [
	[new RegExp(`^the task can be completed ${SCHEDULE}$`), (s, hours) => declareSchedule(s, writtenOf(hours))],
	[/^a one-off task without a due date created on (\S+)$/, (s, [c]) => declareOneOff(s) && declareCreated(s, c)],
	[/^a one-off task with due date (\S+) created on (\S+)$/, (s, [l, c]) => declareOneOff(s, l) && declareCreated(s, c)],
	[
		/^a relative recurring task every (\S+) (\S+) created on (\S+)$/,
		(s, [n, u, c]) => (Object.assign(s, { every: n, unit: u }), declareCreated(s, c))
	],
	[/^I query Pendientes on (\S+)$/, (s, [t]) => ((s.now = MOMENT(t)), s.now !== undefined)],
	// The check changes neither the task's state nor its checkbox (§6.1).
	[/^Mostrar completadas is on$/, () => true],
	[
		new RegExp(`^I create a one-off task with title (.*) and schedule ${SCHEDULE}$`),
		(s, [t, ...hours]) => void (s.creation = { title: t, reasons: scheduleReasons(writtenOf(hours)) })
	],
	[
		new RegExp(`^I create a one-off task with a valid title and schedule ${SCHEDULE}$`),
		(s, hours) => void (s.creation = { title: 'Tarea', reasons: scheduleReasons(writtenOf(hours)) })
	],
	[
		/^I create a one-off task with a valid title and a schedule with only the start time (\S+)$/,
		(s, [d]) => void (s.creation = { title: 'Tarea', reasons: scheduleReasons([[d, undefined]]) })
	],
	[
		/^I create a one-off task with a valid title and a schedule with only the end time (\S+)$/,
		(s, [h]) => void (s.creation = { title: 'Tarea', reasons: scheduleReasons([[undefined, h]]) })
	],
	[
		/^I create a one-off task with a valid title, schedule from (\S+) to (\S+) and another schedule with only the start time (\S+)$/,
		(s, [d, h, d2]) => void (s.creation = { title: 'Tarea', reasons: scheduleReasons([[d, h], [d2, undefined]]) })
	],
	[
		new RegExp(`^I create a relative recurring task with title (.*) every (\\S+) (\\S+) and schedule ${SCHEDULE}$`),
		(s, [t, c, u, ...hours]) => {
			const written = writtenOf(hours);
			// An error in the schedule itself takes priority over that of the relative task in hours: with it, the spec does not decide which one is seen.
			const ofSchedule = scheduleReasons(written);
			const ofRelative = relativeReasons(c, u, written);
			if (ofSchedule.length > 0 && ofRelative.includes('several schedules in an hourly relative')) return false;
			s.creation = { title: t, reasons: [...ofRelative, ...ofSchedule] };
		}
	],
	[
		new RegExp(`^I create a weekly recurring task with title (.*) on (.*) and schedule ${SCHEDULE}$`),
		(s, [t, days, ...hours]) => {
			const reasons = reasonsWeek(days);
			return createCalendar(s, t, reasons && [...reasons, ...scheduleReasons(writtenOf(hours))]);
		}
	]
];

const RULES: Rule[] = [
	...SCHEDULE_RULES,
	// One-off (§4.1 and §5.1).
	[/^a one-off task without a due date$/, (s) => declareOneOff(s)],
	[/^a one-off task with due date (\S+)$/, (s, [l]) => declareOneOff(s, l)],
	[/^a one-off task with any due date$/, (s) => void (s.oneOff = { any: true })],
	[/^the task has (a completion|two completions)$/, (s, [c]) => hasCompletions(s, c)],
	// Created with a valid due date and queried: creadaEn does not influence the state (§5.1).
	[/^I create on (\S+) a one-off task with a valid title and due date (\S+)$/, (s, [, l]) => declareOneOff(s, l)],
	[
		/^I create a one-off task with title (.*) and due date (\S+)$/,
		(s, [t, l]) => void (s.creation = { title: t, reasons: reasonsDueDate(l) })
	],
	[
		/^I create a one-off task with title (.*), emoji (.*) and note (.*)$/,
		(s, [t, e]) => void (s.creation = { title: t, reasons: reasonsEmoji(e) })
	],
	[/^I create a one-off task with title (.*) and no due date$/, (s, [t]) => void (s.creation = { title: t, reasons: [] })],
	[
		/^I create a one-off task with a title of only spaces and no due date$/,
		(s) => void (s.creation = { title: '   ', reasons: [] })
	],
	[
		/^I create a one-off task with a valid title and due date (\S+)$/,
		(s, [l]) => void (s.creation = { title: 'Tarea', reasons: reasonsDueDate(l) })
	],
	[/^a relative recurring task every (\S+) (\S+)$/, (s, [c, u]) => void Object.assign(s, { every: c, unit: u })],
	[/^a relative recurring task never completed$/, () => undefined],
	// §4.1 and §5: the first step has no state: it does not change the task's state.
	[/^the first step of the task is (.*)$/, () => undefined],
	// §4.1 and §5: the minimal version has no state: it does not change the task's state.
	[/^the minimal version of the task is (.*)$/, () => undefined],
	[/^the task was completed on (\S+)$/, (s, [t]) => record(s, t)],
	[/^I complete the task on (\S+)$/, (s, [t]) => complete(s, t)],
	[/^I query the status on (\S+)$/, (s, [t]) => ((s.now = MOMENT(t)), s.now !== undefined)],
	[/^I query the status at any moment$/, (s) => void (s.anyMoment = true)],
	[
		/^I create a relative recurring task with title (.*) every (\S+) (\S+)$/,
		(s, [t, c]) => void (s.creation = { title: t, reasons: intervalValid(c) ? [] : ['invalid interval'] })
	],
	[
		/^I create a relative recurring task with title (.*) and a valid interval$/,
		(s, [t]) => void (s.creation = { title: t, reasons: [] })
	],
	[
		/^I create a relative recurring task with a title of only spaces and a valid interval$/,
		(s) => void (s.creation = { title: '   ', reasons: [] })
	],
	[
		/^I create a relative recurring task with a valid title and (\S+) as the interval amount$/,
		(s, [c]) =>
			void (s.creation = { title: 'Regar plantas', reasons: intervalValid(c) ? [] : ['invalid interval'] })
	],
	// Calendar state and completion (§5.3). With completions, creadaEn does not influence.
	[/^a weekly recurring task on (.*) created on (\S+)$/, (s, [d, c]) => declare(s, weekdays(d), c)],
	[/^a monthly recurring task on days (.*) created on (\S+)$/, (s, [d, c]) => declare(s, monthDays(d), c)],
	[/^a weekly recurring task on (.*)$/, (s, [d]) => declare(s, weekdays(d))],
	[/^a monthly recurring task on days (.*)$/, (s, [d]) => declare(s, monthDays(d))],
	[/^the task has a completion from (\S+) that covers (\S+)$/, (s, [t, c]) => coveredDeclared(s, c, t)],
	[/^the task has a completion that covers (\S+)$/, (s, [c]) => coveredDeclared(s, c)],
	[/^the task has another older completion that covers the same occurrence$/, () => undefined],
	// §5.8 and §6.2: only a recurring task is paused (the panel's Pausar button); Reanudar only the paused one.
	[/^(?:the task was paused|I pause the task)$/, (s) => !s.oneOff && !s.paused && void (s.paused = true)],
	[/^I resume the task on (\S+)$/, (s, [t]) => resumeSituation(s, t)],
	[/^I open the task in the edit panel$/, (s) => void (s.panel = true)],
	// §5.9 and §6.2: postponing acts at the moment; removing deletes the field.
	[/^(?:I postpone the task|the task was postponed) with option (.+) on (\S+)$/, (s, [o, m]) => postponeSituation(s, o, m)],
	[/^I remove the postponement$/, (s) => s.postponed !== undefined && void (s.postponed = undefined)],
	[/^I open the task in the edit panel on (\S+)$/, (s, [t]) => ((s.postponePanel = true), (s.now = MOMENT(t)), s.now !== undefined)],
	// Calendar creation (§4.1 and §4.2).
	[
		/^I create a weekly recurring task with title (.*) on (.*)$/,
		(s, [t, d]) => createCalendar(s, t, reasonsWeek(d))
	],
	[
		/^I create a monthly recurring task with title (.*) on days (.*)$/,
		(s, [t, d]) => createCalendar(s, t, reasonsMonth(d))
	],
	[/^I create a (?:weekly|monthly) recurring task with title (.*) and valid days$/, (s, [t]) => createCalendar(s, t, [])],
	[
		/^I create a (?:weekly|monthly) recurring task with a title of only spaces and valid days$/,
		(s) => createCalendar(s, '   ', [])
	],
	[
		/^I create a (?:weekly|monthly) recurring task with a valid title and without days$/,
		(s) => createCalendar(s, 'Tarea', ['missing days'])
	],
	[
		/^I create a monthly recurring task with a valid title on days (.*)$/,
		(s, [d]) => createCalendar(s, 'Tarea', reasonsMonth(d))
	],
	[
		/^I create a calendar recurring task with a valid title and weekdays and month days at once$/,
		(s) => createCalendar(s, 'Tarea', ['weekly and monthly combined'])
	]
];

/** Replaces <columna> with its value in the row; undefined if missing. */
export function resolve(text: string, row: RowOracle): string | undefined {
	let missing = false;
	const resolved = text.replace(/<([A-Za-z0-9_]+)>/g, (_, name: string) => {
		if (row[name] === undefined) missing = true;
		return row[name] ?? '';
	});
	return missing ? undefined : resolved;
}

export function build(steps: StepOracle[], row: RowOracle): Situation | undefined {
	const s: Situation = { completions: [], anyMoment: false, covered: [], withoutCovered: [] };
	for (const step of steps) {
		const text = resolve(step.text, row);
		if (text === undefined) return undefined;
		const rule = RULES.map(([pattern, apply]) => ({ matches: pattern.exec(text), apply })).find(
			(r) => r.matches
		);
		if (!rule?.matches || rule.apply(s, rule.matches.slice(1)) === false) return undefined;
	}
	return s;
}

function classifyCreation(c: { title: string; reasons: string[] }): string {
	const reasons = [...(c.title.trim() === '' ? ['empty title'] : []), ...c.reasons];
	return reasons.length === 0 ? 'creada' : `rechazada: ${reasons.join(', ')}`;
}

/** Spec §5.1: with a completion, out of Pending; otherwise overdue from the start of the day after the limit. */
function classifyOneOff(s: Situation, oneOff: NonNullable<Situation['oneOff']>): string | undefined {
	if (s.completions.length > 0) return 'no aparece en Pendientes';
	if (oneOff.any) return undefined;
	if (oneOff.limit === undefined) return s.anyMoment || s.now !== undefined ? 'pendiente' : undefined;
	if (s.now === undefined) return undefined;
	return s.now >= addDays(oneOff.limit, 1).getTime() ? 'atrasada' : 'pendiente';
}

/** §5.2 and §5.3: progress = elapsed / wait; with ahora < U (skewed clocks) it is 0 by spec rule. */
function progress(from: number, now: number, wait: number): string | undefined {
	if (now < from) return '0';
	if (!(wait > 0)) return undefined;
	return String(Math.min(1, (now - from) / wait));
}

/** The classification's "en espera", with its progress only if the scenario observes it. */
function inWait(observes: Observes, p: string | undefined): string | undefined {
	if (!observes.progress) return 'en espera';
	return p === undefined ? undefined : `en espera ${p}`;
}

/** Spec §5.2. */
function classifyStatus(s: Situation, observes: Observes): string | undefined {
	if (s.completions.length === 0) return s.anyMoment || s.now !== undefined ? 'pendiente' : undefined;
	if (s.now === undefined) return undefined;
	// Without a declared interval ("el intervalo no influye en este borde"): with ahora ≤ U the task is
	// waiting with progress 0 whatever the interval is (§5.2: ahora < U → waiting, progress 0).
	if (s.every === undefined && s.now <= Math.max(...s.completions)) return inWait(observes, '0');
	const interval = intervalMs(s.every, s.unit);
	if (interval === undefined) return undefined;
	const due = Math.max(...s.completions) + interval;
	if (s.now < due) return inWait(observes, progress(Math.max(...s.completions), s.now, interval));
	return s.now < due + interval ? 'pendiente' : 'atrasada';
}

/** Spec §5.3: today < N waiting, today = N pending, today > N overdue; or the occurrence covered by the new completion. */
function classifyCalendar(s: Situation, calendar: Calendar, observes: Observes): string | undefined {
	if (s.now === undefined) return s.coveredNew && `cubre ${isoDay(s.coveredNew)}`;
	const p = lastCovered(s);
	const n = p && firstLater(calendar, p);
	if (!n) return undefined;
	const today = dayStart(s.now).getTime();
	if (today < n.getTime()) {
		const start = s.completions.length > 0 ? Math.max(...s.completions) : s.created?.getTime();
		return inWait(observes, start === undefined ? undefined : progress(start, s.now, n.getTime() - start));
	}
	return today === n.getTime() ? 'pendiente' : 'atrasada';
}

/** §5.8: the row asks to complete after resuming with a moment earlier than reanudadaEn: not a possible scenario. */
export function isChronologyImpossible(entrySteps: StepOracle[], row: RowOracle): boolean {
	return build(entrySteps, row)?.anachronistic === true;
}

/** Classification of the row according to the spec, or undefined if the oracle does not recognize it. */
export function classifyRow(
	entrySteps: StepOracle[],
	row: RowOracle,
	observes: Observes = { progress: false }
): string | undefined {
	const s = build(entrySteps, row);
	if (!s) return undefined;
	if (s.creation) return classifyCreation(s.creation);
	return classifySituation(s, observes);
}

/**
 * §5.6 and §5.7: N of a calendar task with a schedule, or of a relative task per window; undefined if it cannot be deduced. The
 * completions of a relative task without a covered occurrence (sinCubierta) cover the whole day of their completadoEn.
 */
export function nextWithSchedule(s: Situation, vs: TimeWindow[]): Occurrence | undefined {
	const p = pWithSchedule([...s.covered, ...s.withoutCovered], s.coveredWithHour ?? [], s.created);
	if (s.calendar) return p === undefined ? undefined : calendarNext(s.calendar, vs, p, s.resumed);
	if (s.completions.length === 0) return s.created && firstWithoutClose(vs, s.created.getTime());
	return p === undefined || !intervalValid(s.every) ? undefined : nextByTimeWindow(vs, Number(s.every), p);
}

/** §5.5–§5.7: the moment with a schedule of the built task; undefined if something the spec needs is missing. */
export function withScheduleOf(s: Situation, vs: TimeWindow[], now: number): WithSchedule | undefined {
	if (s.oneOff) return s.oneOff.any || !s.created ? undefined : oneOffWithSchedule(vs, s.created.getTime(), s.oneOff.limit, now);
	const last = s.completions.length > 0 ? Math.max(...s.completions) : undefined;
	if (s.calendar || byTimeWindow(s.unit, vs)) {
		const n = nextWithSchedule(s, vs);
		const start = last ?? s.created?.getTime();
		return n && start !== undefined ? perOccurrence(n, start, now) : undefined;
	}
	if (last === undefined) return s.created && recurringWithSchedule(vs, s.created.getTime(), s.created.getTime(), undefined, now);
	const interval = intervalMs(s.every, s.unit);
	return interval === undefined ? undefined : recurringWithSchedule(vs, last + interval, last, last + 2 * interval, now);
}

/** §5.5: like §5.1–§5.3, with the moments the schedule shifts. A one-off with completions is completed (§5.1). */
function classifyWithSchedule(s: Situation, vs: TimeWindow[], observes: Observes): string | undefined {
	if (s.oneOff && s.completions.length > 0) return 'no aparece en Pendientes';
	if (s.now === undefined) return undefined;
	const moment = withScheduleOf(s, vs, s.now);
	if (!moment?.wait) return moment?.group;
	const { start, returns } = moment.wait;
	return inWait(observes, progress(start, s.now, returns - start));
}

/** §5.1–§5.7: the state by the task's rule, without the postponement. */
export function statusPerItsRule(s: Situation, observes: Observes): string | undefined {
	if (s.schedule) return classifyWithSchedule(s, s.schedule, observes);
	if (s.oneOff) return classifyOneOff(s, s.oneOff);
	return s.calendar ? classifyCalendar(s, s.calendar, observes) : classifyStatus(s, observes);
}

export const postponementActive = ({ postponed, now }: Situation) => (postponed && now !== undefined && now < postponed.to ? postponed : undefined);

export const WITHOUT_PROGRESS: Observes = { progress: false };
const pendingOOverdue = (status: string | undefined) => status === 'pendiente' || status === 'atrasada';

/** §5.9: it is waiting because of the postponement: with ahora < hasta, it would be pending or overdue by its rule. */
export function inWaitByPostponement(s: Situation): boolean {
	return postponementActive(s) !== undefined && pendingOOverdue(statusPerItsRule(s, WITHOUT_PROGRESS));
}

/** §5.9: progress = (ahora − desde) / (hasta − desde); with ahora < desde, 0. */
function postponementProgress({ from, to }: Postponement, now: number): string {
	return now < from ? '0' : String((now - from) / (to - from));
}

/** §5.9: if it would be waiting by its own rule, the postponement changes nothing. */
function classifyStatusOfSituation(s: Situation, observes: Observes): string | undefined {
	const active = postponementActive(s);
	return active && inWaitByPostponement(s)
		? inWait(observes, postponementProgress(active, s.now as number))
		: statusPerItsRule(s, observes);
}

/**
 * §5.9 and §6.2: with the postponement active, Quitar posponer; otherwise, Posponer only on a pending or overdue task that is not
 * paused. undefined if the state cannot be deduced.
 */
export function postponeButton(s: Situation): string | undefined {
	if (!intervalDeclaredValid(s)) return undefined;
	if (postponementActive(s)) return 'Quitar posponer';
	if (s.paused) return 'ninguno';
	const status = statusPerItsRule(s, WITHOUT_PROGRESS);
	if (status === undefined) return undefined;
	return pendingOOverdue(status) ? 'Posponer' : 'ninguno';
}

const twoDigits = (n: number) => String(n).padStart(2, '0');

/** §6.2: "Pospuesta hasta HH:MM", with "mañana" if hasta is on the day after ahora; farther away, the spec does not decide. */
function postponementText(s: Situation): string | undefined {
	const active = postponementActive(s);
	if (!active) return 'sin texto';
	const to = new Date(active.to);
	const hour = `${twoDigits(to.getHours())}:${twoDigits(to.getMinutes())}`;
	const today = dayStart(s.now as number);
	if (dayStart(active.to).getTime() === today.getTime()) return `Pospuesta hasta ${hour}`;
	return dayStart(active.to).getTime() === addDays(today, 1).getTime() ? `Pospuesta hasta mañana ${hour}` : undefined;
}

/** §6.2: the panel's postpone button and, if a Then asserts it, what it says about the postponement. */
function classifyPanelOfPostpone(s: Situation, observes: Observes): string | undefined {
	const button = postponeButton(s);
	if (!button || !observes.panelText) return button;
	const text = postponementText(s);
	return text && `${button}, ${text}`;
}

/** §6.2: Posponer only acts if the panel offers it at that moment. Without creadaEn, the task was created before everything. */
function postponeSituation(s: Situation, option: string, value: string): boolean {
	const postponed = postponementOf(option, value);
	if (!postponed) return false;
	if (s.oneOff && !s.created) s.created = new Date(CREATED_BY_DEFAULT);
	if (postponeButton({ ...s, now: postponed.from }) !== 'Posponer') return false;
	s.postponed = postponed;
	return true;
}

/**
 * §6.1 and §5.5: the checkbox that would delete (completed one-off, or completed recurring task whose last completion is from today
 * or later) is enabled; the one that would complete, only within the schedule's window.
 */
function checkboxOf(s: Situation, classification: string): string | undefined {
	if (s.now === undefined) return undefined;
	const withCompletions = s.completions.length > 0;
	// §5.9: a postponed task is not completed.
	const inWaitOwn = classification.startsWith('en espera') && !inWaitByPostponement(s);
	const completed = classification === 'no aparece en Pendientes' || isCompleted(Boolean(s.oneOff), inWaitOwn, withCompletions);
	const wouldDelete = completed && (Boolean(s.oneOff) || Math.max(...s.completions) >= dayStart(s.now).getTime());
	return wouldDelete || !s.schedule || insideOfTimeWindow(s.schedule, s.now) ? 'enabled' : 'disabled';
}

/** §6.2: the panel's pause button: none on a one-off; Reanudar if paused; otherwise Pausar. */
function pauseButton(s: Situation): string | undefined {
	if (!intervalDeclaredValid(s)) return undefined;
	if (s.oneOff) return 'no ofrece pausar';
	return s.paused ? 'ofrece Reanudar' : 'ofrece Pausar';
}

/** §5.8: a paused task has no state, is not completed and its checkbox is disabled, whatever ahora is. */
function classifyPaused(s: Situation, observes: Observes): string | undefined {
	if (!intervalDeclaredValid(s) || (s.now === undefined && !s.anyMoment)) return undefined;
	if (!observes.checkbox) return 'pausada';
	return observes.onlyCheckbox ? 'checkbox disabled' : 'pausada, checkbox disabled';
}

/** §5.3: with the queried state, the occurrence covered by the new completion, if a Then asserts it. */
function withCovered(s: Situation, observes: Observes, classification: string): string | undefined {
	if (!observes.covered || s.now === undefined) return classification;
	return s.coveredNew && `${classification}, cubre ${isoDay(s.coveredNew)}`;
}

/**
 * Classification of an already built task: one-off (§5.1), relative (§5.2), calendar (§5.3), with a schedule (§5.5),
 * paused (§5.8), postponed (§5.9); or, with the panel open, its pause or postpone button (§6.2); or the stored
 * value of `pospuesta` (§4.1), if that is what a Then asserts.
 */
export function classifySituation(s: Situation, observes: Observes): string | undefined {
	if (observes.postponed) return s.postponed && `pospuesta ${s.postponed.from} ${s.postponed.to}`;
	if (s.postponePanel) return classifyPanelOfPostpone(s, observes);
	if (s.panel) return pauseButton(s);
	if (s.paused) return classifyPaused(s, observes);
	const status = classifyStatusOfSituation(s, observes);
	const classification = status === undefined ? undefined : withCovered(s, observes, status);
	if (classification === undefined) return undefined;
	const visible = observes.onlyAppearance && (classification === 'pendiente' || classification === 'atrasada') ? 'aparece en Pendientes' : classification;
	if (!observes.checkbox) return visible;
	const checkbox = checkboxOf(s, classification);
	if (!checkbox) return undefined;
	return observes.onlyCheckbox ? `checkbox ${checkbox}` : `${visible}, checkbox ${checkbox}`;
}

// ---- Spec §6.1: order of the Pending list ----

export interface OrderTask {
	title: string;
	created: number;
	/** One-off: its due date (day), if it has one. */
	limit?: Date;
	oneOff: boolean;
	/** Relative: interval and completions; calendar: recurrence and covered occurrences. */
	interval?: number;
	completions: number[];
	calendar?: Calendar;
	covered: Date[];
	/** §4.4: covered occurrences with a time, by their start. */
	coveredWithHour?: number[];
	/** Has completions whose moment the scenario says does not matter ("the task X has a completion"). */
	withCompletionWithoutMoment?: boolean;
	/** §5.5: its daily windows, sorted, if it has a schedule. */
	schedule?: TimeWindow[];
	/** §5.8: paused; and the moment of the last resume. */
	paused?: boolean;
	resumed?: number;
	/** §4.2: the written interval is not valid (the task is not created); only the pause rules look at it. */
	intervalInvalid?: boolean;
	/** §5.9: the stored postponement. */
	postponed?: Postponement;
}

/** Before any other date of the scenarios: "they were created at the same instant, earlier than everything". */
const CREATED_BY_DEFAULT = 0;

/** Instant and group (0 overdue, 1 pending, 2 waiting) of a task, according to the §6.1 table. */
interface Urgency {
	group: number;
	instant?: number;
	/** §5.9: it is waiting because of the postponement: it does not count as completed. */
	byPostponement?: boolean;
}

function urgencyOneOff(t: OrderTask, now: number): Urgency | undefined {
	if (!t.limit) return { group: 1 };
	const next = addDays(t.limit, 1).getTime();
	return now >= next ? { group: 0, instant: next } : { group: 1, instant: t.limit.getTime() };
}

function urgencyRelative(t: OrderTask, now: number): Urgency | undefined {
	if (t.completions.length === 0) return { group: 1, instant: t.created };
	const u = Math.max(...t.completions);
	// Without a declared interval: §4.2 makes it at least 1 hour, so until U + 1 h it is waiting (V cannot be deduced).
	if (t.interval === undefined) return now < u + HOUR_MS ? { group: 2 } : undefined;
	const v = u + t.interval;
	if (now < v) return { group: 2, instant: v };
	return now < v + t.interval ? { group: 1, instant: v } : { group: 0, instant: v + t.interval };
}

function urgencyCalendar(t: OrderTask, calendar: Calendar, now: number): Urgency | undefined {
	// Without a schedule, the spec does not say how a covered occurrence with a time counts (§5.3 speaks of days).
	if ((t.coveredWithHour ?? []).length > 0) return undefined;
	const p =
		t.covered.length > 0 ? new Date(Math.max(...t.covered.map((d) => d.getTime()))) : addDays(dayStart(t.created), -1);
	const n = firstLater(calendar, p);
	if (!n) return undefined;
	const today = dayStart(now).getTime();
	if (today < n.getTime()) return { group: 2, instant: n.getTime() };
	return today === n.getTime() ? { group: 1, instant: n.getTime() } : { group: 0, instant: addDays(n, 1).getTime() };
}

const GROUP_OF: Record<WithSchedule['group'], number> = { atrasada: 0, pendiente: 1, 'en espera': 2 };

/** §5.5: T, the waiting start and the overdue point without a schedule of a relative task in the ordering; undefined if they cannot be deduced. */
function orderMoments(t: OrderTask): [number, number, number | undefined] | undefined {
	const last = t.completions.length > 0 ? Math.max(...t.completions) : undefined;
	if (last === undefined) return [t.created, t.created, undefined];
	return t.interval === undefined ? undefined : [last + t.interval, last, last + 2 * t.interval];
}

/**
 * §5.5–§5.6: a recurring task in the ordering with a schedule. Calendar, according to N (§5.6; the waiting start only gives the
 * progress: it does not order). A relative task with several windows (§5.7) is not modeled in the ordering.
 */
function orderRecurring(t: OrderTask, vs: TimeWindow[], now: number): WithSchedule | undefined {
	if (t.calendar) {
		const p = pWithSchedule(t.covered, t.coveredWithHour ?? [], new Date(t.created)) as number;
		const n = calendarNext(t.calendar, vs, p, t.resumed);
		return n && perOccurrence(n, t.completions.length > 0 ? Math.max(...t.completions) : t.created, now);
	}
	const moments = vs.length > 1 ? undefined : orderMoments(t);
	return moments && recurringWithSchedule(vs, ...moments, now);
}

/** §5.5 and §6.1: with a schedule, the group and the instant that orders it. */
function urgencyWithSchedule(t: OrderTask, vs: TimeWindow[], now: number): Urgency | undefined {
	const withSchedule = t.oneOff ? oneOffWithSchedule(vs, t.created, t.limit, now) : orderRecurring(t, vs, now);
	return withSchedule && { group: GROUP_OF[withSchedule.group], instant: withSchedule.instant };
}

function urgencyPerItsRule(t: OrderTask, now: number): Urgency | undefined {
	if (t.schedule) return urgencyWithSchedule(t, t.schedule, now);
	if (t.oneOff) return urgencyOneOff(t, now);
	return t.calendar ? urgencyCalendar(t, t.calendar, now) : urgencyRelative(t, now);
}

/** §5.9 and §6.1: a postponed task that would be pending or overdue goes to waiting, and its sort key is hasta. */
function urgencyOf(t: OrderTask, now: number): Urgency | undefined {
	const own = urgencyPerItsRule(t, now);
	if (!own || own.group === 2 || !t.postponed || now >= t.postponed.to) return own;
	return { group: 2, instant: t.postponed.to, byPostponement: true };
}

/** §6.2: Posponer only acts if the panel offers it at that moment: pending or overdue, not paused or postponed. */
function orderPostpone(t: OrderTask, postponed: Postponement): boolean {
	if (t.paused || t.intervalInvalid || (t.oneOff && withCompletions(t))) return false;
	const evaluable = evaluated(t);
	const urgency = evaluable && urgencyOf(evaluable, postponed.from);
	if (!urgency || urgency.group === 2) return false;
	t.postponed = postponed;
	return true;
}

export const COLLATION = new Intl.Collator('es', { sensitivity: 'base' });

type OrderRule = [RegExp, (tasks: OrderTask[], c: string[]) => boolean];

const nowOf = (value: string | undefined) => (value === undefined ? undefined : MOMENT(value));

function fresh(title: string, created: string | undefined, rest: Partial<OrderTask>): OrderTask | undefined {
	const moment = created === undefined ? CREATED_BY_DEFAULT : MOMENT(created);
	if (moment === undefined) return undefined;
	return { title, created: moment, oneOff: false, completions: [], covered: [], ...rest };
}

function add(tasks: OrderTask[], t: OrderTask | undefined): boolean {
	if (t) tasks.push(t);
	return t !== undefined;
}

function withTitle(tasks: OrderTask[], title: string): OrderTask | undefined {
	return tasks.find((t) => t.title === title);
}

export const ORDER_RULES: OrderRule[] = [
	// §4.1 and §6.1: the first step does not change the list order; the task has to exist.
	[/^the first step of the task (\S+) is (.*)$/, (ts, [t]) => withTitle(ts, t) !== undefined],
	// §4.1 and §6.1: the minimal version does not change the list order; the task has to exist.
	[/^the minimal version of the task (\S+) is (.*)$/, (ts, [t]) => withTitle(ts, t) !== undefined],
	[
		/^the task (\S+) was postponed with option (.+) on (\S+)$/,
		(ts, [t, o, m]) => {
			const task = withTitle(ts, t);
			const postponed = postponementOf(o, m);
			return task !== undefined && postponed !== undefined && orderPostpone(task, postponed);
		}
	],
	// §5.8: only a recurring task is paused; Reanudar only the paused one.
	[
		/^(?:the task (\S+) was paused|I pause the task (\S+))$/,
		(ts, [was, pause]) => {
			const task = withTitle(ts, was ?? pause);
			if (!task || task.oneOff || task.paused || task.intervalInvalid) return false;
			task.paused = true;
			return true;
		}
	],
	[
		/^I resume the task (\S+) on (\S+)$/,
		(ts, [t, m]) => {
			const task = withTitle(ts, t);
			const moment = MOMENT(m);
			if (!task?.paused || task.intervalInvalid || moment === undefined) return false;
			Object.assign(task, { paused: false, resumed: moment });
			return true;
		}
	],
	[
		new RegExp(`^the task (\\S+) can be completed ${SCHEDULE}$`),
		(ts, [t, ...hours]) => {
			const task = withTitle(ts, t);
			const schedule = scheduleValid(writtenOf(hours));
			if (task) task.schedule = schedule;
			return task !== undefined && schedule !== undefined;
		}
	],
	[
		/^a one-off task (\S+) with due date (\S+?)(?: created on (\S+))?$/,
		(ts, [t, l, c]) => day(l) !== undefined && add(ts, fresh(t, c, { oneOff: true, limit: day(l) }))
	],
	[/^a one-off task (\S+) without a due date(?: created on (\S+))?$/, (ts, [t, c]) => add(ts, fresh(t, c, { oneOff: true }))],
	[
		/^a relative recurring task (\S+) every (\S+) (\S+)(?: created on (\S+))?$/,
		(ts, [t, n, u, c]) =>
			add(ts, fresh(t, c, { interval: intervalMs(n, u), ...(intervalMs(n, u) === undefined && { intervalInvalid: true }) }))
	],
	[/^a relative recurring task (\S+) never completed(?: created on (\S+))?$/, (ts, [t, c]) => add(ts, fresh(t, c, {}))],
	[
		/^a weekly recurring task (\S+) on (.*?)(?: created on (\S+))?$/,
		(ts, [t, d, c]) => weekdays(d) !== undefined && add(ts, fresh(t, c, { calendar: weekdays(d) }))
	],
	[
		/^a monthly recurring task (\S+) on days (.*?)(?: created on (\S+))?$/,
		(ts, [t, d, c]) => monthDays(d) !== undefined && add(ts, fresh(t, c, { calendar: monthDays(d) }))
	],
	// For calendar tasks, the ordering oracle does not compute the occurrence it covers (§5.3): it does not model it.
	[
		// §4.4 and §6.1: a minimal-version completion counts like any other for the list.
		/^(?:the task (\S+) was completed|I complete the task (\S+)) on (\S+)(?: with the minimal one)?$/,
		(ts, [was, complete, m]) => {
			const moment = MOMENT(m);
			const task = withTitle(ts, was ?? complete);
			if (!task || task.calendar || moment === undefined) return false;
			task.completions.push(moment);
			return true;
		}
	],
	[
		/^the task (\S+) has a completion that covers (\S+)$/,
		(ts, [t, c]) => {
			const covered = day(c);
			const task = withTitle(ts, t);
			if (!task || !covered) return false;
			task.covered.push(covered);
			task.withCompletionWithoutMoment = true;
			return true;
		}
	],
	[
		/^the task (\S+) has a completion from (\S+) that covers (\S+)$/,
		(ts, [t, m, c]) => {
			const covered = day(c);
			const start = MOMENT(c);
			const moment = MOMENT(m);
			const task = withTitle(ts, t);
			if (!task || (!covered && start === undefined) || moment === undefined) return false;
			if (covered) task.covered.push(covered);
			if (start !== undefined) task.coveredWithHour = [...(task.coveredWithHour ?? []), start];
			task.completions.push(moment);
			return true;
		}
	],
	[
		/^the task (\S+) has (?:a completion|two completions)$/,
		(ts, [t]) => {
			const task = withTitle(ts, t);
			if (!task?.oneOff) return false;
			task.withCompletionWithoutMoment = true;
			return true;
		}
	]
];

/** Pending as seen: the titles from top to bottom and, of them, those shown as completed and paused. */
export interface PendingView {
	order: string;
	completedList: string;
	paused: string;
}

/**
 * §6.1: Pending, with titles separated by ", ". Only the query at a given moment is modeled (each
 * task's state depends on "ahora"), or at any moment when all the tasks are one-offs without a
 * due date. undefined if the oracle does not recognize the scenario.
 */
export function pendingOrder(steps: StepOracle[], row: RowOracle): PendingView | undefined {
	const tasks: OrderTask[] = [];
	let now: number | undefined;
	let anyMoment = false;
	let showCompleted = false;
	let showPaused = false;
	for (const step of steps) {
		const text = resolve(step.text, row);
		if (text === undefined) return undefined;
		const query = /^I query Pendientes on (\S+)$/.exec(text);
		if (query) now = nowOf(query[1]);
		else if (text === 'I query Pendientes at any moment') anyMoment = true;
		else if (text === SHOW_COMPLETED) showCompleted = true;
		else if (text === SHOW_PAUSED) showPaused = true;
		else {
			const rule = ORDER_RULES.map(([pattern, apply]) => ({ c: pattern.exec(text), apply })).find((r) => r.c);
			if (!rule?.c || !rule.apply(tasks, rule.c.slice(1))) return undefined;
		}
	}
	// A paused task does not depend on ahora: it goes last, by title (§6.1).
	if (anyMoment && tasks.some((t) => !t.paused && (!t.oneOff || t.limit))) return undefined;
	if (!anyMoment && now === undefined) return undefined;
	return pendingView(tasks, now, showCompleted, showPaused);
}

/** The step that turns on the "Mostrar completadas" check (§6.1); without it, it is off. */
export const SHOW_COMPLETED = 'Mostrar completadas is on';

/** The step that turns on the "Mostrar pausadas" check (§6.1); without it, it is off. */
export const SHOW_PAUSED = 'Mostrar pausadas is on';

/**
 * §5.8: a resumed task is evaluated as just created at reanudadaEn (creadaEn = reanudadaEn, without the earlier
 * completions); the §6.1 tie-break continues with the real creadaEn. undefined if it has covered occurrences: the
 * oracle does not know which are earlier.
 */
function evaluated(t: OrderTask): OrderTask | undefined {
	const from = t.resumed;
	if (from === undefined) return t;
	if (t.withCompletionWithoutMoment || t.covered.length > 0 || (t.coveredWithHour ?? []).length > 0) return undefined;
	return { ...t, created: from, completions: t.completions.filter((c) => c >= from) };
}

/** §6.1: paused tasks by title in Spanish collation; undefined if two tie (the id is not observable). */
function pausedByTitle(paused: OrderTask[]): OrderTask[] | undefined {
	const sorted = [...paused].sort((a, b) => COLLATION.compare(a.title, b.title));
	return sorted.some((t, i) => i > 0 && COLLATION.compare(sorted[i - 1].title, t.title) === 0) ? undefined : sorted;
}

const withCompletions = (t: OrderTask) => t.completions.length > 0 || t.covered.length > 0 || t.withCompletionWithoutMoment === true;

/** §6.1: completed is a one-off with at least one completion, or a waiting recurring task with at least one. */
export function isCompleted(oneOff: boolean, inWait: boolean, completions: boolean): boolean {
	return completions && (oneOff || inWait);
}

/** The §6.1 tie-break: oldest creadaEn, then title in Spanish collation (the id is not observable). */
const tiebreak = (a: OrderTask, b: OrderTask) => a.created - b.created || COLLATION.compare(a.title, b.title);

/** The non-completed by urgency (§6.1); undefined if any urgency cannot be deduced. */
function notCompletedByUrgency(tasks: OrderTask[], now: number): OrderTask[] | undefined {
	const urgencies = tasks.map((t) => ({ t, u: urgencyOf(evaluated(t) as OrderTask, now) }));
	if (urgencies.some(({ u }) => u === undefined)) return undefined;
	const withoutInstant = Number.MAX_SAFE_INTEGER;
	return urgencies
		.sort(
			(a, b) =>
				(a.u?.group ?? 0) - (b.u?.group ?? 0) ||
				(a.u?.instant ?? withoutInstant) - (b.u?.instant ?? withoutInstant) ||
				tiebreak(a.t, b.t)
		)
		.map(({ t }) => t);
}

/** The completed, from most recent completadoEn to oldest (§6.1); undefined if one has to be ordered without a moment. */
function completedByRecent(completedList: OrderTask[]): OrderTask[] | undefined {
	if (completedList.length > 1 && completedList.some((t) => t.completions.length === 0 || t.withCompletionWithoutMoment)) return undefined;
	const last = (t: OrderTask) => Math.max(...t.completions);
	return [...completedList].sort((a, b) => last(b) - last(a) || tiebreak(a, b));
}

/**
 * §6.1 with "ahora" (or, without it, at any moment): first the non-completed by urgency; the
 * completed, only with Mostrar completadas on; at the end the paused (§5.8), only with Mostrar pausadas
 * on. undefined if something cannot be deduced.
 */
export function pendingView(
	tasks: OrderTask[],
	now: number | undefined,
	showCompleted: boolean,
	showPaused = false
): PendingView | undefined {
	const moment = now ?? 0;
	const active = tasks.filter((t) => !t.paused);
	if (active.some((t) => evaluated(t) === undefined)) return undefined;
	const completed = (t: OrderTask) => {
		const e = evaluated(t) as OrderTask;
		const urgency = urgencyOf(e, moment);
		return isCompleted(e.oneOff, !e.oneOff && urgency?.group === 2 && !urgency.byPostponement, withCompletions(e));
	};
	const notCompleted = notCompletedByUrgency(active.filter((t) => !completed(t)), moment);
	const completedList = showCompleted ? completedByRecent(active.filter(completed)) : [];
	const paused = showPaused ? pausedByTitle(tasks.filter((t) => t.paused)) : [];
	if (!notCompleted || !completedList || !paused) return undefined;
	const titles = (ts: OrderTask[]) => ts.map((t) => t.title).join(', ');
	return { order: titles([...notCompleted, ...completedList, ...paused]), completedList: titles(completedList), paused: titles(paused) };
}

/** The Pending titles in the order of §6.1; undefined if something cannot be deduced. */
export function sortPending(
	tasks: OrderTask[],
	now: number | undefined,
	showCompleted = false,
	showPaused = false
): string | undefined {
	return pendingView(tasks, now, showCompleted, showPaused)?.order;
}

// ---- §6, "Qué se dibuja con qué" ----

const ATKINSON = 'Atkinson Hyperlegible Next';
const NOTO = 'Noto Color Emoji';
const SYSTEM = 'la fuente del sistema';
const DEVICE = 'el emoji del dispositivo';

/**
 * What §6 guarantees Atkinson has: Spanish, digits, `#`, `*`, `©`, `®`, `™`, and a title's punctuation marks.
 * The rest of Latin is not decided by the spec: it is undecided, not filtered.
 */
const THAT_HAS_ATKINSON = /^[a-zñáéíóúüA-ZÑÁÉÍÓÚÜ0-9#*©®™ ,.;:¿?¡!()'"/-]$/u;
/** §6: "otro alfabeto en un título": alphabets that a Latin font does not carry. */
const OTHER_ALPHABET = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Devanagari}\p{Script=Thai}]$/u;
/** What composes an emoji without being one (§4.1): emoji mark, ZWJ, keycap and subdivision tags. */
const COMPOSITION = /[️‍⃣\u{E0020}-\u{E007F}]/gu;

/**
 * The table row for a grapheme. Without a mark, what Atkinson has goes first (digits and `©` also
 * exist as emoji). Noto has every assigned emoji (also `❤`, without a mark, which Atkinson lacks); a
 * pictogram not yet assigned is from a newer Unicode version and Noto does not have it.
 */
function graphemeFont(grapheme: string): string | undefined {
	if (THAT_HAS_ATKINSON.test(grapheme)) return ATKINSON;
	if (OTHER_ALPHABET.test(grapheme)) return SYSTEM;
	const parts = [...grapheme.replace(COMPOSITION, '')];
	if (parts.length === 0) return undefined;
	if (parts.every((part) => /^\p{Emoji}$/u.test(part))) return NOTO;
	return parts.every((part) => /^\p{Extended_Pictographic}$/u.test(part)) ? DEVICE : undefined;
}

/** The distinct fonts of a text, in order of appearance; undefined if some grapheme is undecided or there are none. */
function fontsOf(text: string): string[] | undefined {
	const graphemes = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(({ segment }) => segment);
	const fonts = graphemes.map(graphemeFont);
	if (fonts.length === 0 || fonts.includes(undefined)) return undefined;
	return [...new Set(fonts as string[])];
}

export const isScenarioOfFont = (texts: string[]) => texts.some((text) => /^the text is drawn with /.test(text));

/** What "the text is drawn with" observes and asserts: undefined if the oracle does not recognize the scenario. */
export function observeFont(entries: StepOracle[], thens: StepOracle[], row: RowOracle): { observed: string[]; asserted: string[] } | undefined {
	if (entries.length !== 1 || thens.length !== 1) return undefined;
	const text = /^the text (.*)$/su.exec(resolve(entries[0].text, row) ?? '')?.[1];
	const font = /^the text is drawn with (.*)$/su.exec(resolve(thens[0].text, row) ?? '')?.[1];
	const observed = text === undefined ? undefined : fontsOf(text);
	return observed === undefined || font === undefined ? undefined : { observed, asserted: [font] };
}
