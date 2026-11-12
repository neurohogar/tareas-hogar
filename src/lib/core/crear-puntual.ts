import { crearTarea, type DatosComunes, type ResultadoDeCreacion } from './creacion';
import { leerDiaIso } from './dias';
import type { TareaPuntual } from './tarea';

export interface DatosPuntual extends DatosComunes {
	/** AAAA-MM-DD; sin el campo, la tarea no tiene fecha límite. */
	fechaLimite?: string;
}

/**
 * Spec §4.1: título no vacío y, si hay fecha límite, una fecha que existe en el
 * calendario. Se acepta una fecha límite pasada: la tarea queda atrasada.
 */
export function crearPuntual({ fechaLimite, ...comunes }: DatosPuntual, id: string, ahora: Date): ResultadoDeCreacion<TareaPuntual> {
	const dia = fechaLimite === undefined ? undefined : leerDiaIso(fechaLimite);
	const fechaInvalida = fechaLimite !== undefined && dia === undefined;
	return crearTarea<TareaPuntual>({ ...comunes, id, ahora }, fechaInvalida ? { fechaLimite: 'invalida' } : {}, () => ({
		tipo: 'puntual',
		...(dia && { fechaLimite: dia })
	}));
}
