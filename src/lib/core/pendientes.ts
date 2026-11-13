import { clasificarEnPendientes, type EnPendientes } from './completada';
import { completadosDeTarea, ultimoCompletadoEn } from './completados';
import {
	compararCompletadas,
	compararPausadas,
	compararPorUrgencia,
	type FilaCompletada,
	type FilaPorOrdenar
} from './orden-de-pendientes';
import { comoRecienCreada } from './pausa';
import { textoDePrimerPaso } from './primer-paso';
import type { Completado, Tarea } from './tarea';
import { textoDeFecha } from './texto-de-fecha-de-tarea';
import { instanteDeUrgencia } from './urgencia';

/**
 * Una fila de Pendientes; si está completada, se ve tachada y con el checkbox
 * marcado. textoDeFecha: «Tocaba …» o «Vuelve …», si la fila lo lleva (§6.1).
 * textoDePrimerPaso: «Primer paso: …», solo en las filas pendiente o atrasada.
 */
export type FilaDePendientes = { tarea: Tarea; textoDeFecha?: string; textoDePrimerPaso?: string } & EnPendientes;

/**
 * Spec §6.1: las filas de la lista Pendientes. Primero las no completadas,
 * ordenadas por urgencia; con Mostrar completadas encendido, después las
 * completadas, de la de completadoEn más reciente a la más antigua; con
 * Mostrar pausadas encendido, al final las pausadas (§5.8), por título.
 */
export function filasDePendientes(
	tareas: readonly Tarea[],
	completados: readonly Completado[],
	ahora: Date,
	mostrarCompletadas = false,
	mostrarPausadas = false
): FilaDePendientes[] {
	const noCompletadas: FilaPorOrdenar[] = [];
	const completadas: FilaCompletada[] = [];
	const pausadas: Tarea[] = [];
	for (const tarea of tareas) {
		const { propios } = comoRecienCreada(tarea, completadosDeTarea(completados, tarea.id));
		const enPendientes = clasificarEnPendientes(tarea, completados, ahora);
		if (enPendientes.estado.tipo === 'pausada') pausadas.push(tarea);
		else if (enPendientes.completada) completadas.push({ tarea, estado: enPendientes.estado, ultimoCompletadoEn: ultimoCompletadoEn(propios) });
		else noCompletadas.push({ tarea, estado: enPendientes.estado, instante: instanteDeUrgencia(tarea, completados, enPendientes.estado, ahora) });
	}
	const conTexto = (tarea: Tarea, estado: FilaDePendientes['estado']) => textoDeFecha(tarea, completados, estado, ahora);
	const conPrimerPaso = (tarea: Tarea, estado: FilaDePendientes['estado']) => {
		const texto = textoDePrimerPaso(tarea, estado);
		return texto === undefined ? {} : { textoDePrimerPaso: texto };
	};
	const filas = noCompletadas
		.sort(compararPorUrgencia)
		.map(({ tarea, estado }): FilaDePendientes => ({ tarea, estado, completada: false, textoDeFecha: conTexto(tarea, estado), ...conPrimerPaso(tarea, estado) }));
	const alFinal = mostrarCompletadas
		? completadas
				.sort(compararCompletadas)
				.map(({ tarea, estado }): FilaDePendientes => ({ tarea, estado, completada: true, textoDeFecha: conTexto(tarea, estado) }))
		: [];
	const pausadasAlFinal = mostrarPausadas
		? pausadas.sort(compararPausadas).map((tarea): FilaDePendientes => ({ tarea, estado: { tipo: 'pausada' }, completada: false }))
		: [];
	return [...filas, ...alFinal, ...pausadasAlFinal];
}
