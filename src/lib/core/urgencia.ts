import { completadosDeTarea } from './completados';
import { sumarDias } from './dias';
import type { EstadoEnPendientes } from './estado';
import { instantePeriodicaConHorario, instantePuntualConHorario } from './estado-con-horario';
import { esperaPorPosposicion } from './estado-de-tarea';
import { proximaOcurrencia } from './estado-periodica-calendario';
import { instanteDeUrgenciaRelativa } from './estado-periodica-relativa';
import { comoRecienCreada } from './pausa';
import { plazosConHorario } from './plazos-con-horario';
import type { Completado, Tarea } from './tarea';

/** Un día límite (fecha límite o N) cuenta desde sus 00:00; atrasado, desde las 00:00 del día siguiente. */
const desdeElDia = (dia: Date, atrasada: boolean) => (atrasada ? sumarDias(dia, 1) : dia);

function instanteSinHorario(tarea: Tarea, deLaTarea: readonly Completado[], estado: EstadoEnPendientes): Date | undefined {
	const atrasada = estado.tipo === 'atrasada';
	if (tarea.tipo === 'puntual') return tarea.fechaLimite && desdeElDia(tarea.fechaLimite, atrasada);
	const { recurrencia } = tarea;
	if (recurrencia.modo === 'relativo') return instanteDeUrgenciaRelativa(recurrencia, tarea.creadaEn, deLaTarea, estado);
	return desdeElDia(proximaOcurrencia(recurrencia, tarea.creadaEn, deLaTarea), atrasada);
}

/**
 * Spec §6.1: el instante que ordena la tarea dentro de su grupo. Atrasada:
 * desde cuándo está atrasada; pendiente: desde cuándo está pendiente; en
 * espera: cuándo vuelve a pendiente. Una puntual pendiente sin fecha límite
 * no tiene instante (va al final de su grupo). Con horario, los de §5.5–§5.7.
 * De una reanudada, como recién creada en reanudadaEn (§5.8). En espera por una
 * posposición, vuelve en hasta (§5.9).
 */
export function instanteDeUrgencia(
	guardada: Tarea,
	completados: readonly Completado[],
	estado: EstadoEnPendientes,
	ahora: Date
): Date | undefined {
	const posposicion = esperaPorPosposicion(guardada, completados, ahora);
	if (posposicion) return posposicion.hasta;
	const { tarea, propios: deLaTarea } = comoRecienCreada(guardada, completadosDeTarea(completados, guardada.id));
	const { horario } = tarea;
	if (!horario) return instanteSinHorario(tarea, deLaTarea, estado);
	if (tarea.tipo === 'puntual') return instantePuntualConHorario({ ...tarea, horario }, estado, ahora);
	return instantePeriodicaConHorario(plazosConHorario(tarea, horario, deLaTarea), estado);
}
