import { createTask, type CommonData, type CreationResult } from './creation';
import { readIsoDay } from './days';
import type { OneOffTask } from './task';

export interface OneOffData extends CommonData {
	/** AAAA-MM-DD; sin el campo, la tarea no tiene fecha límite. */
	dueDate?: string;
}

/**
 * Spec §4.1: título no vacío y, si hay fecha límite, una fecha que existe en el
 * calendario. Se acepta una fecha límite pasada: la tarea queda atrasada.
 */
export function createOneOff({ dueDate, ...commons }: OneOffData, id: string, now: Date): CreationResult<OneOffTask> {
	const day = dueDate === undefined ? undefined : readIsoDay(dueDate);
	const invalidDate = dueDate !== undefined && day === undefined;
	return createTask<OneOffTask>({ ...commons, id, now }, invalidDate ? { dueDate: 'invalida' } : {}, () => ({
		kind: 'puntual',
		...(day && { dueDate: day })
	}));
}
