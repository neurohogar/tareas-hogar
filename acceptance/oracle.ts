// Oráculo independiente del filtro de equivalentes: clasifica una fila con las
// reglas de docs/spec.md (§5.2 estado relativo; §5.3 estado y cobertura en modo
// calendario; §4.1 y §4.2 validez al crear; §5.1 estado de la puntual; §5.5–§5.7
// horario, con una o más ventanas, y el checkbox fuera de ellas, §6.1; §5.8 pausa y reanudación, y el botón
// de pausa del panel, §6.2; §5.9 posponer, y su botón y su texto en el panel, §6.2), leyendo el texto de los pasos del Gherkin. NO importa el core ni los step
// handlers: si lo hiciera, la implementación juzgaría a sus propios tests y
// ningún sobreviviente (ni siquiera uno que revele un bug) sería visible.
// Si no reconoce un paso o un valor, devuelve undefined (no se filtra).

export interface StepOracle {
	text: string;
}
export type RowOracle = Record<string, string>;
/** Lo que los Then del escenario observan además del tipo de estado. */
export interface Observes {
	progress: boolean;
	/** Si el checkbox de la fila está habilitado (§6.1, §5.5). */
	checkbox?: boolean;
	/** Si no hay Then sobre el tipo de estado, el progreso ni la aparición: solo el checkbox (§6.1, §5.5). */
	onlyCheckbox?: boolean;
	/** Si ningún Then distingue pendiente de atrasada: Pendientes muestra las dos igual (§6.1). */
	onlyAppearance?: boolean;
	/** Si un Then afirma la ocurrencia que cubrió el completado nuevo (§5.3), además del estado consultado. */
	covered?: boolean;
	/** Si un Then afirma el valor guardado de `pospuesta` (§4.1). */
	postponed?: boolean;
	/** Si un Then afirma lo que el panel dice de la posposición (§6.2). */
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

/** Spec §4.2: N entero ≥ 1. */
export function intervalValid(every: string | undefined): boolean {
	return every !== undefined && WHOLE_POSITIVE.test(every) && Number(every) >= 1;
}

/** "cada N dias" equivale a N × 24 horas (§5). */
export function intervalMs(every: string | undefined, unit: string | undefined): number | undefined {
	if (!intervalValid(every)) return undefined;
	if (unit === 'horas') return Number(every) * HOUR_MS;
	if (unit === 'dias') return Number(every) * 24 * HOUR_MS;
	return undefined;
}

/** §4.2: una relativa con intervalo inválido no se crea (el escenario falla, no clasifica). */
const intervalDeclaredValid = (s: { every?: string; unit?: string }) => s.every === undefined || intervalMs(s.every, s.unit) !== undefined;

/** Recurrencia de calendario (§4.2): días de la semana (nombres) o días del mes. */
export type Calendar = { weekly: string[] } | { monthly: number[] };

export interface Situation {
	every?: string;
	unit?: string;
	completions: number[];
	now?: number;
	anyMoment: boolean;
	/** Título y motivos de rechazo propios de la forma; sin motivos y con título, se crea. */
	creation?: { title: string; reasons: string[] };
	calendar?: Calendar;
	created?: Date;
	/** Ocurrencias cubiertas sin hora (días) por los completados registrados, en orden. */
	covered: Date[];
	/** §4.4: ocurrencias cubiertas con hora (con horario), por su inicio. */
	coveredWithHour?: number[];
	/** Días de los completados hechos antes de ser de calendario (sin ocurrenciaCubierta); §5.3 los suma a P. */
	withoutCovered: Date[];
	/** Ocurrencia que cubrió el completado hecho por "completo la tarea". */
	coveredNew?: Date;
	/** Tarea puntual (§5.1): su fecha límite, si la tiene; `cualquiera` si el escenario dice que no influye. */
	oneOff?: { limit?: Date; any?: boolean };
	/** §4.1 y §5.5: las ventanas diarias en las que se puede completar, ordenadas. */
	schedule?: TimeWindow[];
	/** §5.8: pausada; y el momento de la última reanudación (los completados anteriores ya no cuentan). */
	paused?: boolean;
	resumed?: number;
	/** Hay una ocurrencia cubierta declarada sin el momento de su completado: no se sabe si es anterior a reanudar. */
	coveredWithoutMoment?: boolean;
	/** §5.8: un completado posterior a reanudar con un momento anterior a reanudadaEn: reanudadaEn es ahora, así que no puede pasar. */
	anachronistic?: boolean;
	/** §6.2: se abrió el panel de edición; se observa el botón de pausa que ofrece. */
	panel?: boolean;
	/** §5.9: la posposición guardada. */
	postponed?: Postponement;
	/** §6.2: el panel se abrió en `ahora`; se observa su botón de posponer. */
	postponePanel?: boolean;
}

// ---- Spec §5.9: posponer ----

export interface Postponement {
	from: number;
	to: number;
}

const OPTION_HOURS = new Map([
	['1 hora', 1],
	['3 horas', 3]
]);

/** §5.9: pospuesta = { desde: ahora, hasta }; "hasta mañana" son las 07:00 del día local siguiente. */
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

// ---- Spec §4.1, §5.5, §5.6 y §5.7: horario ----

/** Una ventana diaria [desde, hasta), en minutos desde las 00:00 locales. */
export interface TimeWindow {
	from: number;
	to: number;
}

const HOUR_AND_MINUTE = /^(\d{2}):(\d{2})$/;

/** "HH:MM" de 24 h, en minutos; undefined si no es una hora. */
export function hourMinutes(value: string | undefined): number | undefined {
	const parts = value === undefined ? null : HOUR_AND_MINUTE.exec(value);
	if (!parts) return undefined;
	const [hour, minute] = [Number(parts[1]), Number(parts[2])];
	return hour < 24 && minute < 60 ? hour * 60 + minute : undefined;
}

/** §4.1: con las dos horas y desde < hasta, la ventana; si no, los motivos de rechazo. */
function readTimeWindow(from: string | undefined, to: string | undefined): TimeWindow | string[] {
	const d = hourMinutes(from);
	const h = hourMinutes(to);
	if (d === undefined || h === undefined) return ['horario incompleto'];
	return d < h ? { from: d, to: h } : ['hora de fin no posterior'];
}

/**
 * §4.1: las ventanas escritas, ordenadas por desde, o todos los motivos de rechazo (el spec no dice cuál se
 * muestra si hay varios: con más de uno, la fila no se decide como equivalente a una con uno solo). Dos
 * ventanas se superponen si una empieza antes de que termine la otra; contiguas, no.
 */
export function readSchedule(written: [string | undefined, string | undefined][]): TimeWindow[] | string[] {
	const read = written.map(([d, h]) => readTimeWindow(d, h));
	const reasons = [...new Set(read.filter((l): l is string[] => Array.isArray(l)).flat())];
	const timeWindows = read.filter((l): l is TimeWindow => !Array.isArray(l)).sort((a, b) => a.from - b.from);
	if (timeWindows.some((v, i) => i > 0 && v.from < timeWindows[i - 1].to)) reasons.push('horarios superpuestos');
	return reasons.length > 0 ? reasons : timeWindows;
}

/** Un horario de un paso Given: válido, o undefined. */
export function scheduleValid(written: [string, string][]): TimeWindow[] | undefined {
	const read = readSchedule(written);
	return read.every((v) => typeof v !== 'string') ? (read as TimeWindow[]) : undefined;
}

/** Una o dos ventanas de un paso: "de D a H" o "de D a H y de D2 a H2". */
export const SCHEDULE = 'de (\\S+) a (\\S+)(?: y de (\\S+) a (\\S+))?';

/** Las ventanas que nombran las capturas de HORARIO. */
export const writtenOf = ([d, h, d2, h2]: (string | undefined)[]): [string, string][] =>
	(d2 === undefined ? [[d, h]] : [[d, h], [d2, h2]]) as [string, string][];

/** El instante del día `d` a esos minutos, hora local. */
const atMinutes = (d: Date, minutes: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, minutes).getTime();

/** Una ventana en un día (§5.6: una ocurrencia), en ms. */
export interface Occurrence {
	opens: number;
	closes: number;
}

const occurrencesOf = (vs: TimeWindow[], d: Date): Occurrence[] => vs.map((v) => ({ opens: atMinutes(d, v.from), closes: atMinutes(d, v.to) }));

/** Las ventanas de los días del instante, en orden: `desde` días antes hasta `hasta` días después. */
const timeWindowsAround = (vs: TimeWindow[], instant: number, from: number, to: number) =>
	Array.from({ length: to - from + 1 }, (_, i) => occurrencesOf(vs, addDays(dayStart(instant), from + i))).flat();

/** §5.5: A, el primer instante ≥ t dentro de una ventana, y C, el hasta de esa ventana. */
export function availableAndClosing(vs: TimeWindow[], t: number): { a: number; c: number } {
	const timeWindow = timeWindowsAround(vs, t, 0, 1).find(({ closes }) => t < closes) as Occurrence;
	return { a: Math.max(t, timeWindow.opens), c: timeWindow.closes };
}

export const insideOfTimeWindow = (vs: TimeWindow[], t: number) => availableAndClosing(vs, t).a === t;

/** El hasta de la última ventana del día `d`. */
export const closingOf = (vs: TimeWindow[], d: Date) => atMinutes(d, Math.max(...vs.map((v) => v.to)));

/** §5.5 en un momento: el estado, el instante que lo ordena (§6.1) y, en espera, del inicio a la vuelta. */
export interface WithSchedule {
	group: 'atrasada' | 'pendiente' | 'en espera';
	instant?: number;
	wait?: { start: number; returns: number };
}

/** Atrasada desde el atraso; antes de A, en espera hasta A desde el inicio de espera; si no, pendiente desde A. */
function perDeadlines(a: number, lateness: number, start: number, now: number): WithSchedule {
	if (now >= lateness) return { group: 'atrasada', instant: lateness };
	if (now < a) return { group: 'en espera', instant: a, wait: { start, returns: a } };
	return { group: 'pendiente', instant: a };
}

/**
 * §5.5, periódica: T (pasaría a pendiente sin horario), el inicio de espera y el atraso sin horario de §5.2. Atrasada
 * desde el primero entre C y ese atraso; antes de A, en espera hasta A; si no, pendiente desde A.
 */
export function recurringWithSchedule(vs: TimeWindow[], t: number, start: number, latenessWithoutSchedule: number | undefined, now: number): WithSchedule {
	const { a, c } = availableAndClosing(vs, t);
	return perDeadlines(a, Math.min(c, latenessWithoutSchedule ?? Infinity), start, now);
}

/** §5.6 y §5.7: A es el inicio de N y el atraso, su hasta (C). */
export const perOccurrence = (n: Occurrence, start: number, now: number) => perDeadlines(n.opens, n.closes, start, now);

/**
 * §5.5 y §5.7, puntual: con fecha límite, atrasada desde el hasta de la última ventana de ese día. Si no, antes de A
 * espera desde creadaEn; después, dentro de una ventana está pendiente (ordenada por su fecha límite, §6.1) y fuera
 * espera desde el hasta anterior hasta el desde de la próxima.
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

/** El último instante del día: cubre cualquier ocurrencia de ese día (§5.6, valores sin hora). */
const dayEnd = (d: Date) => addDays(d, 1).getTime() - 1;

/**
 * §5.6, P con horario, en ms: la mayor entre las ocurrencias cubiertas con hora (instantes) y los valores sin hora
 * (días cubiertos y días de completadoEn sin ocurrenciaCubierta), que cubren el día entero; sin ninguno, el día
 * anterior a la creación entero.
 */
export function pWithSchedule(days: Date[], starts: number[], created: Date | undefined): number | undefined {
	const contributions = [...days.map(dayEnd), ...starts];
	if (contributions.length > 0) return Math.max(...contributions);
	return created && dayEnd(addDays(dayStart(created.getTime()), -1));
}

/**
 * §5.6: N, la primera ocurrencia (día de ocurrencia × ventana) con inicio posterior a P. §5.8: una ocurrencia
 * cuya ventana cerró antes de reanudadaEn (o justo al reanudar: la ventana es [desde, hasta)) no cuenta.
 */
export function calendarNext(calendar: Calendar, vs: TimeWindow[], p: number, resumed = -Infinity): Occurrence | undefined {
	return Array.from({ length: 33 }, (_, i) => addDays(dayStart(p), i))
		.filter((d) => occurs(calendar, d))
		.flatMap((d) => occurrencesOf(vs, d))
		.find(({ opens, closes }) => opens > p && closes > resumed);
}

/** §5.7: una relativa con más de una ventana y el intervalo en días se completa una vez por ventana. */
export const byTimeWindow = (unit: string | undefined, vs: TimeWindow[]) => unit === 'dias' && vs.length > 1;

/** §5.7, N de una relativa por ventana nunca completada: la primera ventana cuyo hasta es posterior a la creación. */
export const firstWithoutClose = (vs: TimeWindow[], created: number) =>
	timeWindowsAround(vs, created, 0, 1).find(({ closes }) => closes > created) as Occurrence;

/** §5.7, N de una relativa por ventana: la primera ventana con inicio posterior a P del día de P o de `cada` días después. */
export function nextByTimeWindow(vs: TimeWindow[], every: number, p: number): Occurrence {
	const days = [0, every].map((n) => addDays(dayStart(p), n));
	return days.flatMap((d) => occurrencesOf(vs, d)).find(({ opens }) => opens > p) as Occurrence;
}

/**
 * §5.6 y §5.7: el inicio de la ocurrencia que cubre un completado nuevo: antes del hasta de N, N; si no, la más
 * reciente con inicio ≤ ahora entre los días que cuentan (de calendario, sus días de ocurrencia; relativa, cualquiera).
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

/** ISO-8601 sin hora: el inicio de ese día local. */
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

/** §4.2: un día del mes que no existe en ese mes cae en su último día. */
export function occurs(calendar: Calendar, d: Date): boolean {
	if ('weekly' in calendar) return calendar.weekly.includes(WEEKDAYS[d.getDay()]);
	return calendar.monthly.some((chosen) => Math.min(chosen, lastDayOfMonth(d)) === d.getDate());
}

/** La primera ocurrencia posterior al día `p` (N). */
export function firstLater(calendar: Calendar, p: Date): Date | undefined {
	return Array.from({ length: 31 }, (_, i) => addDays(p, i + 1)).find((d) => occurs(calendar, d));
}

/** §5.3: en (P, hoy] la más reciente; si no hay ninguna, N. */
export function occurrenceThatCovers(calendar: Calendar, p: Date, today: Date): Date | undefined {
	const between = [];
	for (let d = today; d > p; d = addDays(d, -1)) between.push(d);
	return between.find((d) => occurs(calendar, d)) ?? firstLater(calendar, p);
}

/**
 * §5.3, P: la mayor entre las ocurrencias cubiertas y los días de completadoEn de los completados sin
 * ocurrenciaCubierta; si no hay completados, el día anterior a la creación.
 */
export function lastCovered(s: Situation): Date | undefined {
	// Sin horario, el spec no dice cómo cuenta una ocurrencia cubierta con hora (§5.3 habla de días).
	if ((s.coveredWithHour ?? []).length > 0) return undefined;
	const contributions = [...s.covered, ...s.withoutCovered];
	if (contributions.length > 0) return new Date(Math.max(...contributions.map((d) => d.getTime())));
	return s.created && addDays(dayStart(s.created.getTime()), -1);
}

/** Lista separada por comas; undefined si algún elemento está vacío. */
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
	// §5.8: reanudadaEn es el momento de reanudar, y un completado posterior no puede tener un momento anterior.
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

/** §5.6 y §5.7: el completado guarda el inicio de la ocurrencia que cubre. */
function recordWithSchedule(s: Situation, vs: TimeWindow[], moment: number): boolean {
	const n = nextWithSchedule(s, vs);
	if (!n) return false;
	const calendar = s.calendar;
	s.completions.push(moment);
	s.coveredWithHour = [...(s.coveredWithHour ?? []), startThatCovers(n, vs, (d) => !calendar || occurs(calendar, d), moment)];
	return true;
}

/** "completo la tarea el <t>": además, es el completado nuevo cuya cobertura se verifica. */
function complete(s: Situation, value: string): boolean {
	const before = s.covered.length;
	if (!record(s, value)) return false;
	s.coveredNew = s.covered.length > before ? s.covered.at(-1) : undefined;
	return true;
}

/**
 * §5.8: reanudar quita la pausa y desde ahí la tarea se evalúa como recién creada en reanudadaEn: con creadaEn =
 * reanudadaEn y sin los completados anteriores. Si algún completado no es anterior (o no se sabe), no se modela.
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

/** §4.4: una ocurrencia cubierta es una fecha (sin hora) o el inicio de una ocurrencia (con hora). */
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

/** Creación de calendario: motivos de rechazo de los días y título. */
function createCalendar(s: Situation, title: string, reasons: string[] | undefined): boolean {
	if (reasons) s.creation = { title, reasons };
	return reasons !== undefined;
}

const reasonsWeek = (value: string) => (weekdays(value) ? [] : undefined);
/** §4.2: cada día del mes es un entero entre 1 y 31; si no, se rechaza toda la tarea. */
export function reasonsMonth(value: string): string[] | undefined {
	const list = elements(value);
	if (!list?.every((d) => NUMBER.test(d))) return undefined;
	return list.every((d) => isDayOfMonth(Number(d))) ? [] : ['día del mes inválido'];
}

/** §4.1: la fecha límite debe ser una fecha AAAA-MM-DD que existe; el pasado se acepta. */
export const reasonsDueDate = (value: string) => (day(value) ? [] : ['fecha límite inválida']);

/** §4.1: vacío o solo espacios es sin emoji; si no, exactamente un grafema emoji (pictograma, bandera o keycap). */
export function reasonsEmoji(value: string): string[] {
	const written = value.trim();
	const graphemes = [...new Intl.Segmenter('es', { granularity: 'grapheme' }).segment(written)].length;
	const isEmoji = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3)/u.test(written);
	const emoji = graphemes === 1 && isEmoji;
	return written === '' || emoji ? [] : ['emoji inválido'];
}

