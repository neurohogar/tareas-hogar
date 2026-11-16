// Días del calendario local (spec §5: hora local del dispositivo). Un día es su
// inicio, a las 00:00 locales. Es el único módulo del core que lee o arma fechas
// según la zona horaria del proceso (check:arch lo exige): el resto compara
// instantes con getTime() o le pregunta a este módulo.
import { WEEKDAYS, type Weekday } from './task';

/**
 * El inicio del día local (anio, mes 0..11, dia), con desborde normalizado como
 * en Date. A diferencia de new Date(a, m, d), no lleva los años 0..99 a 1900..1999.
 */
function day(year: number, month: number, dayNumber: number): Date {
	// El constructor da las 00:00 locales; setFullYear corrige los años 0..99 sin tocar la hora.
	const date = new Date(year, month, dayNumber);
	date.setFullYear(year, month, dayNumber);
	return date;
}

export function startOfDay(moment: Date): Date {
	return day(moment.getFullYear(), moment.getMonth(), moment.getDate());
}

/** El inicio del día que está `cantidad` días después (o antes, si es negativa). */
export function addDays(from: Date, amount: number): Date {
	return day(from.getFullYear(), from.getMonth(), from.getDate() + amount);
}

/**
 * Cuántos días locales van del día de `desde` al de `hasta` (negativo si
 * `hasta` es un día anterior). Redondea: un día con cambio de horario no dura 24 h.
 */
export function daysBetween(from: Date, to: Date): number {
	const MS_PER_DAY = 24 * 60 * 60 * 1000;
	return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);
}

/** getDay() cuenta desde el domingo (0); la semana del dominio empieza el lunes. */
export function weekday(day: Date): Weekday {
	return WEEKDAYS[(day.getDay() + 6) % 7];
}

/** El número del día dentro de su mes (1..31). */
export function dayOfMonth(day: Date): number {
	return day.getDate();
}

/** El mes del día local, de 1 (enero) a 12 (diciembre). */
export function monthOf(day: Date): number {
	return day.getMonth() + 1;
}

export function yearOf(day: Date): number {
	return day.getFullYear();
}

/** El instante local del día a esa cantidad de minutos desde sus 00:00 (0..1439). */
export function atTheMinute(ofDay: Date, minutes: number): Date {
	const date = startOfDay(ofDay);
	date.setHours(0, minutes, 0, 0);
	return date;
}

/** La hora (0..23) y el minuto locales del momento; los segundos no cuentan. */
export function hourAndMinute(moment: Date): { hour: number; minute: number } {
	return { hour: moment.getHours(), minute: moment.getMinutes() };
}

export function lastDayOfMonth(ofMonth: Date): number {
	return day(ofMonth.getFullYear(), ofMonth.getMonth() + 1, 0).getDate();
}

/** Un número de fecha u hora con dos dígitos ("08"). */
export const twoDigits = (dayNumber: number) => String(dayNumber).padStart(2, '0');

/** El día local como fecha ISO-8601 sin hora (AAAA-MM-DD). */
export function isoDay(day: Date): string {
	return `${String(day.getFullYear()).padStart(4, '0')}-${twoDigits(day.getMonth() + 1)}-${twoDigits(day.getDate())}`;
}

/**
 * Lee una fecha AAAA-MM-DD como el inicio de ese día local, o undefined si no
 * tiene esa forma o no existe en el calendario (2026-02-29, 2026-13-01).
 */
export function readIsoDay(text: string): Date | undefined {
	const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
	if (!parts) return undefined;
	const [year, month, dayNumber] = parts.slice(1).map(Number);
	const date = day(year, month - 1, dayNumber);
	return isoDay(date) === text ? date : undefined;
}

/** Como leerDiaIso, para fechas ya guardadas: una inválida es un error. */
export function dayFromIso(text: string): Date {
	const date = readIsoDay(text);
	if (!date) throw new Error(`Fecha inválida: "${text}"`);
	return date;
}
