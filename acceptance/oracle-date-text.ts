// Oráculo del texto de fecha de la fila de Pendientes («Tocaba …», «Vuelve …») y del regreso del aviso de
// completar (spec §6.1 «Fecha y distancia», §5.4), escrito desde el spec. NO importa el core ni los step
// handlers: es una segunda implementación, así que la implementación no juzga a sus propios tests. Lo que el
// spec no decide devuelve undefined: no se filtra.
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

/** Lo que se observa cuando la fila (o el aviso) no lleva texto. */
export const WITHOUT_TEXT = 'sin texto';

const twoDigits = (n: number) => String(n).padStart(2, '0');
const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

/** Días locales de `instante` respecto de `ahora` (negativo: pasado). */
const daysLocalFrom = (instant: number, now: number) =>
	Math.round((dayStart(instant).getTime() - dayStart(now).getTime()) / DAY_MS);

/** §6.1 Fecha: «hoy»/«ayer»/«mañana» o «el martes 10 [de <mes>][ de <año>]», con la hora si no son las 00:00. */
function dateOf(instant: number, now: number): string | undefined {
	const d = new Date(instant);
	const n = new Date(now);
	const days = daysLocalFrom(instant, now);
	const word = { [-1]: 'ayer', 0: 'hoy', 1: 'mañana' }[days];
	// El spec no dice qué pasa con otro año y el mismo mes: no se decide.
	if (word === undefined && d.getFullYear() !== n.getFullYear() && d.getMonth() === n.getMonth()) return undefined;
	const month = d.getMonth() === n.getMonth() ? '' : ` de ${MONTHS[d.getMonth()]}`;
	const year = d.getFullYear() === n.getFullYear() ? '' : ` de ${d.getFullYear()}`;
	const day = word ?? `el ${WEEKDAYS[d.getDay()]} ${d.getDate()}${month}${year}`;
	const withHour = d.getHours() !== 0 || d.getMinutes() !== 0;
	return withHour ? `${day} ${twoDigits(d.getHours())}:${twoDigits(d.getMinutes())}` : day;
}

/** §6.1 Distancia en horas o minutos (fecha de hoy, ayer o mañana con hora): pasado hacia abajo, futuro hacia arriba. */
function distanceShort(instant: number, now: number): string | undefined {
	const difference = instant - now;
	if (difference >= 0) {
		// Lo futuro se redondea hacia arriba a minutos enteros primero: 60 minutos ya no son «menos de una hora».
		const minutes = Math.ceil(difference / MINUTE_MS);
		return minutes < MINUTES_BY_HOUR ? `en ${plural(minutes, 'minuto')}` : `en ${plural(Math.ceil(difference / HOUR_MS), 'hora')}`;
	}
	const past = -difference;
	if (past >= HOUR_MS) return `hace ${plural(Math.floor(past / HOUR_MS), 'hora')}`;
	// §6.1: a menos de un minuto en el pasado la distancia es «ahora», no «hace 0 minutos».
	return past >= MINUTE_MS ? `hace ${plural(Math.floor(past / MINUTE_MS), 'minuto')}` : 'ahora';
}

/** §6.1 Frase: «<Tocaba|Vuelve> <fecha>[ · <distancia>]». */
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

/** V: cuándo vuelve una relativa sin horario, el último completado más su intervalo. */
function dueRelative(s: Situation): number | undefined {
	const interval = intervalMs(s.every, s.unit);
	return interval === undefined || s.completions.length === 0 ? undefined : Math.max(...s.completions) + interval;
}

/** El 00:00 de N, la ocurrencia de calendario sin horario (§5.3). */
function nStart(s: Situation): number | undefined {
	const p = lastCovered(s);
	return p && s.calendar && firstLater(s.calendar, p)?.getTime();
}

/** §6.1 Instante de «Vuelve» por la regla propia de la tarea (§5.2, §5.3, §5.5). */
function returnsOfItsRule(s: Situation, now: number): number | undefined {
	if (s.schedule) return withScheduleOf(s, s.schedule, now)?.wait?.returns;
	return s.calendar ? nStart(s) : dueRelative(s);
}

