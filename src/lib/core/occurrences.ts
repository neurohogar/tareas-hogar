// Días de ocurrencia de una recurrencia de calendario (spec §4.2).
import { weekday, dayOfMonth, startOfDay, addDays, lastDayOfMonth } from './days';
import type { CalendarRecurrence } from './task';

/** Una recurrencia válida ocurre al menos una vez por mes: nunca hay más de 31 días entre dos ocurrencias. */
const MAX_DAYS_BETWEEN_OCCURRENCES = 31;

/** Un día del mes que no existe en ese mes cae en su último día. */
export function isOccurrence(recurrence: CalendarRecurrence, day: Date): boolean {
	if ('weekdays' in recurrence) return recurrence.weekdays.includes(weekday(day));
	const last = lastDayOfMonth(day);
	return recurrence.monthDays.some((chosenOne) => Math.min(chosenOne, last) === dayOfMonth(day));
}

/**
 * La primera ocurrencia estrictamente posterior al día de `despuesDe`. Solo
 * lanza si la recurrencia viola §4.2 (por ejemplo, si no tiene días).
 */
export function firstLaterOccurrence(recurrence: CalendarRecurrence, afterOf: Date): Date {
	const from = startOfDay(afterOf);
	for (let steps = 1; steps <= MAX_DAYS_BETWEEN_OCCURRENCES; steps++) {
		const day = addDays(from, steps);
		if (isOccurrence(recurrence, day)) return day;
	}
	throw new Error('La recurrencia no tiene días de ocurrencia');
}

/** La ocurrencia más reciente en (desde, hasta], o undefined si no hay ninguna. */
export function lastOccurrenceBetween(
	recurrence: CalendarRecurrence,
	from: Date,
	to: Date
): Date | undefined {
	for (let day = startOfDay(to); day > from; day = addDays(day, -1)) {
		if (isOccurrence(recurrence, day)) return day;
	}
	return undefined;
}
