// Oracle for the date text of the Pending row («Tocaba …», «Vuelve …») and for the return of the
// complete notice (spec §6.1 «Fecha y distancia», §5.4), written from the spec. It does NOT import the core or the step
// handlers: it is a second implementation, so the implementation does not judge its own tests. What the
// spec does not decide returns undefined: not filtered.
import {
	build,
	classifySituation,
	withScheduleOf,
	WEEKDAYS,
	availableAndClosing,
	elements,
	inWaitByPostponement,
	statusPerItsRule,
	date,
	dayStart,
	intervalMs,
	pendingOrder,
	byTimeWindow,
	postponementActive,
	firstLater,
	nextWithSchedule,
	resolve,
	WITHOUT_PROGRESS,
	lastCovered,
	type RowOracle,
	type StepOracle,
	type Situation
} from './oracle';
import { noticeSees } from './oracle-history';

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const MINUTES_BY_HOUR = 60;
const DAY_MS = 86_400_000;

/** What is observed when the row (or the notice) carries no text. */
export const WITHOUT_TEXT = 'sin texto';

const twoDigits = (n: number) => String(n).padStart(2, '0');
const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

/** Local days of `instante` relative to `ahora` (negative: past). */
const daysLocalFrom = (instant: number, now: number) =>
	Math.round((dayStart(instant).getTime() - dayStart(now).getTime()) / DAY_MS);

/** §6.1 Date: «hoy»/«ayer»/«mañana» or «el martes 10 [de <mes>][ de <año>]», with the time if it is not 00:00. */
function dateOf(instant: number, now: number): string | undefined {
	const d = new Date(instant);
	const n = new Date(now);
	const days = daysLocalFrom(instant, now);
	const word = { [-1]: 'ayer', 0: 'hoy', 1: 'mañana' }[days];
	// The spec does not say what happens with another year and the same month: not decided.
	if (word === undefined && d.getFullYear() !== n.getFullYear() && d.getMonth() === n.getMonth()) return undefined;
	const month = d.getMonth() === n.getMonth() ? '' : ` de ${MONTHS[d.getMonth()]}`;
	const year = d.getFullYear() === n.getFullYear() ? '' : ` de ${d.getFullYear()}`;
	const day = word ?? `el ${WEEKDAYS[d.getDay()]} ${d.getDate()}${month}${year}`;
	const withHour = d.getHours() !== 0 || d.getMinutes() !== 0;
	return withHour ? `${day} ${twoDigits(d.getHours())}:${twoDigits(d.getMinutes())}` : day;
}

/** §6.1 Distance in hours or minutes (date of today, yesterday or tomorrow with a time): past rounds down, future rounds up. */
function distanceShort(instant: number, now: number): string | undefined {
	const difference = instant - now;
	if (difference >= 0) {
		// The future is first rounded up to whole minutes: 60 minutes is no longer «menos de una hora».
		const minutes = Math.ceil(difference / MINUTE_MS);
		return minutes < MINUTES_BY_HOUR ? `en ${plural(minutes, 'minuto')}` : `en ${plural(Math.ceil(difference / HOUR_MS), 'hora')}`;
	}
	const past = -difference;
	if (past >= HOUR_MS) return `hace ${plural(Math.floor(past / HOUR_MS), 'hora')}`;
	// §6.1: less than a minute in the past the distance is «ahora», not «hace 0 minutos».
	return past >= MINUTE_MS ? `hace ${plural(Math.floor(past / MINUTE_MS), 'minuto')}` : 'ahora';
}

/** §6.1 Phrase: «<Tocaba|Vuelve> <fecha>[ · <distancia>]». */
export function datePhrase(word: 'Tocaba' | 'Vuelve', instant: number, now: number): string | undefined {
	const dateWritten = dateOf(instant, now);
	if (dateWritten === undefined) return undefined;
	const days = daysLocalFrom(instant, now);
	if (Math.abs(days) >= 2) return `${word} ${dateWritten} · ${days < 0 ? `hace ${-days} días` : `en ${days} días`}`;
	const withHour = dateWritten.includes(':');
	if (!withHour) return `${word} ${dateWritten}`;
	const distance = distanceShort(instant, now);
	return distance && `${word} ${dateWritten} · ${distance}`;
}