/** §6.1 Instante de «Vuelve»: el de su regla y, con posposición vigente, el más tarde de las dos causas (§5.9). */
function returns(s: Situation, now: number): number | undefined {
	const to = postponementActive(s)?.to;
	const own = statusPerItsRule(s, WITHOUT_PROGRESS) === 'en espera' ? returnsOfItsRule(s, now) : undefined;
	if (to !== undefined && inWaitByPostponement(s)) return to;
	if (to !== undefined) return own === undefined ? undefined : Math.max(own, to);
	return own;
}

/** §6.1 Instante de «Tocaba» de una periódica con horario (§5.5, §5.6, §5.7): A, el inicio de N, o V si A no llegó. */
function wasDueWithSchedule(s: Situation, now: number): number | undefined {
	const vs = s.schedule;
	if (!vs) return undefined;
	if (s.calendar || byTimeWindow(s.unit, vs)) return nextWithSchedule(s, vs)?.opens;
	const t = s.completions.length > 0 ? dueRelative(s) : s.created?.getTime();
	if (t === undefined) return undefined;
	const a = availableAndClosing(vs, t).a;
	return now >= a ? a : t;
}

/** §6.1 Instante de «Tocaba», por tipo; nunca es un instante futuro. */
function wasDue(s: Situation, now: number): number | undefined {
	if (s.oneOff) return s.oneOff.limit?.getTime();
	if (s.schedule) return wasDueWithSchedule(s, now);
	return s.calendar ? nStart(s) : dueRelative(s);
}

/** El texto de fecha de la fila (§6.1) de la tarea armada a `ahora`; SIN_TEXTO si no lleva; undefined si no se decide. */
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

/** §5.4 y §6.1: el regreso del aviso consultado a `ahora`: el «Vuelve …» de una periódica, nada en una puntual. */
export function returnOfNoticeOf(s: Situation, now: number): string | undefined {
	if (s.oneOff) return s.oneOff.any ? undefined : WITHOUT_TEXT;
	const instant = returns({ ...s, now }, now);
	return instant === undefined ? undefined : datePhrase('Vuelve', instant, now);
}

const ROW_THEN = /^la fila de la tarea (?:muestra el texto (.*)|no muestra texto de fecha)$/su;
const THEN_OF_ROW_OF_TITLE = /^la fila de ([A-ZÁÉÍÓÚÑ]\w*) muestra el texto (.*)$/su;
const THEN_OF_FIRST_STEP = /^la fila de la tarea (?:muestra el primer paso (.*)|no muestra primer paso)$/su;
const FIRST_STEP_SAVED = /^el primer paso de la tarea es (.*)$/su;
const CHECKBOX_THEN = /^el checkbox de la tarea está (habilitado|deshabilitado)$/;
/** Pasos que el oráculo de edición modela mejor (el checkbox tocado, el completado borrado): lo decide ese oráculo. */
const EDITING_STEP = /^(?:toco el checkbox de la tarea |borro el completado del )/;
const ORDER_THEN = /^Pendientes muestra en orden (.*)$/su;
const NOTICE_THEN = /^el aviso del completado (?:muestra el regreso (.*)|no muestra regreso)$/su;
const NOTICE_QUERY = /^consulto el aviso el (\S+)$/;
const DECLARES_TASK = /^una tarea /;
const TITLE_IN_STEP = /\b(tarea(?: puntual| periódica (?:relativa|semanal|mensual))?) ([A-ZÁÉÍÓÚÑ]\w*)\b/u;
const stepTitle = (text: string) => TITLE_IN_STEP.exec(text)?.[2];

/** Los pasos de la tarea (§4.1, Pasos) los modela el oráculo de edición, que sigue el avance y los completados. */
const STEPS_STEP = /^(?:los pasos de la tarea |el paso actual de la tarea es |toco Hecho |toco Paso anterior$|vacío el paso |la fila de la tarea (?:muestra los botones |no muestra botones de paso$)|el botón Hecho de la tarea está )/;