/** Puntual declarada: con fecha límite válida, sin ella, o con una cualquiera. */
function declareOneOff(s: Situation, limit?: string): boolean {
	const d = limit === undefined ? undefined : day(limit);
	s.oneOff = { limit: d };
	return limit === undefined || d !== undefined;
}

const ONE_OFF_COMPLETIONS: Record<string, number> = { 'un completado': 1, 'dos completados': 2 };

/** Completados ya registrados cuyo momento el escenario dice que no influye (§5.1). */
function hasCompletions(s: Situation, count: string): boolean {
	s.completions.push(...Array.from({ length: ONE_OFF_COMPLETIONS[count] }, () => 0));
	return true;
}

/** §4.1: los motivos de rechazo del horario escrito al crear (ninguno si es válido). */
function scheduleReasons(written: [string | undefined, string | undefined][]): string[] {
	const read = readSchedule(written);
	return read.filter((reason): reason is string => typeof reason === 'string');
}

/** §4.1: una relativa en horas no puede tener más de una ventana. */
const relativeReasons = (every: string, unit: string, written: unknown[]) => [
	...(intervalValid(every) ? [] : ['intervalo inválido']),
	...(unit === 'horas' && written.length > 1 ? ['varios horarios en una relativa en horas'] : [])
];

/** Un horario ya guardado: tiene que ser válido, también para el intervalo de una relativa (§4.1). */
function declareSchedule(s: Situation, written: [string, string][]): boolean {
	s.schedule = scheduleValid(written);
	return s.schedule !== undefined && !(s.unit === 'horas' && s.schedule.length > 1);
}

