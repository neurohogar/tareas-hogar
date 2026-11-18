// Spec §4.4: coveredOccurrence stored as text. A date (2026-07-14) and
// a date and time (2026-07-14T07:00) have different formats, so a
// window that starts at 00:00 is not mistaken for a date.
import { dayFromIso, isoDay, twoDigits, atTheMinute, hourAndMinute } from './days';
import type { CoveredOccurrence } from './task';

const DATE_AND_TIME = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d)$/;

export function occurrenceInText(occurrence: CoveredOccurrence): string {
	if (occurrence instanceof Date) return isoDay(occurrence);
	const { hour, minute } = hourAndMinute(occurrence.start);
	return `${isoDay(occurrence.start)}T${twoDigits(hour)}:${twoDigits(minute)}`;
}

/** For already stored values: an invalid one is an error. */
export function occurrenceFromText(text: string): CoveredOccurrence {
	const parts = DATE_AND_TIME.exec(text);
	if (!parts) return dayFromIso(text);
	const [, date, hour, minute] = parts;
	return { start: atTheMinute(dayFromIso(date), Number(hour) * 60 + Number(minute)) };
}
