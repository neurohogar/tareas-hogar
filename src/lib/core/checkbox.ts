// Spec §6.1: qué hace tocar el checkbox de una fila de Pendientes.
import { completadoMasReciente, completadosDeTarea } from './completados';
import { estaCompletada } from './completada';
import { inicioDelDia } from './dias';
import { dentroDelHorario } from './horario';
import { comoRecienCreada, estaPausada } from './pausa';
import type { Completado, Tarea } from './tarea';

/** "ninguna": el checkbox está deshabilitado (completaría fuera de la ventana, §5.5, o la tarea está pausada, §5.8). */
export type AccionDelCheckbox = { tipo: 'completar' } | { tipo: 'borrar'; completado: Completado } | { tipo: 'ninguna' };

/** Spec §5.5: con horario, solo se completa dentro de alguna de sus ventanas. */
function completarSiSePuede({ horario }: Tarea, ahora: Date): AccionDelCheckbox {
	return !horario || dentroDelHorario(horario, ahora) ? { tipo: 'completar' } : { tipo: 'ninguna' };
}

/**
 * Una tarea no completada se completa. De una completada se borra el
 * completado más reciente (como Deshacer, §5.4) si es puntual, o si es
 * periódica y ese completado es de hoy o posterior (día local de completadoEn);
 * una periódica completada un día anterior se completa de nuevo. Completar
 * fuera de la ventana de su horario no es posible; borrar, a cualquier hora.
 * De una pausada, nada; de una reanudada, solo cuentan los completados desde
 * reanudadaEn (§5.8).
 */
export function accionDelCheckbox(tarea: Tarea, completados: readonly Completado[], ahora: Date): AccionDelCheckbox {
	if (estaPausada(tarea)) return { tipo: 'ninguna' };
	const { propios } = comoRecienCreada(tarea, completadosDeTarea(completados, tarea.id));
	if (!estaCompletada(tarea, completados, ahora)) return completarSiSePuede(tarea, ahora);
	const masReciente = completadoMasReciente(propios);
	const deHoyOPosterior = masReciente.completadoEn.getTime() >= inicioDelDia(ahora).getTime();
	if (tarea.tipo === 'puntual' || deHoyOPosterior) return { tipo: 'borrar', completado: masReciente };
	return completarSiSePuede(tarea, ahora);
}

/** Spec §6.1 y §5.8: deshabilitado si tocarlo completaría fuera de la ventana, o si la tarea está pausada. */
export function checkboxHabilitado(tarea: Tarea, completados: readonly Completado[], ahora: Date): boolean {
	return accionDelCheckbox(tarea, completados, ahora).tipo !== 'ninguna';
}
