// Spec §4.1: the emoji of a task is a single emoji grapheme. EMOJI_GRAPHEME
// describes a whole grapheme, so only a text of exactly one satisfies it.

/** Result of reading what is written in the Emoji field: without `emoji` it is "no emoji". */
export type EmojiReading = { ok: true; emoji?: string } | { ok: false };

/** A pictogram, with skin tone or variation selector; ZWJ sequences join several. */
const PICTOGRAM = String.raw`\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?`;
/** Subdivision flag (🏴 + tags + cancel): the tags are valid only after the black flag. */
const SUBDIVISION_FLAG = String.raw`\u{1F3F4}[\u{E0020}-\u{E007E}]+\u{E007F}`;
const FLAG = String.raw`\p{Regional_Indicator}{2}`;
const KEYCAP = String.raw`[0-9#*]\uFE0F?\u20E3`;
/** Spec §4.1: the shapes of an emoji grapheme, as alternatives of a regular expression. */
export const EMOJI_SHAPES = `${SUBDIVISION_FLAG}|${FLAG}|${KEYCAP}|${PICTOGRAM}(?:\\u200D${PICTOGRAM})*`;
const EMOJI_GRAPHEME = new RegExp(`^(?:${EMOJI_SHAPES})$`, 'u');

/** Empty or only spaces is no emoji; otherwise, it has to be exactly one emoji grapheme. */
export function readEmoji(text: string): EmojiReading {
	const emoji = text.trim();
	if (emoji === '') return { ok: true };
	return EMOJI_GRAPHEME.test(emoji) ? { ok: true, emoji } : { ok: false };
}
