// Spec §4.1: emoji, nota, primer paso y versión mínima son opcionales; sin el campo, la tarea no los tiene.

export interface TextFields {
	emoji?: string;
	note?: string;
	firstStep?: string;
	minimalVersion?: string;
}

/** Solo los campos con valor: vacío o ausente es sin el campo (nunca una clave en undefined ni ''). */
export function textFields({ emoji, note, firstStep, minimalVersion }: TextFields): TextFields {
	return { ...(emoji && { emoji }), ...(note && { note }), ...(firstStep && { firstStep }), ...(minimalVersion && { minimalVersion }) };
}
