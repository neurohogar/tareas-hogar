// Spec §5.4: el aviso con Deshacer que aparece al completar. Hay uno solo: el
// del último completado de este dispositivo (completar otra vez lo reemplaza).
import { nombreDeTarea } from './nombre-de-tarea';
import type { Completado, Tarea } from './tarea';

export interface Aviso {
	/** El nombre de la tarea al completarla (§4.1): el aviso la nombra aunque después se borre. */
	nombre: string;
	/** El completado que ofrece deshacer. */
	completado: Completado;
}

export const DURACION_DEL_AVISO_MS = 5_000;

export function avisoAlCompletar(tarea: Tarea, completado: Completado): Aviso {
	return { nombre: nombreDeTarea(tarea), completado };
}

/** El aviso, si se ve ahora: mientras completadoEn <= ahora < completadoEn + 5 s. */
export function avisoVisible(aviso: Aviso | undefined, ahora: Date): Aviso | undefined {
	if (!aviso) return undefined;
	const desde = aviso.completado.completadoEn.getTime();
	const visible = desde <= ahora.getTime() && ahora.getTime() < desde + DURACION_DEL_AVISO_MS;
	return visible ? aviso : undefined;
}

/** Los ms que le quedan al aviso hasta desaparecer solo. */
export function msHastaQueVence(aviso: Aviso, ahora: Date): number {
	return aviso.completado.completadoEn.getTime() + DURACION_DEL_AVISO_MS - ahora.getTime();
}

/**
 * Deshacer en el aviso: el completado que hay que borrar (solo el que nombra
 * el aviso), o undefined si el aviso ya no se ve. En los dos casos el aviso se
 * cierra. Si ese completado ya no existe (otro dispositivo lo borró, o borró
 * su tarea), borrarlo no hace nada: no hace falta esperar a que llegue.
 */
export function completadoADeshacer(aviso: Aviso | undefined, ahora: Date): Completado | undefined {
	return avisoVisible(aviso, ahora)?.completado;
}
