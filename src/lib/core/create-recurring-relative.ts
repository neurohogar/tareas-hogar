import { createRecurring, type CommonData, type RecurrenceErrors, type CreationResult } from './creation';
import type { RecurringTask, Unit } from './task';

export interface RecurringRelativeData extends CommonData {
	every: number;
	unit: Unit;
}

/** Spec §4.1: with more than one window, the interval has to be in days. */
const severalWindowsInHours = ({ unit, schedule = [] }: RecurringRelativeData) => unit === 'horas' && schedule.length > 1;

/** Spec §4.1 and §4.2: non-empty title (not counting spaces), each integer ≥ 1 and, in hours, a single window. */
export function createRecurringRelative(data: RecurringRelativeData, id: string, now: Date): CreationResult<RecurringTask> {
	const { every, unit, ...commons } = data;
	const errors: RecurrenceErrors = {
		...(!(Number.isInteger(every) && every >= 1) && { every: 'invalido' as const }),
		...(severalWindowsInHours(data) && { schedule: 'variasEnHoras' as const })
	};
	return createRecurring({ ...commons, id, now }, errors, () => ({ mode: 'relativo', every, unit }));
}