function declareCreated(s: Situation, created: string): boolean {
	const moment = MOMENT(created);
	s.created = moment === undefined ? undefined : new Date(moment);
	return moment !== undefined;
}

/** Horario (§4.1, §5.5), antes que las reglas generales: sus pasos también terminan en texto libre. */
const SCHEDULE_RULES: Rule[] = [
	[new RegExp(`^la tarea se puede completar ${SCHEDULE}$`), (s, hours) => declareSchedule(s, writtenOf(hours))],
	[/^una tarea puntual sin fecha límite creada el (\S+)$/, (s, [c]) => declareOneOff(s) && declareCreated(s, c)],
	[/^una tarea puntual con fecha límite (\S+) creada el (\S+)$/, (s, [l, c]) => declareOneOff(s, l) && declareCreated(s, c)],
	[
		/^una tarea periódica relativa cada (\S+) (\S+) creada el (\S+)$/,
		(s, [n, u, c]) => (Object.assign(s, { every: n, unit: u }), declareCreated(s, c))
	],
	[/^consulto Pendientes el (\S+)$/, (s, [t]) => ((s.now = MOMENT(t)), s.now !== undefined)],
	// El check no cambia el estado ni el checkbox de la tarea (§6.1).
	[/^Mostrar completadas está encendido$/, () => true],
	[
		new RegExp(`^creo una tarea puntual con título (.*) y horario ${SCHEDULE}$`),
		(s, [t, ...hours]) => void (s.creation = { title: t, reasons: scheduleReasons(writtenOf(hours)) })
	],
	[
		new RegExp(`^creo una tarea puntual con un título válido y horario ${SCHEDULE}$`),
		(s, hours) => void (s.creation = { title: 'Tarea', reasons: scheduleReasons(writtenOf(hours)) })
	],
	[
		/^creo una tarea puntual con un título válido y un horario con solo la hora de inicio (\S+)$/,
		(s, [d]) => void (s.creation = { title: 'Tarea', reasons: scheduleReasons([[d, undefined]]) })
	],
	[
		/^creo una tarea puntual con un título válido y un horario con solo la hora de fin (\S+)$/,
		(s, [h]) => void (s.creation = { title: 'Tarea', reasons: scheduleReasons([[undefined, h]]) })
	],
	[
		/^creo una tarea puntual con un título válido, horario de (\S+) a (\S+) y otro horario con solo la hora de inicio (\S+)$/,
		(s, [d, h, d2]) => void (s.creation = { title: 'Tarea', reasons: scheduleReasons([[d, h], [d2, undefined]]) })
	],
	[
		new RegExp(`^creo una tarea periódica relativa con título (.*) cada (\\S+) (\\S+) y horario ${SCHEDULE}$`),
		(s, [t, c, u, ...hours]) => {
			const written = writtenOf(hours);
			// Un error del horario mismo tiene prioridad sobre el de la relativa en horas: con él, el spec no decide cuál se ve.
			const ofSchedule = scheduleReasons(written);
			const ofRelative = relativeReasons(c, u, written);
			if (ofSchedule.length > 0 && ofRelative.includes('varios horarios en una relativa en horas')) return false;
			s.creation = { title: t, reasons: [...ofRelative, ...ofSchedule] };
		}
	],
	[
		new RegExp(`^creo una tarea periódica semanal con título (.*) los (.*) y horario ${SCHEDULE}$`),
		(s, [t, days, ...hours]) => {
			const reasons = reasonsWeek(days);
			return createCalendar(s, t, reasons && [...reasons, ...scheduleReasons(writtenOf(hours))]);
		}
	]
];

