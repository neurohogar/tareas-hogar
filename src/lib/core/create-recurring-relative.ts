import { createRecurring, type CommonData, type RecurrenceErrors, type CreationResult } from './creation';
import type { RecurringTask, Unit } from './task';

export interface RecurringRelativeData extends CommonData {
	every: number;
	unit: Unit;
}

/** Spec §4.1: con más de una ventana, el intervalo tiene que ser en días. */
const severalWindowsInHours = ({ unit, schedule = [] }: RecurringRelativeData) => unit === 'horas' && schedule.length > 1;

/** Spec §4.1 y §4.2: título no vacío (sin contar espacios), cada entero ≥ 1 y, en horas, una sola ventana. */
export function createRecurringRelative(data: RecurringRelativeData, id: string, now: Date): CreationResult<RecurringTask> {
	const { every, unit, ...commons } = data;
	const errors: RecurrenceErrors = {
		...(!(Number.isInteger(every) && every >= 1) && { every: 'invalido' as const }),
		...(severalWindowsInHours(data) && { schedule: 'variasEnHoras' as const })
	};
	return createRecurring({ ...commons, id, now }, errors, () => ({ mode: 'relativo', every, unit }));
}
