import { startOfDay } from './days';
import type { Status } from './status';
import type { Completion } from './task';

/**
 * Spec §5.1: with at least one completion it does not appear in Pending; otherwise it is
 * overdue when today is later than the due date (which counts as the whole
 * day) and pending in any other case. It is never waiting.
 */
export function oneOffStatus(dueDate: Date | undefined, completions: readonly Completion[], now: Date): Status {
	if (completions.length > 0) return { kind: 'completada' };
	if (dueDate && startOfDay(now).getTime() > dueDate.getTime()) return { kind: 'atrasada' };
	return { kind: 'pendiente' };
}
