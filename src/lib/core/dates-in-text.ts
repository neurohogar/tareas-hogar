// Spec §6.3: how the days and hours of the Historial are named. Own tables
// in Spanish: it does not depend on the system locale.
import { yearOf, weekday, dayOfMonth, isoDay, twoDigits, hourAndMinute, startOfDay, monthOf, addDays } from './days';

const MONTHS = [
	'enero',
	'febrero',
	'marzo',
	'abril',
	'mayo',
	'junio',
	'julio',
	'agosto',
	'septiembre',
	'octubre',
	'noviembre',
	'diciembre'
] as const;

/** The name of the month of the local day, in lowercase ("noviembre"). */
export const monthName = (day: Date) => MONTHS[monthOf(day) - 1];

const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

/**
 * "Hoy", "Ayer" or "martes 14 de julio" (with " de 2025" if the year is not the
 * one of now). A day after today carries the date, never "Mañana".
 */
export function dayHeader(day: Date, now: Date): string {
	if (sameDay(day, now)) return 'Hoy';
	if (sameDay(day, addDays(now, -1))) return 'Ayer';
	const date = `${weekday(day)} ${dayOfMonth(day)} de ${monthName(day)}`;
	return yearOf(day) === yearOf(now) ? date : `${date} de ${yearOf(day)}`;
}

/** The local time of the moment in 24 h, "HH:MM". */
export function timeInText(moment: Date): string {
	const { hour, minute } = hourAndMinute(moment);
	return `${twoDigits(hour)}:${twoDigits(minute)}`;
}

/** Spec §6.7 (Copiar): the local date and time, "YYYY-MM-DD HH:MM". */
export function dateAndTimeInText(moment: Date): string {
	return `${isoDay(moment)} ${timeInText(moment)}`;
}
