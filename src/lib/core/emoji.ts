// Spec §4.1: el emoji de una tarea es un único grafema emoji. GRAFEMA_EMOJI
// describe un grafema completo, así que solo lo cumple un texto de exactamente uno.

/** Resultado de leer lo escrito en el campo Emoji: sin `emoji` es "sin emoji". */
export type LecturaDeEmoji = { ok: true; emoji?: string } | { ok: false };

/** Un pictograma, con tono de piel o selector de variación; las secuencias ZWJ unen varios. */
const PICTOGRAMA = String.raw`\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?`;
/** Bandera de subdivisión (🏴 + etiquetas + cancelar): las etiquetas solo valen tras la bandera negra. */
const BANDERA_DE_SUBDIVISION = String.raw`\u{1F3F4}[\u{E0020}-\u{E007E}]+\u{E007F}`;
const BANDERA = String.raw`\p{Regional_Indicator}{2}`;
const KEYCAP = String.raw`[0-9#*]\uFE0F?\u20E3`;
/** Spec §4.1: las formas de un grafema emoji, como alternativas de una expresión regular. */
export const FORMAS_DE_EMOJI = `${BANDERA_DE_SUBDIVISION}|${BANDERA}|${KEYCAP}|${PICTOGRAMA}(?:\\u200D${PICTOGRAMA})*`;
const GRAFEMA_EMOJI = new RegExp(`^(?:${FORMAS_DE_EMOJI})$`, 'u');

/** Vacío o solo espacios es sin emoji; si no, tiene que ser exactamente un grafema emoji. */
export function leerEmoji(texto: string): LecturaDeEmoji {
	const emoji = texto.trim();
	if (emoji === '') return { ok: true };
	return GRAFEMA_EMOJI.test(emoji) ? { ok: true, emoji } : { ok: false };
}