const RULES: Rule[] = [
	...SCHEDULE_RULES,
	// Puntual (§4.1 y §5.1).
	[/^una tarea puntual sin fecha límite$/, (s) => declareOneOff(s)],
	[/^una tarea puntual con fecha límite (\S+)$/, (s, [l]) => declareOneOff(s, l)],
	[/^una tarea puntual con una fecha límite cualquiera$/, (s) => void (s.oneOff = { any: true })],
	[/^la tarea tiene (un completado|dos completados)$/, (s, [c]) => hasCompletions(s, c)],
	// Creada con una fecha límite válida y consultada: creadaEn no influye en el estado (§5.1).
	[/^creo el (\S+) una tarea puntual con un título válido y fecha límite (\S+)$/, (s, [, l]) => declareOneOff(s, l)],
	[
		/^creo una tarea puntual con título (.*) y fecha límite (\S+)$/,
		(s, [t, l]) => void (s.creation = { title: t, reasons: reasonsDueDate(l) })
	],
	[
		/^creo una tarea puntual con título (.*), emoji (.*) y nota (.*)$/,
		(s, [t, e]) => void (s.creation = { title: t, reasons: reasonsEmoji(e) })
	],
	[/^creo una tarea puntual con título (.*) y sin fecha límite$/, (s, [t]) => void (s.creation = { title: t, reasons: [] })],
	[
		/^creo una tarea puntual con un título de solo espacios y sin fecha límite$/,
		(s) => void (s.creation = { title: '   ', reasons: [] })
	],
	[
		/^creo una tarea puntual con un título válido y fecha límite (\S+)$/,
		(s, [l]) => void (s.creation = { title: 'Tarea', reasons: reasonsDueDate(l) })
	],
	[/^una tarea periódica relativa cada (\S+) (\S+)$/, (s, [c, u]) => void Object.assign(s, { every: c, unit: u })],
	[/^una tarea periódica relativa nunca completada$/, () => undefined],
	// §4.1 y §5: el primer paso no tiene estado: no cambia el estado de la tarea.
	[/^el primer paso de la tarea es (.*)$/, () => undefined],
	// §4.1 y §5: la versión mínima no tiene estado: no cambia el estado de la tarea.
	[/^la versión mínima de la tarea es (.*)$/, () => undefined],
	[/^la tarea fue completada el (\S+)$/, (s, [t]) => record(s, t)],
	[/^completo la tarea el (\S+)$/, (s, [t]) => complete(s, t)],
	[/^consulto el estado el (\S+)$/, (s, [t]) => ((s.now = MOMENT(t)), s.now !== undefined)],
	[/^consulto el estado en cualquier momento$/, (s) => void (s.anyMoment = true)],
	[
		/^creo una tarea periódica relativa con título (.*) cada (\S+) (\S+)$/,
		(s, [t, c]) => void (s.creation = { title: t, reasons: intervalValid(c) ? [] : ['intervalo inválido'] })
	],
	[
		/^creo una tarea periódica relativa con título (.*) y un intervalo válido$/,
		(s, [t]) => void (s.creation = { title: t, reasons: [] })
	],
	[
		/^creo una tarea periódica relativa con un título de solo espacios y un intervalo válido$/,
		(s) => void (s.creation = { title: '   ', reasons: [] })
	],
	[
		/^creo una tarea periódica relativa con un título válido y (\S+) como cantidad del intervalo$/,
		(s, [c]) =>
			void (s.creation = { title: 'Regar plantas', reasons: intervalValid(c) ? [] : ['intervalo inválido'] })
	],
	// Estado y completado de calendario (§5.3). Con completados, creadaEn no influye.
	[/^una tarea periódica semanal los (.*) creada el (\S+)$/, (s, [d, c]) => declare(s, weekdays(d), c)],
	[/^una tarea periódica mensual los días (.*) creada el (\S+)$/, (s, [d, c]) => declare(s, monthDays(d), c)],
	[/^una tarea periódica semanal los (.*)$/, (s, [d]) => declare(s, weekdays(d))],
	[/^una tarea periódica mensual los días (.*)$/, (s, [d]) => declare(s, monthDays(d))],
	[/^la tarea tiene un completado del (\S+) que cubre el (\S+)$/, (s, [t, c]) => coveredDeclared(s, c, t)],
	[/^la tarea tiene un completado que cubre el (\S+)$/, (s, [c]) => coveredDeclared(s, c)],
	[/^la tarea tiene otro completado más antiguo que cubre la misma ocurrencia$/, () => undefined],
	// §5.8 y §6.2: solo una periódica se pausa (el botón Pausar del panel); Reanudar solo la pausada.
	[/^(?:la tarea fue pausada|pauso la tarea)$/, (s) => !s.oneOff && !s.paused && void (s.paused = true)],
	[/^reanudo la tarea el (\S+)$/, (s, [t]) => resumeSituation(s, t)],
	[/^abro la tarea en el panel de edición$/, (s) => void (s.panel = true)],
	// §5.9 y §6.2: posponer actúa en el momento; quitar borra el campo.
	[/^(?:pospongo la tarea|la tarea fue pospuesta) con la opción (.+) el (\S+)$/, (s, [o, m]) => postponeSituation(s, o, m)],
	[/^quito la posposición$/, (s) => s.postponed !== undefined && void (s.postponed = undefined)],
	[/^abro la tarea en el panel de edición el (\S+)$/, (s, [t]) => ((s.postponePanel = true), (s.now = MOMENT(t)), s.now !== undefined)],
	// Creación de calendario (§4.1 y §4.2).
	[
		/^creo una tarea periódica semanal con título (.*) los (.*)$/,
		(s, [t, d]) => createCalendar(s, t, reasonsWeek(d))
	],
	[
		/^creo una tarea periódica mensual con título (.*) los días (.*)$/,
		(s, [t, d]) => createCalendar(s, t, reasonsMonth(d))
	],
	[/^creo una tarea periódica (?:semanal|mensual) con título (.*) y días válidos$/, (s, [t]) => createCalendar(s, t, [])],
	[
		/^creo una tarea periódica (?:semanal|mensual) con un título de solo espacios y días válidos$/,
		(s) => createCalendar(s, '   ', [])
	],
	[
		/^creo una tarea periódica (?:semanal|mensual) con un título válido y sin días$/,
		(s) => createCalendar(s, 'Tarea', ['falta de días'])
	],
	[
		/^creo una tarea periódica mensual con un título válido los días (.*)$/,
		(s, [d]) => createCalendar(s, 'Tarea', reasonsMonth(d))
	],
	[
		/^creo una tarea periódica de calendario con un título válido y días de la semana y del mes a la vez$/,
		(s) => createCalendar(s, 'Tarea', ['semanal y mensual combinados'])
	]
];

