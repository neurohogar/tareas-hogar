// Spec §6.2 y §6.4: los textos de los errores de nombre de etiqueta, los mismos en el panel y en la pantalla Etiquetas.
import type { ErrorDeRenombrado } from '$lib/core/gestion-de-etiquetas';

export const MENSAJES_DE_NOMBRE: Record<ErrorDeRenombrado, string> = {
	vacio: 'El nombre no puede estar vacío',
	largo: 'El nombre puede tener hasta 30 caracteres',
	repetido: 'Ya existe una etiqueta con ese nombre'
};
