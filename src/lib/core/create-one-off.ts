import { createTask, type CommonData, type CreationResult } from './creation';
import { readIsoDay } from './days';
import type { OneOffTask } from './task';

export interface OneOffData extends CommonData {
	/** YYYY-MM-DD; without the field, the task has no due date. */
	dueDate?: string;
}

/**
 * Spec §4.1: non-empty title and, if there is a due date, a date that exists in the
 * calendar. A past due date is accepted: the task ends up overdue.
 */
export function createOneOff({ dueDate, ...commons }: OneOffData, id: string, now: Date): CreationResult<OneOffTask> {
	const day = dueDate === undefined ? undefined : readIsoDay(dueDate);
	const invalidDate = dueDate !== undefined && day === undefined;
	return createTask<OneOffTask>({ ...commons, id, now }, invalidDate ? { dueDate: 'invalida' } : {}, () => ({
		kind: 'puntual',
		...(day && { dueDate: day })
	}));
}
