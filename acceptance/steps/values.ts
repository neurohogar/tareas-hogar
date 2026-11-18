// Strict conversion of Examples values to domain types. A malformed
// value fails the scenario (APS runtime requirement).
import { WEEKDAYS, type Weekday, type CoveredOccurrence, type Unit } from '../../src/lib/core/task';

/** Capture of a `<placeholder>`; the runtime replaces it with its value. */
export const P = '(<[A-Za-z0-9_]+>)';

/** A one-word title, written in the step or as `<placeholder>`. */
export const TITLE = '(\\S+)';

const DATE_HOUR_LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;
const DATE_LOCAL = /^\d{4}-\d{2}-\d{2}$/;

/** ISO-8601 without zone: local time of the device (spec §5). */
export function dateHour(value: string): Date {
	const parts = DATE_HOUR_LOCAL.exec(value);
	if (!parts) throw new Error(`Invalid date and time: "${value}"`);
	const [year, month, day, hour, minute, second] = parts.slice(1).map(Number);
	const date = new Date(year, month - 1, day, hour, minute, second);
	const sameDate =
		date.getFullYear() === year &&
		date.getMonth() === month - 1 &&
		date.getDate() === day &&
		date.getHours() === hour &&
		date.getMinutes() === minute &&
		date.getSeconds() === second;
	if (!sameDate) throw new Error(`Nonexistent date and time: "${value}"`);
	return date;
}

export function numeric(value: string): number {
	if (!/^-?\d+(\.\d+)?$/.test(value)) throw new Error(`Invalid number: "${value}"`);
	return Number(value);
}

export function unit(value: string): Unit {
	if (value !== 'horas' && value !== 'dias') throw new Error(`Invalid unit: "${value}"`);
	return value;
}

/** ISO-8601 without time: the start (00:00 local) of that day. */
export function date(value: string): Date {
	if (!DATE_LOCAL.test(value)) throw new Error(`Invalid date: "${value}"`);
	return dateHour(`${value}T00:00:00`);
}

/**
 * Spec §4.4: a covered occurrence without a time (2026-07-14) is a day; with a time
 * (2026-07-14T07:00:00), the start of an occurrence with a schedule.
 */
export function occurrence(value: string): CoveredOccurrence {
	return DATE_LOCAL.test(value) ? date(value) : { start: dateHour(value) };
}

/** Comma-separated list ("martes, jueves"), in the written order. */
export function list(value: string): string[] {
	const elements = value.split(',').map((element) => element.trim());
	if (elements.some((element) => element === '')) throw new Error(`Invalid list: "${value}"`);
	return elements;
}

export function weekdays(value: string): Weekday[] {
	return list(value).map((day) => {
		if (!(WEEKDAYS as readonly string[]).includes(day)) throw new Error(`Invalid weekday: "${day}"`);
		return day as Weekday;
	});
}

export function monthDays(value: string): number[] {
	return list(value).map(numeric);
}
