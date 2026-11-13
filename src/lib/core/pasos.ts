// Spec §4.1 (Pasos): la lista de pasos de una tarea. El primer paso es el
// paso 1 y `pasos` guarda los pasos 2, 3… en el orden escrito.
import { normalizarNota } from './nota';
import type { Tarea } from './tarea';

/** Los campos de la lista de pasos, como se guardan: sin el campo, no hay. */
export interface CamposDePasos {
	primerPaso?: string;
	pasos?: string[];
}

type ConPasos = Pick<Tarea, 'primerPaso' | 'pasos'>;

const conTexto = (paso: string | undefined): paso is string => paso !== undefined;

/**
 * Spec §4.1 (Pasos: Texto): cada paso se recorta; los vacíos o de solo
 * espacios se descartan y los de abajo suben, también al lugar del primer
 * paso. Sin pasos más allá del primero, no hay campo pasos. Nunca inválido.
 */
export function normalizarPasos(primerPaso = '', pasos: readonly string[] = []): CamposDePasos {
	const [primero, ...resto] = [primerPaso, ...pasos].map(normalizarNota).filter(conTexto);
	return { ...(primero && { primerPaso: primero }), ...(resto.length > 0 && { pasos: resto }) };
}

/** Spec §4.1: los pasos de la tarea, el primer paso como paso 1; sin primer paso, ninguno. */
export function pasosDeLaTarea({ primerPaso, pasos = [] }: ConPasos): string[] {
	return primerPaso ? [primerPaso, ...pasos] : [];
}

/** Spec §4.1: la tarea tiene dos pasos o más (primer paso y al menos un paso en pasos). */
export function tieneVariosPasos(tarea: ConPasos): boolean {
	return pasosDeLaTarea(tarea).length > 1;
}

/** Spec §4.1 (Pasos: Avance): un número de paso con el tope del último paso, y nunca menos que el paso 1. */
export function pasoConTope(tarea: ConPasos, paso: number): number {
	return Math.max(1, Math.min(paso, pasosDeLaTarea(tarea).length));
}

/** Spec §4.1 (Pasos: Avance): el paso en que va la tarea; sin pasoActual, el 1; si quedan menos pasos, el último. */
export function pasoEnQueVa(tarea: ConPasos & Pick<Tarea, 'pasoActual'>): number {
	return pasoConTope(tarea, tarea.pasoActual ?? 1);
}
