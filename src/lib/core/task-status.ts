import { completadosDeTarea } from './completions';
import type { Estado } from './status';
import { estadoPeriodicaConHorario, estadoPuntualConHorario } from './status-with-schedule';
import { estadoPeriodicaCalendario } from './recurring-calendar-status';
import { estadoPeriodicaRelativa } from './recurring-relative-status';
import { estadoPuntual } from './one-off-status';
import { comoRecienCreada, estaPausada } from './pause';
import { plazosConHorario } from './deadlines-with-schedule';
import { conPosposicion, pendienteOAtrasada, posposicionVigente } from './active-postponement';
import type { Completado, Posposicion, Tarea } from './task';

function estadoSinHorario(tarea: Tarea, deLaTarea: readonly Completado[], ahora: Date): Estado {
	if (tarea.tipo === 'puntual') return estadoPuntual(tarea.fechaLimite, deLaTarea, ahora);
	const { recurrencia } = tarea;
	if (recurrencia.modo === 'relativo') return estadoPeriodicaRelativa(recurrencia, deLaTarea, ahora);
	return estadoPeriodicaCalendario(recurrencia, tarea.creadaEn, deLaTarea, ahora);
}

/**
 * Estado derivado de una tarea (spec §3) a partir de todos los completados
 * del usuario: elige los de la tarea y aplica la regla de su tipo y su
 * recurrencia; con horario, la de §5.5–§5.7. Una pausada no tiene estado y una
 * reanudada se evalúa como recién creada en reanudadaEn (§5.8). Sobre ese estado
 * se aplica la posposición (§5.9). Es el único punto de entrada del estado.
 */
export function estadoDeTarea(guardada: Tarea, completados: readonly Completado[], ahora: Date): Estado {
	return conPosposicion(estadoSegunSuRegla(guardada, completados, ahora), guardada, ahora);
}

/**
 * Spec §5.9: la posposición que tiene a la tarea en espera; ninguna si no está
 * pospuesta o si está en espera por su propia regla (ahí no cambia nada).
 */
export function esperaPorPosposicion(guardada: Tarea, completados: readonly Completado[], ahora: Date): Posposicion | undefined {
	const vigente = posposicionVigente(guardada, ahora);
	return vigente && pendienteOAtrasada(estadoSegunSuRegla(guardada, completados, ahora)) ? vigente : undefined;
}

/** El estado de §5.1–§5.8, sin la posposición. */
function estadoSegunSuRegla(guardada: Tarea, completados: readonly Completado[], ahora: Date): Estado {
	if (estaPausada(guardada)) return { tipo: 'pausada' };
	const { tarea, propios: deLaTarea } = comoRecienCreada(guardada, completadosDeTarea(completados, guardada.id));
	const { horario } = tarea;
	if (!horario) return estadoSinHorario(tarea, deLaTarea, ahora);
	if (tarea.tipo === 'puntual') return estadoPuntualConHorario({ ...tarea, horario }, deLaTarea, ahora);
	return estadoPeriodicaConHorario(plazosConHorario(tarea, horario, deLaTarea), ahora);
}