/** V: when a relative task without a schedule comes back, the last completion plus its interval. */
function dueRelative(s: Situation): number | undefined {
	const interval = intervalMs(s.every, s.unit);
	return interval === undefined || s.completions.length === 0 ? undefined : Math.max(...s.completions) + interval;
}

/** 00:00 of N, the calendar occurrence without a schedule (§5.3). */
function nStart(s: Situation): number | undefined {
	const p = lastCovered(s);
	return p && s.calendar && firstLater(s.calendar, p)?.getTime();
}

/** §6.1 «Vuelve» instant by the task's own rule (§5.2, §5.3, §5.5). */
function returnsOfItsRule(s: Situation, now: number): number | undefined {
	if (s.schedule) return withScheduleOf(s, s.schedule, now)?.wait?.returns;
	return s.calendar ? nStart(s) : dueRelative(s);
}

/** §6.1 «Vuelve» instant: that of its rule and, with an active postponement, the later of the two causes (§5.9). */
function returns(s: Situation, now: number): number | undefined {
	const to = postponementActive(s)?.to;
	const own = statusPerItsRule(s, WITHOUT_PROGRESS) === 'en espera' ? returnsOfItsRule(s, now) : undefined;
	if (to !== undefined && inWaitByPostponement(s)) return to;
	if (to !== undefined) return own === undefined ? undefined : Math.max(own, to);
	return own;
}

/** §6.1 «Tocaba» instant of a recurring task with a schedule (§5.5, §5.6, §5.7): A, the start of N, or V if A did not arrive. */
function wasDueWithSchedule(s: Situation, now: number): number | undefined {
	const vs = s.schedule;
	if (!vs) return undefined;
	if (s.calendar || byTimeWindow(s.unit, vs)) return nextWithSchedule(s, vs)?.opens;
	const t = s.completions.length > 0 ? dueRelative(s) : s.created?.getTime();
	if (t === undefined) return undefined;
	const a = availableAndClosing(vs, t).a;
	return now >= a ? a : t;
}

/** §6.1 «Tocaba» instant, by kind; never a future instant. */
function wasDue(s: Situation, now: number): number | undefined {
	if (s.oneOff) return s.oneOff.limit?.getTime();
	if (s.schedule) return wasDueWithSchedule(s, now);
	return s.calendar ? nStart(s) : dueRelative(s);
}

/** The row's date text (§6.1) of the task built at `ahora`; SIN_TEXTO if it carries none; undefined if not decided. */
export function rowText(s: Situation): string | undefined {
	const now = s.now;
	if (now === undefined || s.oneOff?.any) return undefined;
	if (s.paused) return WITHOUT_TEXT;
	const postponement = postponementActive(s) !== undefined && inWaitByPostponement(s);
	const status = postponement ? 'en espera' : statusPerItsRule(s, WITHOUT_PROGRESS);
	if (status === 'atrasada') {
		const instant = wasDue(s, now);
		return instant === undefined ? undefined : datePhrase('Tocaba', instant, now);
	}
	if (status === 'en espera') {
		const instant = returns(s, now);
		return instant === undefined ? undefined : datePhrase('Vuelve', instant, now);
	}
	return status === 'pendiente' || status === 'no aparece en Pendientes' ? WITHOUT_TEXT : undefined;
}

/** §5.4 and §6.1: the return of the notice queried at `ahora`: the «Vuelve …» of a recurring task, nothing for a one-off. */
export function returnOfNoticeOf(s: Situation, now: number): string | undefined {
	if (s.oneOff) return s.oneOff.any ? undefined : WITHOUT_TEXT;
	const instant = returns({ ...s, now }, now);
	return instant === undefined ? undefined : datePhrase('Vuelve', instant, now);
}

