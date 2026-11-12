// Spec §7 (Etiquetas duplicadas): dos dispositivos sin conexión crean o
// renombran etiquetas a un mismo nombre (sin distinguir mayúsculas).
import { compararIds } from './comparar-ids';
import { mismoNombre, type Etiqueta } from './etiqueta';
import type { CambioDeReferencias } from './referencias-a-etiquetas';
import { idsDeEtiquetas, type Tarea } from './tarea';

/** Lo que se escribe al fusionar: las etiquetas que se borran y, en cada tarea afectada, cuáles se reemplazan por cuál. */
export interface FusionDeEtiquetas {
	borradas: string[];
	referencias: CambioDeReferencias[];
}

/** La de id menor entre las que tienen el mismo nombre que esta (ella incluida). */
function sobreviviente(etiqueta: Etiqueta, etiquetas: readonly Etiqueta[]): string {
	return etiquetas
		.filter((otra) => mismoNombre(otra.nombre, etiqueta.nombre))
		.map(({ id }) => id)
		.sort(compararIds)[0];
}

/**
 * Sobrevive la de id menor, con su nombre y su color; las tareas que tenían
 * la otra pasan a tener la sobreviviente (sin repetirla), y la otra se borra.
 */
export function fusionDeDuplicadas(etiquetas: readonly Etiqueta[], tareas: readonly Tarea[]): FusionDeEtiquetas {
	const destino = new Map<string, string>();
	for (const etiqueta of etiquetas) {
		const id = sobreviviente(etiqueta, etiquetas);
		if (id !== etiqueta.id) destino.set(etiqueta.id, id);
	}
	const referencias = tareas.flatMap((tarea) => {
		const quitar = idsDeEtiquetas(tarea).filter((id) => destino.has(id));
		return quitar.length > 0 ? [{ tareaId: tarea.id, quitar, poner: [...new Set(quitar.map((id) => destino.get(id) as string))] }] : [];
	});
	return { borradas: [...destino.keys()], referencias };
}
