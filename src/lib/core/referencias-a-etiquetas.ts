// Spec §4.3 y §7: los cambios que la app hace a las etiquetas de una tarea al
// borrar, fusionar o limpiar etiquetas.
//
// No son ediciones del usuario. La edición reemplaza el campo entero y gana el
// último cambio (§7: no se unen los agregados de dos dispositivos); estos
// cambios tocan solo los ids que nombran, así no deshacen una edición
// concurrente del resto del campo. Si esa edición vuelve a poner un id
// quitado, queda una referencia rota, que se ignora y se limpia (§7).

/** Quitar unos ids de las etiquetas de una tarea y poner otros, sin repetir. */
export interface CambioDeReferencias {
	tareaId: string;
	quitar: string[];
	poner: string[];
}

/**
 * Las etiquetas de la tarea tras el cambio: sin las quitadas, con las puestas
 * al final si no estaban (como arrayRemove seguido de arrayUnion).
 */
export function aplicarReferencias(ids: readonly string[] = [], { quitar, poner }: Pick<CambioDeReferencias, 'quitar' | 'poner'>): string[] {
	return [...new Set([...ids.filter((id) => !quitar.includes(id)), ...poner])];
}
