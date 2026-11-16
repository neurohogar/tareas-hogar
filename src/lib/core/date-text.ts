// Spec §6.1 (Fecha y distancia): la frase «Tocaba …» o «Vuelve …» que nombra un
// instante respecto de ahora, con la fecha exacta y la distancia relativa.
import { yearOf, weekday, dayOfMonth, daysBetween, startOfDay, monthOf } from './days';
import { timeInText, monthName } from './dates-in-text';

/** «Tocaba» en una atrasada; «Vuelve» en una en espera. */
export type DateVerb = 'Tocaba' | 'Vuelve';

const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;

/** Los días locales que se nombran con una palabra, por su distancia a hoy. */
const DAY_WORD = new Map([
	[-1, 'ayer'],
	[0, 'hoy'],
	[1, 'mañana']
]);

/**
 * Spec §6.1: «<verbo> <fecha>[ · <distancia>]». «el» va solo delante de la fecha
 * con día de la semana; con «hoy», «ayer» o «mañana» no, y sin hora esas
 * palabras ya son la distancia. Ej.: «Tocaba el martes 10 · hace 3 días»,
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

/** «martes 10», con « de <mes>» si el mes no es el de ahora y « de <año>» si el año no es el de ahora. */
function dayWithNumber(day: Date, now: Date): string {
	const ofMonth = `${weekday(day)} ${dayOfMonth(day)}`;
	if (yearOf(day) !== yearOf(now)) return `${ofMonth} de ${monthName(day)} de ${yearOf(day)}`;
	return monthOf(day) === monthOf(now) ? ofMonth : `${ofMonth} de ${monthName(day)}`;
}

const DISTANCE_PREFIX = new Map([
	[-1, 'hace'],
	[1, 'en']
]);

/** A 2 o más días locales: «hace N días» / «en N días». */
const distanceInDays = (days: number) => `${DISTANCE_PREFIX.get(Math.sign(days))} ${Math.abs(days)} días`;

const count = (amount: number, singular: string, plural: string) => `${amount} ${amount === 1 ? singular : plural}`;

/**
 * Desde ahora, aunque cruce la medianoche: en horas o, a menos de una hora, en
 * minutos. Lo pasado se redondea hacia abajo y lo futuro hacia arriba; lo
 * pasado a menos de un minuto es «ahora» (lo futuro nunca llega a 0 minutos).
 */
function distanceInHoursOrMinutes(instant: Date, now: Date): string {
	// Con signo, ceil redondea lo futuro hacia arriba y lo pasado hacia abajo (en valor absoluto).
	const minutes = Math.ceil((instant.getTime() - now.getTime()) / MS_PER_MINUTE);
	if (minutes === 0) return 'ahora';
	const amount =
		Math.abs(minutes) < MINUTES_PER_HOUR
			? count(Math.abs(minutes), 'minuto', 'minutos')
			: count(Math.abs(Math.ceil(minutes / MINUTES_PER_HOUR)), 'hora', 'horas');
	return `${DISTANCE_PREFIX.get(Math.sign(minutes))} ${amount}`;
}
