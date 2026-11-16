import { createRecurring, type CommonData, type RecurrenceErrors, type CreationResult } from './creation';
import { WEEKDAYS, MONTH_DAYS, type Weekday, type CalendarRecurrence, type RecurringTask } from './task';

export interface RecurringCalendarData extends CommonData {
	weekdays: readonly Weekday[];
	monthDays: readonly number[];
}

const isDayOfMonth = (day: number) => MONTH_DAYS.includes(day);

/** Spec §4.2: semanal o mensual (no las dos), con al menos un día, y días del mes entre 1 y 31. */
function daysError({ weekdays, monthDays }: RecurringCalendarData): RecurrenceErrors['days'] {
	if (weekdays.length > 0 && monthDays.length > 0) return 'combinados';
	if (weekdays.length === 0 && monthDays.length === 0) return 'faltan';
	if (!monthDays.every(isDayOfMonth)) return 'diaDelMesInvalido';
	return undefined;
}

/** Los días son un conjunto: se guardan sin repetir y en orden (de la semana, o de menor a mayor). */
function recurrenceOf({ weekdays, monthDays }: RecurringCalendarData): CalendarRecurrence {
	if (weekdays.length > 0)
		return { mode: 'calendario', weekdays: WEEKDAYS.filter((day) => weekdays.includes(day)) };
	return { mode: 'calendario', monthDays: [...new Set(monthDays)].sort((a, b) => a - b) };
}

/** Spec §4.1 y §4.2: crea una periódica de calendario, semanal o mensual. */
export function createRecurringCalendar(
	data: RecurringCalendarData,
	id: string,
	now: Date
): CreationResult<RecurringTask> {
	const days = daysError(data);
	const { title, emoji, note, firstStep, steps, minimalVersion, schedule, effort } = data;
	return createRecurring({ title, emoji, note, firstStep, steps, minimalVersion, schedule, effort, id, now }, days ? { days } : {}, () => recurrenceOf(data));
}
