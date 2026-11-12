// Spec §6.2 (Cambios sin guardar): Guardar con texto sin confirmar en Etiquetas.
// Guardar no crea esa etiqueta, pero un nombre inválido lo hace fallar.
import type { FormularioDelPanel } from './cambios-sin-guardar';
import type { ErroresDeCreacion } from './creacion';
import { validarNombre, type ErrorDeNombre } from './etiqueta';
import { crearConEtiquetas, editarConEtiquetas, type CreacionConEtiquetas, type EdicionConEtiquetas, type EtiquetasAlGuardar } from './guardar-con-etiquetas';
import type { Tarea } from './tarea';

/** Spec §6.2 y §4.3: el nombre inválido escrito sin confirmar; vacío o solo espacios no es un nombre. */
function errorDeSinConfirmar(sinConfirmar: string): ErrorDeNombre | undefined {
	const validado = validarNombre(sinConfirmar);
	return validado.ok || validado.error === 'vacio' ? undefined : validado.error;
}

/** El resultado de Guardar, o el rechazo que suma el error del texto sin confirmar. */
function conSinConfirmar<R extends CreacionConEtiquetas | EdicionConEtiquetas>(resultado: R, sinConfirmar: string): R | { ok: false; errores: ErroresDeCreacion } {
	const etiquetas = errorDeSinConfirmar(sinConfirmar);
	if (!etiquetas) return resultado;
	return { ok: false, errores: { ...(!resultado.ok && resultado.errores), etiquetas } };
}

/** Spec §6.2: Guardar al editar, desde el panel o un aviso; `ahora` es el momento de guardar. */
export function editarDesdePanel(tarea: Tarea, { datos, etiquetas, sinConfirmar }: FormularioDelPanel, alGuardar: EtiquetasAlGuardar, ahora: Date): EdicionConEtiquetas {
	return conSinConfirmar(editarConEtiquetas(tarea, datos, [...etiquetas], alGuardar, ahora), sinConfirmar);
}

/** Spec §6.2: Guardar al crear, desde el panel o el aviso de cierre. */
export function crearDesdePanel({ datos, etiquetas, sinConfirmar }: FormularioDelPanel, id: string, ahora: Date, alGuardar: EtiquetasAlGuardar): CreacionConEtiquetas {
	return conSinConfirmar(crearConEtiquetas(datos, [...etiquetas], id, ahora, alGuardar), sinConfirmar);
}
