// Spec §6.3 (Historial).
import { compararIds } from './comparar-ids';
import { encabezadoDelDia, horaEnTexto } from './fechas-en-texto';
import type { Completado, Tarea } from './tarea';

export interface EntradaDelHistorial {
	completado: Completado;
	/** La tarea como es ahora: la entrada muestra su título actual. */
	tarea: Tarea;
	/** "HH:MM" de completadoEn. */
	hora: string;
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
		const entrada = { completado, tarea, hora: horaEnTexto(completado.completadoEn) };
		// Cada día tiene un encabezado distinto: entradas seguidas con el mismo encabezado son del mismo día.
		const ultimo = grupos.at(-1);
		if (ultimo?.encabezado === encabezado) ultimo.entradas.push(entrada);
		else grupos.push({ encabezado, entradas: [entrada] });
	}
	return grupos;
}
