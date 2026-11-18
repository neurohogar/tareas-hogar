// Spec §4.1: emoji, note, first step and minimal version are optional; without the field, the task does not have them.

export interface TextFields {
	emoji?: string;
	note?: string;
	firstStep?: string;
	minimalVersion?: string;
}

/** Only the fields with a value: empty or absent means without the field (never a key set to undefined or ''). */
export function textFields({ emoji, note, firstStep, minimalVersion }: TextFields): TextFields {
	return { ...(emoji && { emoji }), ...(note && { note }), ...(firstStep && { firstStep }), ...(minimalVersion && { minimalVersion }) };
}