/** La versión mínima (§4.1, §6.1) y su botón los modela el oráculo de edición, que sigue los completados y el aviso. */
const MINIMAL_STEP = /^(?:la versión mínima de la tarea |toco Hice la mínima |la fila de la tarea (?:muestra la mínima |no muestra mínima$)|el botón Hice la mínima )/;

export const isScenarioOfTextOfDate = (texts: string[]) =>
	!texts.some((text) => STEPS_STEP.test(text) || MINIMAL_STEP.test(text)) &&
	!(texts.some((text) => THEN_OF_FIRST_STEP.test(text)) && texts.some((text) => EDITING_STEP.test(text))) &&
	texts.some((text) => ROW_THEN.test(text) || THEN_OF_FIRST_STEP.test(text) || THEN_OF_ROW_OF_TITLE.test(text) || NOTICE_THEN.test(text));

/**
 * Los pasos de la tarea `titulo`: los que la nombran y los que no nombran a ninguna (la consulta, los checks). Con una
 * sola tarea el título no decide nada y se lo quita; con más de una hace falta saber de cuál se habla.
 */
function taskSteps(texts: string[], title: string | undefined): StepOracle[] | undefined {
	const titles = new Set(texts.filter((text) => DECLARES_TASK.test(text)).map(stepTitle));
	if (titles.size > 1 && (title === undefined || !titles.has(title))) return undefined;
	return texts
		.filter((text) => titles.size <= 1 || stepTitle(text) === undefined || stepTitle(text) === title)
		.map((text) => ({ text: text.replace(TITLE_IN_STEP, '$1') }));
}

/** La tarea `titulo` armada con los pasos de entrada, y el momento en que se consulta el aviso, si lo hay. */
function situationOf(entries: StepOracle[], row: RowOracle, title?: string): { s: Situation; noticeNow?: number } | undefined {
	const resolved = entries.map(({ text }) => resolve(text, row));
	if (resolved.includes(undefined)) return undefined;
	const steps = taskSteps(resolved as string[], title);
	if (!steps) return undefined;
	const texts = steps.map(({ text }) => text);
	const query = texts.map((text) => NOTICE_QUERY.exec(text)?.[1]).find((m) => m !== undefined);
	const remaining = texts.filter((text) => !NOTICE_QUERY.test(text) && text !== 'Mostrar pausadas está encendido');
	const s = build(remaining.map((text) => ({ text })), {});
	const noticeNow = query === undefined ? undefined : date(query);
	return s && (query === undefined || noticeNow !== undefined) ? { s, noticeNow } : undefined;
}

/**
 * §6.1: la fila muestra «Primer paso: » y el texto, recortado, solo si la tarea tiene primer paso y está pendiente o
 * atrasada; en espera (también pospuesta o completada) o pausada no lo muestra. Se decide con el estado de ese momento.
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

/** El primer paso que deja guardado el escenario; el último paso que lo declara. */
function firstStepDeclared(entries: StepOracle[], row: RowOracle): string | undefined {
	const texts = entries.map(({ text }) => resolve(text, row) ?? '');
	return texts.map((text) => FIRST_STEP_SAVED.exec(text)?.[1]).filter((value) => value !== undefined).at(-1);
}

/** El aviso se ve entre el completado y 5 s después (§5.4); fuera, no hay aviso que consultar. */
function returnVisible(s: Situation, now: number | undefined): string | undefined {
	if (now === undefined || s.completions.length === 0) return undefined;
	return noticeSees(Math.max(...s.completions), now) ? returnOfNoticeOf(s, now) : 'sin aviso';
}

/** §6.1: lo que el oráculo observa en un Then de la lista o del aviso, con lo que el Then afirma; undefined si no se decide. */
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

/** Lo que el oráculo observa y lo que cada Then afirma; undefined si algo no se reconoce o no se decide. */
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