/** Sustituye <columna> por su valor en la fila; undefined si falta. */
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
	const reasons = [...(c.title.trim() === '' ? ['título vacío'] : []), ...c.reasons];
	return reasons.length === 0 ? 'creada' : `rechazada: ${reasons.join(', ')}`;
}

/** Spec §5.1: con completado, fuera de Pendientes; si no, atrasada desde el inicio del día siguiente al límite. */
function classifyOneOff(s: Situation, oneOff: NonNullable<Situation['oneOff']>): string | undefined {
	if (s.completions.length > 0) return 'no aparece en Pendientes';
	if (oneOff.any) return undefined;
	if (oneOff.limit === undefined) return s.anyMoment || s.now !== undefined ? 'pendiente' : undefined;
	if (s.now === undefined) return undefined;
	return s.now >= addDays(oneOff.limit, 1).getTime() ? 'atrasada' : 'pendiente';
}

/** §5.2 y §5.3: progreso = transcurrido / espera; con ahora < U (relojes desfasados) es 0 por regla del spec. */
function progress(from: number, now: number, wait: number): string | undefined {
	if (now < from) return '0';
	if (!(wait > 0)) return undefined;
	return String(Math.min(1, (now - from) / wait));
}

/** El "en espera" de la clasificación, con su progreso solo si el escenario lo observa. */
function inWait(observes: Observes, p: string | undefined): string | undefined {
	if (!observes.progress) return 'en espera';
	return p === undefined ? undefined : `en espera ${p}`;
}

/** Spec §5.2. */
function classifyStatus(s: Situation, observes: Observes): string | undefined {
	if (s.completions.length === 0) return s.anyMoment || s.now !== undefined ? 'pendiente' : undefined;
	if (s.now === undefined) return undefined;
	// Sin intervalo declarado ("el intervalo no influye en este borde"): con ahora ≤ U la tarea está
	// en espera con progreso 0 sea cual sea el intervalo (§5.2: ahora < U → en espera, progreso 0).
	if (s.every === undefined && s.now <= Math.max(...s.completions)) return inWait(observes, '0');
	const interval = intervalMs(s.every, s.unit);
	if (interval === undefined) return undefined;
	const due = Math.max(...s.completions) + interval;
	if (s.now < due) return inWait(observes, progress(Math.max(...s.completions), s.now, interval));
	return s.now < due + interval ? 'pendiente' : 'atrasada';
}

/** Spec §5.3: hoy < N en espera, hoy = N pendiente, hoy > N atrasada; o la ocurrencia que cubrió el completado nuevo. */
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

/** §5.8: la fila pide completar después de reanudar con un momento anterior a reanudadaEn: no es un escenario posible. */
export function isChronologyImpossible(entrySteps: StepOracle[], row: RowOracle): boolean {
	return build(entrySteps, row)?.anachronistic === true;
}

/** Clasificación de la fila según el spec, o undefined si el oráculo no la reconoce. */
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
 * §5.6 y §5.7: N de una de calendario con horario, o de una relativa por ventana; undefined si no se deduce. Los
 * completados de una relativa sin ocurrencia cubierta (sinCubierta) cubren el día entero de su completadoEn.
 */
export function nextWithSchedule(s: Situation, vs: TimeWindow[]): Occurrence | undefined {
	const p = pWithSchedule([...s.covered, ...s.withoutCovered], s.coveredWithHour ?? [], s.created);
	if (s.calendar) return p === undefined ? undefined : calendarNext(s.calendar, vs, p, s.resumed);
	if (s.completions.length === 0) return s.created && firstWithoutClose(vs, s.created.getTime());
	return p === undefined || !intervalValid(s.every) ? undefined : nextByTimeWindow(vs, Number(s.every), p);
}

/** §5.5–§5.7: el momento con horario de la tarea armada; undefined si falta algo que el spec necesita. */
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

/** §5.5: como §5.1–§5.3, con los momentos que corre el horario. Una puntual con completados está completada (§5.1). */
function classifyWithSchedule(s: Situation, vs: TimeWindow[], observes: Observes): string | undefined {
	if (s.oneOff && s.completions.length > 0) return 'no aparece en Pendientes';
	if (s.now === undefined) return undefined;
	const moment = withScheduleOf(s, vs, s.now);
	if (!moment?.wait) return moment?.group;
	const { start, returns } = moment.wait;
	return inWait(observes, progress(start, s.now, returns - start));
}

/** §5.1–§5.7: el estado por la regla de la tarea, sin la posposición. */
export function statusPerItsRule(s: Situation, observes: Observes): string | undefined {
	if (s.schedule) return classifyWithSchedule(s, s.schedule, observes);
	if (s.oneOff) return classifyOneOff(s, s.oneOff);
	return s.calendar ? classifyCalendar(s, s.calendar, observes) : classifyStatus(s, observes);
}

export const postponementActive = ({ postponed, now }: Situation) => (postponed && now !== undefined && now < postponed.to ? postponed : undefined);

