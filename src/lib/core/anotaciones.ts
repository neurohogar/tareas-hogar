// Spec §6.7 (Anotaciones): qué anotaciones se ven, en qué orden y agrupadas por día.
import type { Anotacion } from './anotacion';
import { anotacionConTareaExistente } from './borrado';
import { compararIds } from './comparar-ids';
import { encabezadoDelDia, horaEnTexto } from './fechas-en-texto';
import { nombreDeTarea } from './nombre-de-tarea';
import type { Tarea } from './tarea';

/** Una anotación que la pantalla muestra, con el nombre actual de su tarea. */
export interface AnotacionVisible {
	anotacion: Anotacion;
	/** «emoji título» de la tarea como es ahora (§4.1); sin tarea, no está. */
	nombreDeTarea?: string;
}

export interface EntradaDeAnotaciones extends AnotacionVisible {
	/** "HH:MM" de anotadaEn. */
	hora: string;
}

export interface GrupoDeAnotaciones {
	/** "Hoy", "Ayer" o la fecha del día, como en el Historial. */
	encabezado: string;
	entradas: EntradaDeAnotaciones[];
}

/**
 * Spec §6.7: las anotaciones con tarea existente o sin tarea (sin las huérfanas
 * ni las de tareas borradas), en el orden de anotadaEn que pide compararInstantes
 * (si empatan, primero la de id menor), cada una con el nombre actual de su tarea.
 */
export function anotacionesVisibles(tareas: readonly Tarea[], anotaciones: readonly Anotacion[], compararInstantes: (a: Date, b: Date) => number): AnotacionVisible[] {
	const porId = new Map(tareas.map((tarea) => [tarea.id, tarea]));
	return anotaciones
		.filter((anotacion) => anotacionConTareaExistente(tareas, anotacion))
		.sort((a, b) => compararInstantes(a.anotadaEn, b.anotadaEn) || compararIds(a.id, b.id))
		.map((anotacion) => {
			const tarea = anotacion.tareaId === undefined ? undefined : porId.get(anotacion.tareaId);
			return tarea ? { anotacion, nombreDeTarea: nombreDeTarea(tarea) } : { anotacion };
		});
}

const masRecientePrimero = (a: Date, b: Date) => b.getTime() - a.getTime();

/**
 * Spec §6.7: de la más reciente a la más antigua (si empatan, primero la de id
 * menor), agrupadas por día local con los encabezados del Historial.
 */
export function anotacionesEnPantalla(tareas: readonly Tarea[], anotaciones: readonly Anotacion[], ahora: Date): GrupoDeAnotaciones[] {
	const grupos: GrupoDeAnotaciones[] = [];
	for (const visible of anotacionesVisibles(tareas, anotaciones, masRecientePrimero)) {
		const { anotadaEn } = visible.anotacion;
		const encabezado = encabezadoDelDia(anotadaEn, ahora);
		const entrada = { ...visible, hora: horaEnTexto(anotadaEn) };
		// Cada día tiene un encabezado distinto: entradas seguidas con el mismo encabezado son del mismo día.
		const ultimo = grupos.at(-1);
		if (ultimo?.encabezado === encabezado) ultimo.entradas.push(entrada);
		else grupos.push({ encabezado, entradas: [entrada] });
	}
	return grupos;
}
