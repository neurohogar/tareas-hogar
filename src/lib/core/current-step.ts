// Spec §4.1 (Pasos: Avance, Completar, Deshacer) y §6.1: el paso en que va la
// tarea, cómo lo muestra la fila y qué lo mueve. Solo «Hecho», «Paso
// anterior», completar y borrar un completado lo cambian.
import { accionDelCheckbox } from './checkbox';
import { completadoMasReciente, completadosDeTarea } from './completions';
import type { CambioDeTarea } from './task-document';
import type { Estado } from './status';
import { pasoConTope, pasoEnQueVa, pasosDeLaTarea, tieneVariosPasos } from './steps';
import type { Completado, Tarea } from './task';

/** Qué hace tocar «Hecho»: pasar al paso siguiente, completar la tarea como el checkbox, o nada (deshabilitado). */
export type AccionDeHecho = { tipo: 'avanzar'; cambio: CambioDeTarea } | { tipo: 'completar' } | { tipo: 'ninguna' };

/** Los botones de la línea del paso: «Paso anterior» (si se ve) y si «Hecho» está habilitado. */
export interface BotonesDePaso {
	pasoAnterior: boolean;
	hechoHabilitado: boolean;
}

/** Spec §6.1: la línea del paso y la de la mínima solo se ven en las filas pendiente o atrasada. */
export const lineaVisible = ({ tipo }: Pick<Estado, 'tipo'>) => tipo === 'pendiente' || tipo === 'atrasada';

/** Sin el campo es el paso 1 (§4.1): ir al 1 lo quita; si ya va en ese paso guardado, no se escribe nada. */
function cambioAPaso({ pasoActual }: Tarea, paso: number): CambioDeTarea {
	const alUno = paso === 1;
	if (alUno ? pasoActual === undefined : pasoActual === paso) return {};
	return { pasoActual: alUno ? null : paso };
}

/** Spec §6.1: «Primer paso: …» si va en el paso 1, «Paso: …» si va en otro, completo; solo en filas pendiente o atrasada. */
export function textoDelPaso(tarea: Tarea, estado: Pick<Estado, 'tipo'>): string | undefined {
	const pasos = pasosDeLaTarea(tarea);
	if (pasos.length === 0 || !lineaVisible(estado)) return undefined;
	const paso = pasoEnQueVa(tarea);
	return (paso === 1 ? 'Primer paso: ' : 'Paso: ') + pasos[paso - 1];
}

/**
 * Spec §4.1 y §6.1: en una tarea de dos pasos o más, «Hecho» pasa al paso
 * siguiente; en el último completa la tarea exactamente como el checkbox, y
 * si el checkbox está deshabilitado (§5.5), no hace nada.
 */
export function accionDeHecho(tarea: Tarea, completados: readonly Completado[], ahora: Date): AccionDeHecho {
	const cantidad = pasosDeLaTarea(tarea).length;
	const paso = pasoEnQueVa(tarea);
	if (cantidad < 2) return { tipo: 'ninguna' };
	if (paso < cantidad) return { tipo: 'avanzar', cambio: cambioAPaso(tarea, paso + 1) };
	return accionDelCheckbox(tarea, completados, ahora).tipo === 'completar' ? { tipo: 'completar' } : { tipo: 'ninguna' };
}

/** Spec §4.1 y §6.1: «Paso anterior» vuelve al paso de antes; no pasa del primero. */
export function cambioDePasoAnterior(tarea: Tarea): CambioDeTarea {
	return cambioAPaso(tarea, Math.max(1, pasoEnQueVa(tarea) - 1));
}

/** Spec §6.1: con dos pasos o más y la línea visible, «Paso anterior» (no en el paso 1) y «Hecho», habilitado según accionDeHecho. */
export function botonesDePaso(tarea: Tarea, estado: Pick<Estado, 'tipo'>, completados: readonly Completado[], ahora: Date): BotonesDePaso | undefined {
	if (!tieneVariosPasos(tarea) || !lineaVisible(estado)) return undefined;
	return { pasoAnterior: pasoEnQueVa(tarea) > 1, hechoHabilitado: accionDeHecho(tarea, completados, ahora).tipo !== 'ninguna' };
}

/** Spec §4.1 (Pasos: Completar): completar la tarea, por el checkbox, por «Hecho» o por «Hice la mínima», la vuelve al paso 1. */
export function cambioAlCompletar(tarea: Tarea): CambioDeTarea {
	return cambioAPaso(tarea, 1);
}

/**
 * Spec §4.1 (Pasos: Deshacer) y §5.4: borrar el completado más reciente de una
 * tarea de dos pasos o más (aviso, Historial o checkbox) devuelve pasoActual a
 * su pasoAlCompletar, con el tope del último paso. Borrar otro, o uno sin
 * pasoAlCompletar, no lo cambia. `completados` puede incluir o no al borrado.
 */
export function cambioAlBorrarCompletado(tarea: Tarea, completados: readonly Completado[], borrado: Completado): CambioDeTarea {
	const { pasoAlCompletar } = borrado;
	if (pasoAlCompletar === undefined || !tieneVariosPasos(tarea)) return {};
	const masReciente = completadoMasReciente([borrado, ...completadosDeTarea(completados, tarea.id)]);
	return masReciente === borrado ? cambioAPaso(tarea, pasoConTope(tarea, pasoAlCompletar)) : {};
}