export const WITHOUT_PROGRESS: Observes = { progress: false };
const pendingOOverdue = (status: string | undefined) => status === 'pendiente' || status === 'atrasada';

/** §5.9: está en espera por la posposición: con ahora < hasta, estaría pendiente o atrasada por su regla. */
export function inWaitByPostponement(s: Situation): boolean {
	return postponementActive(s) !== undefined && pendingOOverdue(statusPerItsRule(s, WITHOUT_PROGRESS));
}

/** §5.9: progreso = (ahora − desde) / (hasta − desde); con ahora < desde, 0. */
function postponementProgress({ from, to }: Postponement, now: number): string {
	return now < from ? '0' : String((now - from) / (to - from));
}

/** §5.9: si estaría en espera por su propia regla, la posposición no cambia nada. */
function classifyStatusOfSituation(s: Situation, observes: Observes): string | undefined {
	const active = postponementActive(s);
	return active && inWaitByPostponement(s)
		? inWait(observes, postponementProgress(active, s.now as number))
		: statusPerItsRule(s, observes);
}

/**
 * §5.9 y §6.2: con la posposición vigente, Quitar posponer; si no, Posponer solo en una pendiente o atrasada no
 * pausada. undefined si el estado no se deduce.
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

/** §6.2: "Pospuesta hasta HH:MM", con "mañana" si hasta es del día siguiente a ahora; más lejos, el spec no lo decide. */
function postponementText(s: Situation): string | undefined {
	const active = postponementActive(s);
	if (!active) return 'sin texto';
	const to = new Date(active.to);
	const hour = `${twoDigits(to.getHours())}:${twoDigits(to.getMinutes())}`;
	const today = dayStart(s.now as number);
	if (dayStart(active.to).getTime() === today.getTime()) return `Pospuesta hasta ${hour}`;
	return dayStart(active.to).getTime() === addDays(today, 1).getTime() ? `Pospuesta hasta mañana ${hour}` : undefined;
}

/** §6.2: el botón de posponer del panel y, si un Then lo afirma, lo que dice de la posposición. */
function classifyPanelOfPostpone(s: Situation, observes: Observes): string | undefined {
	const button = postponeButton(s);
	if (!button || !observes.panelText) return button;
	const text = postponementText(s);
	return text && `${button}, ${text}`;
}

/** §6.2: Posponer solo actúa si el panel lo ofrece en ese momento. Sin creadaEn, la tarea se creó antes de todo. */
function postponeSituation(s: Situation, option: string, value: string): boolean {
	const postponed = postponementOf(option, value);
	if (!postponed) return false;
	if (s.oneOff && !s.created) s.created = new Date(CREATED_BY_DEFAULT);
	if (postponeButton({ ...s, now: postponed.from }) !== 'Posponer') return false;
	s.postponed = postponed;
	return true;
}

/**
 * §6.1 y §5.5: el checkbox que borraría (puntual completada, o periódica completada cuyo último completado es de hoy
 * o posterior) está habilitado; el que completaría, solo dentro de la ventana del horario.
 */
function checkboxOf(s: Situation, classification: string): string | undefined {
	if (s.now === undefined) return undefined;
	const withCompletions = s.completions.length > 0;
	// §5.9: una pospuesta no está completada.
	const inWaitOwn = classification.startsWith('en espera') && !inWaitByPostponement(s);
	const completed = classification === 'no aparece en Pendientes' || isCompleted(Boolean(s.oneOff), inWaitOwn, withCompletions);
	const wouldDelete = completed && (Boolean(s.oneOff) || Math.max(...s.completions) >= dayStart(s.now).getTime());
	return wouldDelete || !s.schedule || insideOfTimeWindow(s.schedule, s.now) ? 'habilitado' : 'deshabilitado';
}

/** §6.2: el botón de pausa del panel: ninguno en una puntual; Reanudar si está pausada; si no, Pausar. */
function pauseButton(s: Situation): string | undefined {
	if (!intervalDeclaredValid(s)) return undefined;
	if (s.oneOff) return 'no ofrece pausar';
	return s.paused ? 'ofrece Reanudar' : 'ofrece Pausar';
}

/** §5.8: una pausada no tiene estado, no está completada y su checkbox está deshabilitado, sea cual sea ahora. */
function classifyPaused(s: Situation, observes: Observes): string | undefined {
	if (!intervalDeclaredValid(s) || (s.now === undefined && !s.anyMoment)) return undefined;
	if (!observes.checkbox) return 'pausada';
	return observes.onlyCheckbox ? 'checkbox deshabilitado' : 'pausada, checkbox deshabilitado';
}

/** §5.3: con el estado consultado, la ocurrencia que cubrió el completado nuevo, si un Then la afirma. */
function withCovered(s: Situation, observes: Observes, classification: string): string | undefined {
	if (!observes.covered || s.now === undefined) return classification;
	return s.coveredNew && `${classification}, cubre ${isoDay(s.coveredNew)}`;
}

/**
 * Clasificación de una tarea ya armada: puntual (§5.1), relativa (§5.2), de calendario (§5.3), con horario (§5.5),
 * pausada (§5.8), pospuesta (§5.9); o, con el panel abierto, su botón de pausa o de posponer (§6.2); o el valor
 * guardado de `pospuesta` (§4.1), si es lo que un Then afirma.
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

// ---- Spec §6.1: orden de la lista Pendientes ----

export interface OrderTask {
	title: string;
	created: number;
	/** Puntual: su fecha límite (día), si la tiene. */
	limit?: Date;
	oneOff: boolean;
	/** Relativa: intervalo y completados; calendario: recurrencia y ocurrencias cubiertas. */
	interval?: number;
	completions: number[];
	calendar?: Calendar;
	covered: Date[];
	/** §4.4: ocurrencias cubiertas con hora, por su inicio. */
	coveredWithHour?: number[];
	/** Tiene completados cuyo momento el escenario dice que no influye ("la tarea X tiene un completado"). */
	withCompletionWithoutMoment?: boolean;
	/** §5.5: sus ventanas diarias, ordenadas, si tiene horario. */
	schedule?: TimeWindow[];
	/** §5.8: pausada; y el momento de la última reanudación. */
	paused?: boolean;
	resumed?: number;
	/** §4.2: el intervalo escrito no es válido (la tarea no se crea); solo lo miran las reglas de la pausa. */
	intervalInvalid?: boolean;
	/** §5.9: la posposición guardada. */
	postponed?: Postponement;
}

/** Antes de cualquier otra fecha de los escenarios: "se crearon en el mismo instante, anterior a todo". */
const CREATED_BY_DEFAULT = 0;

/** Instante y grupo (0 atrasada, 1 pendiente, 2 en espera) de una tarea, según la tabla de §6.1. */
interface Urgency {
	group: number;
	instant?: number;
	/** §5.9: está en espera por la posposición: no cuenta como completada. */
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
	// Sin intervalo declarado: §4.2 lo hace de al menos 1 hora, así que hasta U + 1 h está en espera (V no se deduce).
	if (t.interval === undefined) return now < u + HOUR_MS ? { group: 2 } : undefined;
	const v = u + t.interval;
	if (now < v) return { group: 2, instant: v };
	return now < v + t.interval ? { group: 1, instant: v } : { group: 0, instant: v + t.interval };
}

