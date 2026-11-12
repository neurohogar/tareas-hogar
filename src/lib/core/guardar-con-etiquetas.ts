// Spec §6.2 y §4.3: guardar el panel con las etiquetas escritas. Las
// etiquetas nuevas se crean solo si se guarda: una creación o edición
// rechazada (por cualquier campo) no crea ninguna.
import type { ErroresDeCreacion } from './creacion';
import { crearSegunDatos, type DatosDeTarea } from './datos-de-tarea';
import type { CambioDeTarea } from './documento-de-tarea';
import { editar } from './edicion';
import type { Etiqueta } from './etiqueta';
import { elegirEtiquetas, guardarElegidas, type EleccionDeEtiquetas } from './etiquetas-escritas';
import { idsDeEtiquetas, type Tarea } from './tarea';

export interface EtiquetasAlGuardar {
	/** Las etiquetas que existen al guardar. */
	existentes: readonly Etiqueta[];
	/** Da el id de cada etiqueta nueva. */
	nuevoId: () => string;
}

type Rechazo = { ok: false; errores: ErroresDeCreacion };
export type CreacionConEtiquetas = { ok: true; tarea: Tarea; nuevas: Etiqueta[] } | Rechazo;
export type EdicionConEtiquetas = { ok: true; cambio: CambioDeTarea; nuevas: Etiqueta[] } | Rechazo;

/** Los errores de los otros campos junto con el de las etiquetas. */
function rechazo(campos: { ok: true } | Rechazo, eleccion: EleccionDeEtiquetas): Rechazo {
	return {
		ok: false,
		errores: { ...(!campos.ok && campos.errores), ...(!eleccion.ok && { etiquetas: eleccion.error }) }
	};
}

export function crearConEtiquetas(
	datos: DatosDeTarea,
	escritas: readonly string[],
	id: string,
	ahora: Date,
	{ existentes, nuevoId }: EtiquetasAlGuardar
): CreacionConEtiquetas {
	const creacion = crearSegunDatos(datos, id, ahora);
	const eleccion = elegirEtiquetas(escritas, existentes);
	if (!creacion.ok || !eleccion.ok) return rechazo(creacion, eleccion);
	const { ids, nuevas } = guardarElegidas(eleccion.elegidas, nuevoId);
	return { ok: true, tarea: ids.length > 0 ? { ...creacion.tarea, etiquetas: ids } : creacion.tarea, nuevas };
}

const mismasEtiquetas = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id) => b.includes(id));

/**
 * Como `editar` (§6.2), y la tarea queda exactamente con las etiquetas
 * escritas. El campo etiquetas se escribe entero, y solo si cambió (§7).
 * `ahora`, el momento de guardar, reanuda la pausada que pasa a puntual (§5.8).
 */
export function editarConEtiquetas(
	tarea: Tarea,
	datos: DatosDeTarea,
	escritas: readonly string[],
	{ existentes, nuevoId }: EtiquetasAlGuardar,
	ahora?: Date
): EdicionConEtiquetas {
	const edicion = editar(tarea, datos, ahora);
	const eleccion = elegirEtiquetas(escritas, existentes);
	if (!edicion.ok || !eleccion.ok) return rechazo(edicion, eleccion);
	const { ids, nuevas } = guardarElegidas(eleccion.elegidas, nuevoId);
	const cambio = mismasEtiquetas(idsDeEtiquetas(tarea), ids) ? edicion.cambio : { ...edicion.cambio, etiquetas: ids };
	return { ok: true, cambio, nuevas };
}