const ROW_THEN = /^the task row (?:shows the text (.*)|shows no date text)$/su;
const THEN_OF_ROW_OF_TITLE = /^the row of ([A-ZÁÉÍÓÚÑ]\w*) shows the text (.*)$/su;
const THEN_OF_FIRST_STEP = /^the task row (?:shows the first step (.*)|shows no first step)$/su;
const FIRST_STEP_SAVED = /^the first step of the task is (.*)$/su;
const CHECKBOX_THEN = /^the task checkbox is (enabled|disabled)$/;
/** Steps that the editing oracle models better (the tapped checkbox, the deleted completion): that oracle decides. */
const EDITING_STEP = /^(?:I tap the task checkbox |I delete the completion from )/;
const ORDER_THEN = /^Pendientes shows in order (.*)$/su;
const NOTICE_THEN = /^the completion notice (?:shows the return (.*)|shows no return)$/su;
const NOTICE_QUERY = /^I query the notice on (\S+)$/;
const DECLARES_TASK = /^a (?:one-off|relative recurring|weekly recurring|monthly recurring) task /;
const TITLE_IN_STEP = /\b((?:one-off |(?:relative|weekly|monthly) recurring )?task) ([A-ZÁÉÍÓÚÑ]\w*)\b/u;
const stepTitle = (text: string) => TITLE_IN_STEP.exec(text)?.[2];

/** The task's steps (§4.1, Pasos) are modeled by the editing oracle, which tracks progress and completions. */
const STEPS_STEP = /^(?:the steps of the task |the current step of the task is |I tap Hecho |I tap Paso anterior$|I clear step |the task row (?:shows the buttons |shows no step buttons$)|the Hecho button of the task is )/;

/** The minimal version (§4.1, §6.1) and its button are modeled by the editing oracle, which tracks completions and the notice. */
const MINIMAL_STEP = /^(?:the minimal version of the task |I tap Hice la mínima |the task row (?:shows the minimal one |shows no minimal one$)|the Hice la mínima button )/;

export const isScenarioOfTextOfDate = (texts: string[]) =>
	!texts.some((text) => STEPS_STEP.test(text) || MINIMAL_STEP.test(text)) &&
	!(texts.some((text) => THEN_OF_FIRST_STEP.test(text)) && texts.some((text) => EDITING_STEP.test(text))) &&
	texts.some((text) => ROW_THEN.test(text) || THEN_OF_FIRST_STEP.test(text) || THEN_OF_ROW_OF_TITLE.test(text) || NOTICE_THEN.test(text));

/**
 * The steps of task `titulo`: those that name it and those that name none (the query, the checks). With a
 * single task the title decides nothing and is removed; with more than one it is needed to know which one is meant.
 */
function taskSteps(texts: string[], title: string | undefined): StepOracle[] | undefined {
	const titles = new Set(texts.filter((text) => DECLARES_TASK.test(text)).map(stepTitle));
	if (titles.size > 1 && (title === undefined || !titles.has(title))) return undefined;
	return texts
		.filter((text) => titles.size <= 1 || stepTitle(text) === undefined || stepTitle(text) === title)
		.map((text) => ({ text: text.replace(TITLE_IN_STEP, '$1') }));
}

/** Task `titulo` built with the input steps, and the moment the notice is queried, if any. */
function situationOf(entries: StepOracle[], row: RowOracle, title?: string): { s: Situation; noticeNow?: number } | undefined {
	const resolved = entries.map(({ text }) => resolve(text, row));
	if (resolved.includes(undefined)) return undefined;
	const steps = taskSteps(resolved as string[], title);
	if (!steps) return undefined;
	const texts = steps.map(({ text }) => text);
	const query = texts.map((text) => NOTICE_QUERY.exec(text)?.[1]).find((m) => m !== undefined);
	const remaining = texts.filter((text) => !NOTICE_QUERY.test(text) && text !== 'Mostrar pausadas is on');
	const s = build(remaining.map((text) => ({ text })), {});
	const noticeNow = query === undefined ? undefined : date(query);
	return s && (query === undefined || noticeNow !== undefined) ? { s, noticeNow } : undefined;
}

