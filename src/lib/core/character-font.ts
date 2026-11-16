// Spec §6, "Qué se dibuja con qué": la fuente que dibuja cada carácter según lo que trae
// cada una. Los caracteres que la app recibe son texto libre, así que acá nada se rechaza:
// la validez de un emoji es de leerEmoji (§4.1) y empaquetar no la cambia.
import { EMOJI_SHAPES } from './emoji';
import { ATKINSON_COVERAGE, NOTO_COVERAGE, type Coverage } from './character-font-coverage';

/** Las cuatro formas de dibujar un carácter de la tabla de la §6. */
export type CharacterFont = 'Atkinson Hyperlegible Next' | 'Noto Color Emoji' | 'la fuente del sistema' | 'el emoji del dispositivo';

/**
 * Se ve como emoji aunque haya una letra para él: se presenta como emoji por defecto, trae la
 * marca o el keycap, une pictogramas con ZWJ, o es un pictograma que este Unicode todavía no asignó.
 */
const EMOJI_FOR_SURE = /\p{Emoji_Presentation}|\p{Emoji}️|\p{Emoji}⃣|\p{Extended_Pictographic}‍\p{Extended_Pictographic}|(?=\p{Extended_Pictographic})\p{Unassigned}/u;
const WITH_EMOJI_VERSION = /\p{Emoji}/u;
/** Las marcas invisibles (ZWJ, selectores, etiquetas) no piden un dibujo propio. */
const INVISIBLE_RE = /\p{Default_Ignorable_Code_Point}/u;
const NO_DRAWING = /^[\p{Control}\p{Default_Ignorable_Code_Point}]+$/u;

/** Un carácter del texto: una secuencia de emoji entera, o un carácter con sus marcas combinadas. */
const GRAPHEMES = new RegExp(`${EMOJI_SHAPES}|.\\p{Mark}*`, 'gsu');

function coverageCovers(coverage: Coverage, grapheme: string): boolean {
	return [...grapheme].filter((character) => !INVISIBLE_RE.test(character)).every((character) => coverage.has(character.codePointAt(0) as number));
}

const emojiFont = (grapheme: string): CharacterFont =>
	coverageCovers(NOTO_COVERAGE, grapheme) ? 'Noto Color Emoji' : 'el emoji del dispositivo';

/** Spec §6: la fuente que dibuja un carácter, un grafema entero (una secuencia de emoji es uno solo). */
export function characterFont(grapheme: string): CharacterFont {
	if (EMOJI_FOR_SURE.test(grapheme)) return emojiFont(grapheme);
	if (coverageCovers(ATKINSON_COVERAGE, grapheme)) return 'Atkinson Hyperlegible Next';
	return WITH_EMOJI_VERSION.test(grapheme) ? emojiFont(grapheme) : 'la fuente del sistema';
}

/** Spec §6: las fuentes que dibujan un texto, sin repetir, en el orden en que aparecen; lo que no se dibuja no pide ninguna. */
export function textFonts(text: string): CharacterFont[] {
	const graphemes = Array.from(text.matchAll(GRAPHEMES), (finding) => finding[0]);
	return [...new Set(graphemes.filter((grapheme) => !NO_DRAWING.test(grapheme)).map(characterFont))];
}
