// Spec §6.1: qué texto de fecha y distancia lleva la fila de una tarea, según el
// estado que ya dio el core (no lo recalcula: §6.1 solo cambia textos).
import type { Status } from './status';
import type { Completion, Task } from './task';
import { datePhrase } from './date-text';
import { dueInstant, returnInstant } from './date-text-instants';

/**
 * Spec §6.1: una atrasada, «Tocaba …»; una en espera (también una periódica
 * completada o una pospuesta), «Vuelve …». Una pendiente, una pausada y una
 * puntual completada no llevan texto de fecha (undefined).
 */
export function dateText(task: Task, completions: readonly Completion[], status: Status, now: Date): string | undefined {
	if (status.kind === 'en espera') return datePhrase('Vuelve', returnInstant(task, completions, status, now), now);
	if (status.kind !== 'atrasada') return undefined;
	const wasDue = dueInstant(task, completions, now);
	return wasDue && datePhrase('Tocaba', wasDue, now);
}
