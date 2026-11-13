// Spec §6.1 (Fecha y distancia): los instantes que nombran «Tocaba …» (desde
// cuándo toca una atrasada) y «Vuelve …» (cuándo vuelve a pendiente una en espera).
import { completadosDeTarea } from './completados';
import type { Estado } from './estado';
import { proximaOcurrencia } from './estado-periodica-calendario';
import { instanteDeUrgenciaRelativa } from './estado-periodica-relativa';
import { comoRecienCreada } from './pausa';
import { plazosConHorario } from './plazos-con-horario';
import { posposicionVigente } from './posposicion-vigente';
import type { Completado, Tarea } from './tarea';
import { instanteDeUrgencia } from './urgencia';

export type EstadoEnEspera = Extract<Estado, { tipo: 'en espera' }>;

/** Sin horario: la fecha límite, V (o creadaEn, nunca completada) o las 00:00 de N. */
function tocabaSinHorario(tarea: Tarea, deLaTarea: readonly Completado[]): Date | undefined {
	if (tarea.tipo === 'puntual') return tarea.fechaLimite;
	const { recurrencia } = tarea;
	if (recurrencia.modo === 'relativo') return instanteDeUrgenciaRelativa(recurrencia, tarea.creadaEn, deLaTarea, { tipo: 'pendiente' });
	return proximaOcurrencia(recurrencia, tarea.creadaEn, deLaTarea);
}

/**
 * Spec §6.1: desde cuándo toca la tarea. Puntual: el día de la fecha límite,
 * tenga o no horario (sin fecha límite, ninguno). Relativa: V. Calendario: el
 * día de N. Una periódica con horario, A, salvo que A todavía no haya llegado:
 * ahí, el instante sin horario (nunca es un instante futuro). De una reanudada,
 * como recién creada (§5.8).
 */
export function instanteDeTocaba(guardada: Tarea, completados: readonly Completado[], ahora: Date): Date | undefined {
	const { tarea, propios } = comoRecienCreada(guardada, completadosDeTarea(completados, guardada.id));
	const sinHorario = tocabaSinHorario(tarea, propios);
	if (tarea.tipo === 'puntual' || !tarea.horario) return sinHorario;
	const { disponible } = plazosConHorario(tarea, tarea.horario, propios);
	return disponible <= ahora.getTime() ? new Date(disponible) : sinHorario;
}

/**
 * Spec §6.1: cuándo vuelve a pendiente una tarea en espera, el mismo instante que
 * la ordena (relativa, V; calendario, 00:00 de N; con horario, A; pospuesta,
 * hasta). Si una posposición y su propia regla la tienen en espera, el más tarde.
 */
export function instanteDeVuelve(tarea: Tarea, completados: readonly Completado[], estado: EstadoEnEspera, ahora: Date): Date {
	// En espera siempre hay un instante: el de su regla o, si solo la posposición la tiene en espera, su hasta.
	const porSuRegla = instanteDeUrgencia(tarea, completados, estado, ahora) as Date;
	const hasta = posposicionVigente(tarea, ahora)?.hasta;
	return hasta && hasta.getTime() > porSuRegla.getTime() ? hasta : porSuRegla;
}
