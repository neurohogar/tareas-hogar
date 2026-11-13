// Spec §4.1: emoji, nota y primer paso son opcionales; sin el campo, la tarea no los tiene.

export interface CamposDeTexto {
	emoji?: string;
	nota?: string;
	primerPaso?: string;
}

/** Solo los campos con valor: vacío o ausente es sin el campo (nunca una clave en undefined ni ''). */
export function camposDeTexto({ emoji, nota, primerPaso }: CamposDeTexto): CamposDeTexto {
	return { ...(emoji && { emoji }), ...(nota && { nota }), ...(primerPaso && { primerPaso }) };
}
