// Spec §4.3 (borrar una etiqueta) y §7 (Etiqueta borrada).
import type { Etiqueta } from './etiqueta';
import type { CambioDeReferencias } from './referencias-a-etiquetas';
import { idsDeEtiquetas, tieneEtiqueta, type Tarea } from './tarea';

/** Lo que se escribe al borrar: la etiqueta, y quitarla de las tareas que la tienen. */
export interface BorradoDeEtiqueta {
	etiquetaId: string;
	referencias: CambioDeReferencias[];
}

/** Borrar una etiqueta la quita de todas las tareas; las tareas no se borran. */
export function borradoDeEtiqueta(etiquetaId: string, tareas: readonly Tarea[]): BorradoDeEtiqueta {
	return {
		etiquetaId,
		referencias: tareas
			.filter((tarea) => tieneEtiqueta(tarea, etiquetaId))
			.map(({ id }) => ({ tareaId: id, quitar: [etiquetaId], poner: [] }))
	};
}

/**
 * Las tareas que referencian etiquetas que ya no existen (otro dispositivo,
 * sin conexión, se las asignó después de borradas): esas referencias se
 * ignoran y se limpian, quitándolas.
 */
export function referenciasRotas(tareas: readonly Tarea[], etiquetas: readonly Etiqueta[]): CambioDeReferencias[] {
	const existe = (id: string) => etiquetas.some((etiqueta) => etiqueta.id === id);
	return tareas.flatMap((tarea) => {
		const quitar = idsDeEtiquetas(tarea).filter((id) => !existe(id));
		return quitar.length > 0 ? [{ tareaId: tarea.id, quitar, poner: [] }] : [];
	});
}
