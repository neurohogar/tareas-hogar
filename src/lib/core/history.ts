// Spec §6.3 (Historial).
import { compararIds } from './compare-ids';
import { encabezadoDelDia, horaEnTexto } from './dates-in-text';
import type { Completado, Tarea } from './task';

export interface EntradaDelHistorial {
	completado: Completado;
	/** La tarea como es ahora: la entrada muestra su título actual. */
	tarea: Tarea;
	/** "HH:MM" de completadoEn. */
	hora: string;
	/** Spec §6.3: la hora, con « Mínima» después si el completado fue la mínima ("08:05 Mínima"). */
	textoDeHora: string;
}

export interface GrupoDelHistorial {
	/** "Hoy", "Ayer" o la fecha del día. */
	encabezado: string;
	entradas: EntradaDelHistorial[];
}

/**
 * Del más reciente al más antiguo por completadoEn; si empatan, primero el de
 * id menor.
 */
function compararCompletados(a: Completado, b: Completado): number {
	return b.completadoEn.getTime() - a.completadoEn.getTime() || compararIds(a.id, b.id);
}

/**
 * Los completados de las tareas que existen (sin los de tareas borradas ni los
 * huérfanos), ordenados y agrupados por día local de completadoEn.
 */
export function historial(tareas: readonly Tarea[], completados: readonly Completado[], ahora: Date): GrupoDelHistorial[] {
	const porId = new Map(tareas.map((tarea) => [tarea.id, tarea]));
	const grupos: GrupoDelHistorial[] = [];
	for (const completado of [...completados].sort(compararCompletados)) {
		const tarea = porId.get(completado.tareaId);
		if (!tarea) continue;
		const encabezado = encabezadoDelDia(completado.completadoEn, ahora);
		const hora = horaEnTexto(completado.completadoEn);
		const entrada = { completado, tarea, hora, textoDeHora: completado.fueMinima ? `${hora} Mínima` : hora };
		// Cada día tiene un encabezado distinto: entradas seguidas con el mismo encabezado son del mismo día.
		const ultimo = grupos.at(-1);
		if (ultimo?.encabezado === encabezado) ultimo.entradas.push(entrada);
		else grupos.push({ encabezado, entradas: [entrada] });
	}
	return grupos;
}