/**
 * §6.1: the row shows «Primer paso: » and the trimmed text only if the task has a first step and is pending or
 * overdue; waiting (also postponed or completed) or paused does not show it. It is decided with the state at that moment.
 */
function firstStepOfRow(s: Situation, saved: string | undefined): string | undefined {
	const now = s.now;
	if (now === undefined || s.oneOff?.any) return undefined;
	const firstStep = saved?.trim();
	if (s.paused || !firstStep) return WITHOUT_TEXT;
	const status = postponementActive(s) !== undefined && inWaitByPostponement(s) ? 'en espera' : statusPerItsRule(s, WITHOUT_PROGRESS);
	if (status === 'pendiente' || status === 'atrasada') return `Primer paso: ${firstStep}`;
	return status === 'en espera' || status === 'no aparece en Pendientes' ? WITHOUT_TEXT : undefined;
}

/** The first step the scenario leaves stored; the last step that declares it. */
function firstStepDeclared(entries: StepOracle[], row: RowOracle): string | undefined {
	const texts = entries.map(({ text }) => resolve(text, row) ?? '');
	return texts.map((text) => FIRST_STEP_SAVED.exec(text)?.[1]).filter((value) => value !== undefined).at(-1);
}

/** The notice is visible between the completion and 5 s later (§5.4); outside that, there is no notice to query. */
function returnVisible(s: Situation, now: number | undefined): string | undefined {
	if (now === undefined || s.completions.length === 0) return undefined;
	return noticeSees(Math.max(...s.completions), now) ? returnOfNoticeOf(s, now) : 'sin aviso';
}

/** §6.1: what the oracle observes in a Then of the list or the notice, with what the Then asserts; undefined if not decided. */
function observeThen(entries: StepOracle[], text: string, row: RowOracle): { seen: string | undefined; written: string } {
	const order = ORDER_THEN.exec(text);
	const ofCheckbox = CHECKBOX_THEN.exec(text);
	if (ofCheckbox) {
		const situation = situationOf(entries, row);
		const seen = situation && classifySituation(situation.s, { progress: false, checkbox: true, onlyCheckbox: true });
		return { seen: seen?.replace('checkbox ', ''), written: ofCheckbox[1] };
	}
	if (order) return { seen: pendingOrder(entries, row)?.order, written: elements(order[1])?.join(', ') ?? order[1] };
	const ofTitle = THEN_OF_ROW_OF_TITLE.exec(text);
	const ofRow = ofTitle ?? ROW_THEN.exec(text);
	const ofNotice = NOTICE_THEN.exec(text);
	const ofFirstStep = THEN_OF_FIRST_STEP.exec(text);
	const situation = situationOf(entries, row, ofTitle?.[1]);
	const written = (ofTitle ? ofTitle[2] : (ofRow ?? ofNotice ?? ofFirstStep)?.[1]) ?? WITHOUT_TEXT;
	if (!situation) return { seen: undefined, written };
	if (ofFirstStep) return { seen: firstStepOfRow(situation.s, firstStepDeclared(entries, row)), written };
	const seen = ofRow ? rowText(situation.s) : ofNotice ? returnVisible(situation.s, situation.noticeNow) : undefined;
	return { seen, written };
}

/** What the oracle observes and what each Then asserts; undefined if something is not recognized or not decided. */
export function observeTextOfDate(entries: StepOracle[], thens: StepOracle[], row: RowOracle): { observed: string[]; asserted: string[] } | undefined {
	if (thens.length === 0) return undefined;
	const observed: string[] = [];
	const asserted: string[] = [];
	for (const step of thens) {
		const text = resolve(step.text, row);
		if (text === undefined) return undefined;
		const { seen, written } = observeThen(entries, text, row);
		if (seen === undefined) return undefined;
		observed.push(seen);
		asserted.push(written);
	}
	return { observed, asserted };
}
