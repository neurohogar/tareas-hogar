// Spec §4.1 (Versión mínima) y §6.1: la línea «Mínima: …» de la fila y su
// botón «Hice la mínima», que completa la tarea como el checkbox.
import { accionDelCheckbox } from './checkbox';
import { clasificarEnPendientes } from './completed';
import { completar } from './completions';
import type { Estado } from './status';
import { lineaVisible } from './current-step';
import type { Completado, Tarea } from './task';

/** Lo que la fila muestra de la mínima: la línea con su prefijo y si «Hice la mínima» está habilitado. */
export interface LineaDeMinima {
	texto: string;
	habilitado: boolean;
}

/**
 * Spec §6.1: con versión mínima y la fila pendiente o atrasada, «Mínima: »
 * y el texto completo; el botón está habilitado si el checkbox completaría
 * (§5.5). En cualquier otra fila, ninguna.
 */
export function lineaDeMinima(tarea: Tarea, estado: Pick<Estado, 'tipo'>, completados: readonly Completado[], ahora: Date): LineaDeMinima | undefined {
	if (tarea.versionMinima === undefined || !lineaVisible(estado)) return undefined;
	return { texto: `Mínima: ${tarea.versionMinima}`, habilitado: accionDelCheckbox(tarea, completados, ahora).tipo === 'completar' };
}

/**
 * Spec §6.1 y §4.4: tocar «Hice la mínima» agrega el completado de `completar`
 * con fueMinima en true; si la fila no la ofrece o el botón está deshabilitado,
 * no completa (undefined).
 */
export function hacerLaMinima(tarea: Tarea, completados: readonly Completado[], id: string, ahora: Date): Completado | undefined {
	const { estado } = clasificarEnPendientes(tarea, completados, ahora);
	const linea = lineaDeMinima(tarea, estado, completados, ahora);
	return linea?.habilitado ? completar(tarea, completados, id, ahora, true) : undefined;
}
