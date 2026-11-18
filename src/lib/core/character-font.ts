// Spec §6, "Qué se dibuja con qué": the font that draws each character according to what
// each one has. The characters the app receives are free text, so nothing is rejected here:
// the validity of an emoji belongs to readEmoji (§4.1) and bundling does not change it.
import { EMOJI_SHAPES } from './emoji';
import { ATKINSON_COVERAGE, NOTO_COVERAGE, type Coverage } from './character-font-coverage';

/** The four ways of drawing a character in the §6 table. */
export type CharacterFont = 'Atkinson Hyperlegible Next' | 'Noto Color Emoji' | 'la fuente del sistema' | 'el emoji del dispositivo';

/**
 * Seen as an emoji even if there is a letter for it: it is presented as emoji by default, carries the
 * mark or the keycap, joins pictograms with ZWJ, or is a pictogram that this Unicode has not assigned yet.
 */
const EMOJI_FOR_SURE = /\p{Emoji_Presentation}|\p{Emoji}️|\p{Emoji}⃣|\p{Extended_Pictographic}‍\p{Extended_Pictographic}|(?=\p{Extended_Pictographic})\p{Unassigned}/u;
const WITH_EMOJI_VERSION = /\p{Emoji}/u;
/** Invisible marks (ZWJ, selectors, tags) do not ask for a drawing of their own. */
const INVISIBLE_RE = /\p{Default_Ignorable_Code_Point}/u;
const NO_DRAWING = /^[\p{Control}\p{Default_Ignorable_Code_Point}]+$/u;

/** A character of the text: a whole emoji sequence, or a character with its combining marks. */
const GRAPHEMES = new RegExp(`${EMOJI_SHAPES}|.\\p{Mark}*`, 'gsu');

function coverageCovers(coverage: Coverage, grapheme: string): boolean {
	return [...grapheme].filter((character) => !INVISIBLE_RE.test(character)).every((character) => coverage.has(character.codePointAt(0) as number));
}

const emojiFont = (grapheme: string): CharacterFont =>
	coverageCovers(NOTO_COVERAGE, grapheme) ? 'Noto Color Emoji' : 'el emoji del dispositivo';

/** Spec §6: the font that draws a character, a whole grapheme (an emoji sequence is a single one). */
export function characterFont(grapheme: string): CharacterFont {
	if (EMOJI_FOR_SURE.test(grapheme)) return emojiFont(grapheme);
	if (coverageCovers(ATKINSON_COVERAGE, grapheme)) return 'Atkinson Hyperlegible Next';
	return WITH_EMOJI_VERSION.test(grapheme) ? emojiFont(grapheme) : 'la fuente del sistema';
}

/** Spec §6: the fonts that draw a text, without repeats, in the order they appear; what is not drawn asks for none. */
export function textFonts(text: string): CharacterFont[] {
	const graphemes = Array.from(text.matchAll(GRAPHEMES), (finding) => finding[0]);
	return [...new Set(graphemes.filter((grapheme) => !NO_DRAWING.test(grapheme)).map(characterFont))];
}
