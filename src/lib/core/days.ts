// Local calendar days (spec §5: local time of the device). A day is its
// start, at 00:00 local. It is the only core module that reads or builds dates
// according to the process time zone (check:arch requires it): the rest compares
// instants with getTime() or asks this module.
import { WEEKDAYS, type Weekday } from './task';

/**
 * The start of the local day (year, month 0..11, day), with overflow normalized as
 * in Date. Unlike new Date(a, m, d), it does not map the years 0..99 to 1900..1999.
 */
function day(year: number, month: number, dayNumber: number): Date {
	// The constructor gives 00:00 local; setFullYear fixes the years 0..99 without touching the time.
	const date = new Date(year, month, dayNumber);
	date.setFullYear(year, month, dayNumber);
	return date;
}

export function startOfDay(moment: Date): Date {
	return day(moment.getFullYear(), moment.getMonth(), moment.getDate());
}

/** The start of the day that is `amount` days after (or before, if negative). */
export function addDays(from: Date, amount: number): Date {
	return day(from.getFullYear(), from.getMonth(), from.getDate() + amount);
}

/**
 * How many local days go from the day of `from` to that of `to` (negative if
 * `to` is an earlier day). It rounds: a day with a time change does not last 24 h.
 */
export function daysBetween(from: Date, to: Date): number {
	const MS_PER_DAY = 24 * 60 * 60 * 1000;
	return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);
}

/** getDay() counts from Sunday (0); the domain week starts on Monday. */
export function weekday(day: Date): Weekday {
	return WEEKDAYS[(day.getDay() + 6) % 7];
}

/** The number of the day within its month (1..31). */
export function dayOfMonth(day: Date): number {
	return day.getDate();
}

/** The month of the local day, from 1 (January) to 12 (December). */
export function monthOf(day: Date): number {
	return day.getMonth() + 1;
}

export function yearOf(day: Date): number {
	return day.getFullYear();
}

/** The local instant of the day at that number of minutes from its 00:00 (0..1439). */
export function atTheMinute(ofDay: Date, minutes: number): Date {
	const date = startOfDay(ofDay);
	date.setHours(0, minutes, 0, 0);
	return date;
}

/** The hour (0..23) and minute local to the moment; seconds do not count. */
export function hourAndMinute(moment: Date): { hour: number; minute: number } {
	return { hour: moment.getHours(), minute: moment.getMinutes() };
}

export function lastDayOfMonth(ofMonth: Date): number {
	return day(ofMonth.getFullYear(), ofMonth.getMonth() + 1, 0).getDate();
}

/** A date or time number with two digits ("08"). */
export const twoDigits = (dayNumber: number) => String(dayNumber).padStart(2, '0');

/** The local day as an ISO-8601 date without time (YYYY-MM-DD). */
export function isoDay(day: Date): string {
	return `${String(day.getFullYear()).padStart(4, '0')}-${twoDigits(day.getMonth() + 1)}-${twoDigits(day.getDate())}`;
}

/**
 * Reads a YYYY-MM-DD date as the start of that local day, or undefined if it
 * does not have that shape or does not exist in the calendar (2026-02-29, 2026-13-01).
 */
export function readIsoDay(text: string): Date | undefined {
	const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
	if (!parts) return undefined;
	const [year, month, dayNumber] = parts.slice(1).map(Number);
	const date = day(year, month - 1, dayNumber);
	return isoDay(date) === text ? date : undefined;
}

/** Like readIsoDay, for dates already stored: an invalid one is an error. */
export function dayFromIso(text: string): Date {
	const date = readIsoDay(text);
	if (!date) throw new Error(`Invalid date: "${text}"`);
	return date;
}
