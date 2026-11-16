// Spec §5.3 y §5.6: qué ocurrencias cubren los completados de una periódica de
// calendario (o relativa por ventana). Este módulo es el único que interpreta
// ocurrenciaCubierta.
import { startOfDay, addDays } from './days';
import { firstLaterOccurrence, lastOccurrenceBetween } from './occurrences';
import type { Completion, CalendarRecurrence } from './task';

/** El último instante del día: cualquier ocurrencia de ese día empieza antes o en él. */
const dayEnd = (day: Date) => addDays(day, 1).getTime() - 1;

/**
 * Hasta dónde cubre un completado: una ocurrencia con hora, su inicio; una
 * fecha sola, el día entero; sin ocurrenciaCubierta (se hizo cuando la tarea
 * era relativa o puntual), el día entero de su completadoEn.
 */
function coveredUntil({ coveredOccurrence, completedAt }: Completion): number {
	if (coveredOccurrence === undefined) return dayEnd(completedAt);
	if (coveredOccurrence instanceof Date) return dayEnd(coveredOccurrence);
	return coveredOccurrence.start.getTime();
}

/**
 * Spec §5.6, P en ms: la mayor ocurrencia cubierta. Los valores sin hora
 * (fecha sola, completado sin ocurrenciaCubierta y, sin completados, el día
 * anterior a creadaEn) cubren el día entero.
 */
export function lastCovered(createdAt: Date, completions: readonly Completion[]): number {
	if (completions.length === 0) return dayEnd(addDays(createdAt, -1));
	return Math.max(...completions.map(coveredUntil));
}

/** Spec §5.3, P sin horario: el día de la última ocurrencia cubierta. */
export function lastCoveredOccurrence(createdAt: Date, completions: readonly Completion[]): Date {
	return startOfDay(new Date(lastCovered(createdAt, completions)));
}

/**
 * La ocurrencia que cubre un completado nuevo hecho `ahora`, dado P: la más
 * reciente sin cubrir en (P, hoy] o, si no hay, N (la primera posterior a P).
 */
export function occurrenceThatCovers(recurrence: CalendarRecurrence, p: Date, now: Date): Date {
	const recent = lastOccurrenceBetween(recurrence, p, now);
	return recent === undefined ? firstLaterOccurrence(recurrence, p) : recent;
}
