// Spec §5.6 y §5.7: con horario, una ocurrencia es un par (día, ventana),
// identificado por su inicio. P, N y la ocurrencia que cubre un completado se
// calculan sobre ocurrencias en lugar de días.
import { startOfDay, addDays } from './days';
import { occurrencesOfDay, type Occurrence } from './schedule';
import { lastCovered } from './covered-occurrence';
import { isOccurrence, firstLaterOccurrence } from './occurrences';
import type { Completion, Schedule, CalendarRecurrence, RelativeRecurrence } from './task';

/** La primera ocurrencia que cumple, recorriendo los días desde `dia` con `siguiente`. */
function first(schedule: Schedule, day: Date, following: (day: Date) => Date, meets: (occurrence: Occurrence) => boolean): Occurrence {
	for (; ; day = following(day)) {
		const found = occurrencesOfDay(schedule, day).find(meets);
		if (found) return found;
	}
}

/** El primer día de ocurrencia de la recurrencia desde el día de `desde` inclusive. */
function firstDayOfOccurrence(recurrence: CalendarRecurrence, from: Date): Date {
	const day = startOfDay(from);
	return isOccurrence(recurrence, day) ? day : firstLaterOccurrence(recurrence, day);
}

/**
 * La ocurrencia que cubre un completado nuevo hecho `ahora`, dada N: antes de
 * su cierre, N; si no, la ocurrencia con el inicio más reciente ≤ ahora entre
 * los días que cuentan (desde el de N).
 */
function whatCovers(schedule: Schedule, n: Occurrence, counts: (day: Date) => boolean, now: Date): Date {
	const moment = now.getTime();
	if (moment < n.closing) return new Date(n.start);
	for (let day = startOfDay(now); ; day = addDays(day, -1)) {
		const started = counts(day) ? occurrencesOfDay(schedule, day).filter(({ start }) => start <= moment) : [];
		const recent = started.at(-1);
		if (recent) return new Date(recent.start);
	}
}

/**
 * Spec §5.6: N, la primera ocurrencia con inicio posterior a P. Spec §5.8: de
 * una reanudada, una ocurrencia cuya ventana cerró hasta reanudadaEn no cuenta.
 */
export function nextCalendarOccurrence(
	recurrence: CalendarRecurrence,
	schedule: Schedule,
	createdAt: Date,
	completions: readonly Completion[],
	resumedAt?: Date
): Occurrence {
	const p = lastCovered(createdAt, completions);
	const closed = resumedAt?.getTime() ?? Number.NEGATIVE_INFINITY;
	const following = (day: Date) => firstLaterOccurrence(recurrence, day);
	return first(schedule, firstDayOfOccurrence(recurrence, new Date(p)), following, ({ start, closing }) => start > p && closing > closed);
}

/**
 * Spec §5.6: el inicio de la ocurrencia que cubre un completado nuevo: la más
 * reciente sin cubrir con inicio en (P, ahora] o, si no hay, N.
 */
export function calendarOccurrenceThatCovers(
	recurrence: CalendarRecurrence,
	schedule: Schedule,
	createdAt: Date,
	completions: readonly Completion[],
	now: Date,
	resumedAt?: Date
): Date {
	const n = nextCalendarOccurrence(recurrence, schedule, createdAt, completions, resumedAt);
	return whatCovers(schedule, n, (day) => isOccurrence(recurrence, day), now);
}

/** Spec §5.7: una relativa con más de una ventana (y el intervalo en días) se completa una vez por ventana. */
export function completesByWindow(recurrence: RelativeRecurrence, schedule: Schedule): boolean {
	return recurrence.unit === 'dias' && schedule.length > 1;
}

/**
 * Spec §5.7, N de una relativa por ventana: nunca completada, la primera
 * ventana cuyo hasta es posterior a creadaEn; con P, la primera ventana
 * posterior a P del día de P o de uno cada `cada` días desde ahí.
 */
export function nextWindowOccurrence(
	recurrence: RelativeRecurrence,
	schedule: Schedule,
	createdAt: Date,
	completions: readonly Completion[]
): Occurrence {
	if (completions.length === 0) return first(schedule, startOfDay(createdAt), (day) => addDays(day, 1), ({ closing }) => closing > createdAt.getTime());
	const p = lastCovered(createdAt, completions);
	return first(schedule, startOfDay(new Date(p)), (day) => addDays(day, recurrence.every), ({ start }) => start > p);
}

/**
 * Spec §5.7: el inicio de la ocurrencia que cubre un completado nuevo de una
 * relativa por ventana: N, o, si está atrasada, la ventana con el inicio más
 * reciente ≤ ahora, de cualquier día.
 */
export function windowOccurrenceThatCovers(
	recurrence: RelativeRecurrence,
	schedule: Schedule,
	createdAt: Date,
	completions: readonly Completion[],
	now: Date
): Date {
	const n = nextWindowOccurrence(recurrence, schedule, createdAt, completions);
	return whatCovers(schedule, n, () => true, now);
}
