// Spec §6.3: cómo se nombran los días y las horas del Historial. Tablas
// propias en español: no depende del locale del sistema.
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

/** El nombre del mes del día local, en minúsculas ("noviembre"). */
export const monthName = (day: Date) => MONTHS[monthOf(day) - 1];

const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

/**
 * "Hoy", "Ayer" o "martes 14 de julio" (con " de 2025" si el año no es el de
 * ahora). Un día posterior a hoy lleva la fecha, nunca "Mañana".
 */
export function dayHeader(day: Date, now: Date): string {
	if (sameDay(day, now)) return 'Hoy';
	if (sameDay(day, addDays(now, -1))) return 'Ayer';
	const date = `${weekday(day)} ${dayOfMonth(day)} de ${monthName(day)}`;
	return yearOf(day) === yearOf(now) ? date : `${date} de ${yearOf(day)}`;
}

/** La hora local del momento en 24 h, "HH:MM". */
export function timeInText(moment: Date): string {
	const { hour, minute } = hourAndMinute(moment);
	return `${twoDigits(hour)}:${twoDigits(minute)}`;
}

/** Spec §6.7 (Copiar): la fecha y la hora locales, "AAAA-MM-DD HH:MM". */
export function dateAndTimeInText(moment: Date): string {
	return `${isoDay(moment)} ${timeInText(moment)}`;
}
