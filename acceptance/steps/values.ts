// Conversión estricta de valores de Examples a tipos del dominio. Un valor
// malformado falla el escenario (requisito del runtime APS).
import { WEEKDAYS, type Weekday, type CoveredOccurrence, type Unit } from '../../src/lib/core/task';

/** Captura de un `<placeholder>`; el runtime la reemplaza por su valor. */
export const P = '(<[A-Za-z0-9_]+>)';

/** Título de una palabra, escrito en el paso o como `<placeholder>`. */
export const TITLE = '(\\S+)';

const DATE_HOUR_LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;
const DATE_LOCAL = /^\d{4}-\d{2}-\d{2}$/;

/** ISO-8601 sin zona: hora local del dispositivo (spec §5). */
export function dateHour(value: string): Date {
	const parts = DATE_HOUR_LOCAL.exec(value);
	if (!parts) throw new Error(`Fecha y hora inválida: "${value}"`);
	const [year, month, day, hour, minute, second] = parts.slice(1).map(Number);
	const date = new Date(year, month - 1, day, hour, minute, second);
	const sameDate =
		date.getFullYear() === year &&
		date.getMonth() === month - 1 &&
		date.getDate() === day &&
		date.getHours() === hour &&
		date.getMinutes() === minute &&
		date.getSeconds() === second;
	if (!sameDate) throw new Error(`Fecha y hora inexistente: "${value}"`);
	return date;
}

export function numeric(value: string): number {
	if (!/^-?\d+(\.\d+)?$/.test(value)) throw new Error(`Número inválido: "${value}"`);
	return Number(value);
}

export function unit(value: string): Unit {
	if (value !== 'horas' && value !== 'dias') throw new Error(`Unidad inválida: "${value}"`);
	return value;
}

/** ISO-8601 sin hora: el inicio (00:00 locales) de ese día. */
export function date(value: string): Date {
	if (!DATE_LOCAL.test(value)) throw new Error(`Fecha inválida: "${value}"`);
	return dateHour(`${value}T00:00:00`);
}

/**
 * Spec §4.4: una ocurrencia cubierta sin hora (2026-07-14) es un día; con hora
 * (2026-07-14T07:00:00), el inicio de una ocurrencia con horario.
 */
export function occurrence(value: string): CoveredOccurrence {
	return DATE_LOCAL.test(value) ? date(value) : { start: dateHour(value) };
}

/** Lista separada por comas ("martes, jueves"), en el orden escrito. */
export function list(value: string): string[] {
	const elements = value.split(',').map((element) => element.trim());
	if (elements.some((element) => element === '')) throw new Error(`Lista inválida: "${value}"`);
	return elements;
}

export function weekdays(value: string): Weekday[] {
	return list(value).map((day) => {
		if (!(WEEKDAYS as readonly string[]).includes(day)) throw new Error(`Día de la semana inválido: "${day}"`);
		return day as Weekday;
	});
}

export function monthDays(value: string): number[] {
	return list(value).map(numeric);
}
