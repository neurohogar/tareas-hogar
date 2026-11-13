// Spec §6.1: qué texto de fecha y distancia lleva la fila de una tarea, según el
// estado que ya dio el core (no lo recalcula: §6.1 solo cambia textos).
import type { Estado } from './estado';
import type { Completado, Tarea } from './tarea';
import { fraseDeFecha } from './texto-de-fecha';
import { instanteDeTocaba, instanteDeVuelve } from './texto-de-fecha-instantes';

/**
 * Spec §6.1: una atrasada, «Tocaba …»; una en espera (también una periódica
 * completada o una pospuesta), «Vuelve …». Una pendiente, una pausada y una
 * puntual completada no llevan texto de fecha (undefined).
 */
export function textoDeFecha(tarea: Tarea, completados: readonly Completado[], estado: Estado, ahora: Date): string | undefined {
	if (estado.tipo === 'en espera') return fraseDeFecha('Vuelve', instanteDeVuelve(tarea, completados, estado, ahora), ahora);
	if (estado.tipo !== 'atrasada') return undefined;
	const tocaba = instanteDeTocaba(tarea, completados, ahora);
	return tocaba && fraseDeFecha('Tocaba', tocaba, ahora);
}
