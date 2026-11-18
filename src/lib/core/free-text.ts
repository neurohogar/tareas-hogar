// Spec §4.1: the note, the first step, the steps and the minimal version are free text, with no maximum length and never invalid.

/** Trims the start and the end; empty or only spaces is no text (undefined). */
export function trimText(text: string): string | undefined {
	return text.trim() || undefined;
}
