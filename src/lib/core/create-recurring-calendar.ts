import { createRecurring, type CommonData, type RecurrenceErrors, type CreationResult } from './creation';
import { WEEKDAYS, MONTH_DAYS, type Weekday, type CalendarRecurrence, type RecurringTask } from './task';

export interface RecurringCalendarData extends CommonData {
	weekdays: readonly Weekday[];
	monthDays: readonly number[];
}

const isDayOfMonth = (day: number) => MONTH_DAYS.includes(day);

/** Spec §4.2: weekly or monthly (not both), with at least one day, and month days between 1 and 31. */
function daysError({ weekdays, monthDays }: RecurringCalendarData): RecurrenceErrors['days'] {
	if (weekdays.length > 0 && monthDays.length > 0) return 'combinados';
	if (weekdays.length === 0 && monthDays.length === 0) return 'faltan';
	if (!monthDays.every(isDayOfMonth)) return 'diaDelMesInvalido';
	return undefined;
}

/** The days are a set: they are saved without repeats and in order (of the week, or from lowest to highest). */
function recurrenceOf({ weekdays, monthDays }: RecurringCalendarData): CalendarRecurrence {
	if (weekdays.length > 0)
		return { mode: 'calendario', weekdays: WEEKDAYS.filter((day) => weekdays.includes(day)) };
	return { mode: 'calendario', monthDays: [...new Set(monthDays)].sort((a, b) => a - b) };
}

/** Spec §4.1 and §4.2: creates a calendar recurring task, weekly or monthly. */
export function createRecurringCalendar(
	data: RecurringCalendarData,
	id: string,
	now: Date
): CreationResult<RecurringTask> {
	const days = daysError(data);
	const { title, emoji, note, firstStep, steps, minimalVersion, schedule } = data;
	return createRecurring({ title, emoji, note, firstStep, steps, minimalVersion, schedule, id, now }, days ? { days } : {}, () => recurrenceOf(data));
}
