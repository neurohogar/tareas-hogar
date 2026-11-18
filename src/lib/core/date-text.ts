// Spec §6.1 (Fecha y distancia): the phrase «Tocaba …» or «Vuelve …» that names an
// instant relative to now, with the exact date and the relative distance.
import { yearOf, weekday, dayOfMonth, daysBetween, startOfDay, monthOf } from './days';
import { timeInText, monthName } from './dates-in-text';

/** «Tocaba» for an overdue task; «Vuelve» for a waiting one. */
export type DateVerb = 'Tocaba' | 'Vuelve';

const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;

/** The local days that are named with a word, by their distance from today. */
const DAY_WORD = new Map([
	[-1, 'ayer'],
	[0, 'hoy'],
	[1, 'mañana']
]);

/**
 * Spec §6.1: «<verb> <date>[ · <distance>]». «el» goes only before the date
 * with a weekday; with «hoy», «ayer» or «mañana» it does not, and without a time those
 * words are already the distance. E.g.: «Tocaba el martes 10 · hace 3 días»,
 * «Vuelve hoy 18:00 · en 8 horas», «Vuelve mañana».
 */
export function datePhrase(verb: DateVerb, instant: Date, now: Date): string {
	const days = daysBetween(now, instant);
	const withTime = instant.getTime() !== startOfDay(instant).getTime();
	const hour = withTime ? ` ${timeInText(instant)}` : '';
	const word = DAY_WORD.get(days);
	if (word === undefined) return `${verb} el ${dayWithNumber(instant, now)}${hour} · ${distanceInDays(days)}`;
	return withTime ? `${verb} ${word}${hour} · ${distanceInHoursOrMinutes(instant, now)}` : `${verb} ${word}`;
}

/** «martes 10», with « de <month>» if the month is not the one of now and « de <year>» if the year is not the one of now. */
function dayWithNumber(day: Date, now: Date): string {
	const ofMonth = `${weekday(day)} ${dayOfMonth(day)}`;
	if (yearOf(day) !== yearOf(now)) return `${ofMonth} de ${monthName(day)} de ${yearOf(day)}`;
	return monthOf(day) === monthOf(now) ? ofMonth : `${ofMonth} de ${monthName(day)}`;
}

const DISTANCE_PREFIX = new Map([
	[-1, 'hace'],
	[1, 'en']
]);

/** At 2 or more local days: «hace N días» / «en N días». */
const distanceInDays = (days: number) => `${DISTANCE_PREFIX.get(Math.sign(days))} ${Math.abs(days)} días`;

const count = (amount: number, singular: string, plural: string) => `${amount} ${amount === 1 ? singular : plural}`;

/**
 * From now, even if it crosses midnight: in hours or, under one hour, in
 * minutes. The past is rounded down and the future up; the
 * past under a minute is «ahora» (the future never reaches 0 minutes).
 */
function distanceInHoursOrMinutes(instant: Date, now: Date): string {
	// With sign, ceil rounds the future up and the past down (in absolute value).
	const minutes = Math.ceil((instant.getTime() - now.getTime()) / MS_PER_MINUTE);
	if (minutes === 0) return 'ahora';
	const amount =
		Math.abs(minutes) < MINUTES_PER_HOUR
			? count(Math.abs(minutes), 'minuto', 'minutos')
			: count(Math.abs(Math.ceil(minutes / MINUTES_PER_HOUR)), 'hora', 'horas');
	return `${DISTANCE_PREFIX.get(Math.sign(minutes))} ${amount}`;
}