function urgencyCalendar(t: OrderTask, calendar: Calendar, now: number): Urgency | undefined {
	// Sin horario, el spec no dice cómo cuenta una ocurrencia cubierta con hora (§5.3 habla de días).
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

/** §5.5: T, el inicio de espera y el atraso sin horario de una relativa del orden; undefined si no se deducen. */
function orderMoments(t: OrderTask): [number, number, number | undefined] | undefined {
	const last = t.completions.length > 0 ? Math.max(...t.completions) : undefined;
	if (last === undefined) return [t.created, t.created, undefined];
	return t.interval === undefined ? undefined : [last + t.interval, last, last + 2 * t.interval];
}

/**
 * §5.5–§5.6: una periódica del orden con horario. De calendario, según N (§5.6; el inicio de espera solo da el
 * progreso: no ordena). Una relativa con varias ventanas (§5.7) no se modela en el orden.
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

/** §5.5 y §6.1: con horario, el grupo y el instante que lo ordena. */
function urgencyWithSchedule(t: OrderTask, vs: TimeWindow[], now: number): Urgency | undefined {
	const withSchedule = t.oneOff ? oneOffWithSchedule(vs, t.created, t.limit, now) : orderRecurring(t, vs, now);
	return withSchedule && { group: GROUP_OF[withSchedule.group], instant: withSchedule.instant };
}

function urgencyPerItsRule(t: OrderTask, now: number): Urgency | undefined {
	if (t.schedule) return urgencyWithSchedule(t, t.schedule, now);
	if (t.oneOff) return urgencyOneOff(t, now);
	return t.calendar ? urgencyCalendar(t, t.calendar, now) : urgencyRelative(t, now);
}

/** §5.9 y §6.1: la pospuesta que estaría pendiente o atrasada va en espera, y su clave de orden es hasta. */
function urgencyOf(t: OrderTask, now: number): Urgency | undefined {
	const own = urgencyPerItsRule(t, now);
	if (!own || own.group === 2 || !t.postponed || now >= t.postponed.to) return own;
	return { group: 2, instant: t.postponed.to, byPostponement: true };
}

/** §6.2: Posponer solo actúa si el panel lo ofrece en ese momento: pendiente o atrasada, no pausada ni pospuesta. */
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
	// §4.1 y §6.1: el primer paso no cambia el orden de la lista; la tarea tiene que existir.
	[/^el primer paso de la tarea (\S+) es (.*)$/, (ts, [t]) => withTitle(ts, t) !== undefined],
	// §4.1 y §6.1: la versión mínima no cambia el orden de la lista; la tarea tiene que existir.
	[/^la versión mínima de la tarea (\S+) es (.*)$/, (ts, [t]) => withTitle(ts, t) !== undefined],
	[
		/^la tarea (\S+) fue pospuesta con la opción (.+) el (\S+)$/,
		(ts, [t, o, m]) => {
			const task = withTitle(ts, t);
			const postponed = postponementOf(o, m);
			return task !== undefined && postponed !== undefined && orderPostpone(task, postponed);
		}
	],
	// §5.8: solo una periódica se pausa; Reanudar solo la pausada.
	[
		/^(?:la tarea (\S+) fue pausada|pauso la tarea (\S+))$/,
		(ts, [was, pause]) => {
			const task = withTitle(ts, was ?? pause);
			if (!task || task.oneOff || task.paused || task.intervalInvalid) return false;
			task.paused = true;
			return true;
		}
	],
	[
		/^reanudo la tarea (\S+) el (\S+)$/,
		(ts, [t, m]) => {
			const task = withTitle(ts, t);
			const moment = MOMENT(m);
			if (!task?.paused || task.intervalInvalid || moment === undefined) return false;
			Object.assign(task, { paused: false, resumed: moment });
			return true;
		}
	],
	[
		new RegExp(`^la tarea (\\S+) se puede completar ${SCHEDULE}$`),
		(ts, [t, ...hours]) => {
			const task = withTitle(ts, t);
			const schedule = scheduleValid(writtenOf(hours));
			if (task) task.schedule = schedule;
			return task !== undefined && schedule !== undefined;
		}
	],
	[
		/^una tarea puntual (\S+) con fecha límite (\S+?)(?: creada el (\S+))?$/,
		(ts, [t, l, c]) => day(l) !== undefined && add(ts, fresh(t, c, { oneOff: true, limit: day(l) }))
	],
	[/^una tarea puntual (\S+) sin fecha límite(?: creada el (\S+))?$/, (ts, [t, c]) => add(ts, fresh(t, c, { oneOff: true }))],
	[
		/^una tarea periódica relativa (\S+) cada (\S+) (\S+)(?: creada el (\S+))?$/,
		(ts, [t, n, u, c]) =>
			add(ts, fresh(t, c, { interval: intervalMs(n, u), ...(intervalMs(n, u) === undefined && { intervalInvalid: true }) }))
	],
	[/^una tarea periódica relativa (\S+) nunca completada(?: creada el (\S+))?$/, (ts, [t, c]) => add(ts, fresh(t, c, {}))],
	[
		/^una tarea periódica semanal (\S+) los (.*?)(?: creada el (\S+))?$/,
		(ts, [t, d, c]) => weekdays(d) !== undefined && add(ts, fresh(t, c, { calendar: weekdays(d) }))
	],
	[
		/^una tarea periódica mensual (\S+) los días (.*?)(?: creada el (\S+))?$/,
		(ts, [t, d, c]) => monthDays(d) !== undefined && add(ts, fresh(t, c, { calendar: monthDays(d) }))
	],
	// De calendario, el oráculo del orden no calcula la ocurrencia que cubre (§5.3): no lo modela.
	[
		// §4.4 y §6.1: un completado de la mínima cuenta como cualquier otro para la lista.
		/^(?:la tarea (\S+) fue completada|completo la tarea (\S+)) el (\S+)(?: con la mínima)?$/,
		(ts, [was, complete, m]) => {
			const moment = MOMENT(m);
			const task = withTitle(ts, was ?? complete);
			if (!task || task.calendar || moment === undefined) return false;
			task.completions.push(moment);
			return true;
		}
	],
	[
		/^la tarea (\S+) tiene un completado que cubre el (\S+)$/,
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
		/^la tarea (\S+) tiene un completado del (\S+) que cubre el (\S+)$/,
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
		/^la tarea (\S+) tiene (?:un completado|dos completados)$/,
		(ts, [t]) => {
			const task = withTitle(ts, t);
			if (!task?.oneOff) return false;
			task.withCompletionWithoutMoment = true;
			return true;
		}
	]
];

/** Pendientes como se ve: los títulos de arriba hacia abajo y, de ellos, los que se ven completados y pausados. */
export interface PendingView {
	order: string;
	completedList: string;
	paused: string;
}

/**
 * §6.1: Pendientes, con los títulos separados por ", ". Solo se modela la consulta en un momento dado (el
 * estado de cada tarea depende de "ahora"), o en cualquier momento cuando todas las tareas son puntuales sin
 * fecha límite. undefined si el oráculo no reconoce el escenario.
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
		const query = /^consulto Pendientes el (\S+)$/.exec(text);
		if (query) now = nowOf(query[1]);
		else if (text === 'consulto Pendientes en cualquier momento') anyMoment = true;
		else if (text === SHOW_COMPLETED) showCompleted = true;
		else if (text === SHOW_PAUSED) showPaused = true;
		else {
			const rule = ORDER_RULES.map(([pattern, apply]) => ({ c: pattern.exec(text), apply })).find((r) => r.c);
			if (!rule?.c || !rule.apply(tasks, rule.c.slice(1))) return undefined;
		}
	}
	// Una pausada no depende de ahora: va al final, por título (§6.1).
	if (anyMoment && tasks.some((t) => !t.paused && (!t.oneOff || t.limit))) return undefined;
	if (!anyMoment && now === undefined) return undefined;
	return pendingView(tasks, now, showCompleted, showPaused);
}

/** El paso que enciende el check "Mostrar completadas" (§6.1); sin él, está apagado. */
export const SHOW_COMPLETED = 'Mostrar completadas está encendido';

/** El paso que enciende el check "Mostrar pausadas" (§6.1); sin él, está apagado. */
export const SHOW_PAUSED = 'Mostrar pausadas está encendido';

/**
 * §5.8: una reanudada se evalúa como recién creada en reanudadaEn (creadaEn = reanudadaEn, sin los completados
 * anteriores); el desempate de §6.1 sigue con el creadaEn real. undefined si tiene ocurrencias cubiertas: el
 * oráculo no sabe cuáles son anteriores.
 */
function evaluated(t: OrderTask): OrderTask | undefined {
	const from = t.resumed;
	if (from === undefined) return t;
	if (t.withCompletionWithoutMoment || t.covered.length > 0 || (t.coveredWithHour ?? []).length > 0) return undefined;
	return { ...t, created: from, completions: t.completions.filter((c) => c >= from) };
}

/** §6.1: las pausadas por título en español; undefined si dos empatan (el id no es observable). */
function pausedByTitle(paused: OrderTask[]): OrderTask[] | undefined {
	const sorted = [...paused].sort((a, b) => COLLATION.compare(a.title, b.title));
	return sorted.some((t, i) => i > 0 && COLLATION.compare(sorted[i - 1].title, t.title) === 0) ? undefined : sorted;
}

const withCompletions = (t: OrderTask) => t.completions.length > 0 || t.covered.length > 0 || t.withCompletionWithoutMoment === true;

/** §6.1: completada es una puntual con al menos un completado, o una periódica en espera con al menos uno. */
export function isCompleted(oneOff: boolean, inWait: boolean, completions: boolean): boolean {
	return completions && (oneOff || inWait);
}

/** El desempate de §6.1: creadaEn más antigua, después título en español (el id no es observable). */
const tiebreak = (a: OrderTask, b: OrderTask) => a.created - b.created || COLLATION.compare(a.title, b.title);

/** Las no completadas por urgencia (§6.1); undefined si alguna urgencia no se deduce. */
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

/** Las completadas, de completadoEn más reciente a más antiguo (§6.1); undefined si hay que ordenar alguna sin momento. */
function completedByRecent(completedList: OrderTask[]): OrderTask[] | undefined {
	if (completedList.length > 1 && completedList.some((t) => t.completions.length === 0 || t.withCompletionWithoutMoment)) return undefined;
	const last = (t: OrderTask) => Math.max(...t.completions);
	return [...completedList].sort((a, b) => last(b) - last(a) || tiebreak(a, b));
}

/**
 * §6.1 con "ahora" (o, sin él, en un momento cualquiera): primero las no completadas por urgencia; las
 * completadas, solo con Mostrar completadas encendido; al final las pausadas (§5.8), solo con Mostrar pausadas
 * encendido. undefined si algo no se deduce.
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

/** Los títulos de Pendientes en el orden de §6.1; undefined si algo no se deduce. */
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
 * Lo que §6 asegura que Atkinson tiene: español, cifras, `#`, `*`, `©`, `®`, `™`, y los signos de un título.
 * El resto del latín no lo decide el spec: es indeciso, no se filtra.
 */
const THAT_HAS_ATKINSON = /^[a-zñáéíóúüA-ZÑÁÉÍÓÚÜ0-9#*©®™ ,.;:¿?¡!()'"/-]$/u;
/** §6: "otro alfabeto en un título": alfabetos que una fuente latina no trae. */
const OTHER_ALPHABET = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Devanagari}\p{Script=Thai}]$/u;
/** Lo que compone un emoji sin ser uno (§4.1): marca de emoji, ZWJ, keycap y etiquetas de subdivisión. */
const COMPOSITION = /[️‍⃣\u{E0020}-\u{E007F}]/gu;

/**
 * La fila de la tabla para un grafema. Sin marca, lo que Atkinson tiene va primero (cifras y `©` también
 * existen como emoji). Noto tiene todo emoji asignado (también `❤`, sin marca, que Atkinson no tiene); un
 * pictograma todavía sin asignar es de una versión de Unicode más nueva y Noto no lo tiene.
 */
function graphemeFont(grapheme: string): string | undefined {
	if (THAT_HAS_ATKINSON.test(grapheme)) return ATKINSON;
	if (OTHER_ALPHABET.test(grapheme)) return SYSTEM;
	const parts = [...grapheme.replace(COMPOSITION, '')];
	if (parts.length === 0) return undefined;
	if (parts.every((part) => /^\p{Emoji}$/u.test(part))) return NOTO;
	return parts.every((part) => /^\p{Extended_Pictographic}$/u.test(part)) ? DEVICE : undefined;
}

/** Las fuentes distintas de un texto, en orden de aparición; undefined si algún grafema es indeciso o no hay ninguno. */
function fontsOf(text: string): string[] | undefined {
	const graphemes = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(({ segment }) => segment);
	const fonts = graphemes.map(graphemeFont);
	if (fonts.length === 0 || fonts.includes(undefined)) return undefined;
	return [...new Set(fonts as string[])];
}

export const isScenarioOfFont = (texts: string[]) => texts.some((text) => /^el texto se dibuja con /.test(text));

/** Lo que observa y lo que afirma "el texto se dibuja con": undefined si el oráculo no reconoce el escenario. */
export function observeFont(entries: StepOracle[], thens: StepOracle[], row: RowOracle): { observed: string[]; asserted: string[] } | undefined {
	if (entries.length !== 1 || thens.length !== 1) return undefined;
	const text = /^el texto (.*)$/su.exec(resolve(entries[0].text, row) ?? '')?.[1];
	const font = /^el texto se dibuja con (.*)$/su.exec(resolve(thens[0].text, row) ?? '')?.[1];
	const observed = text === undefined ? undefined : fontsOf(text);
	return observed === undefined || font === undefined ? undefined : { observed, asserted: [font] };
}
