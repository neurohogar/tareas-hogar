// Spec §6, "Qué se dibuja con qué": la fuente que dibuja cada carácter según lo que trae
// cada una. Los caracteres que la app recibe son texto libre, así que acá nada se rechaza:
// la validez de un emoji es de leerEmoji (§4.1) y empaquetar no la cambia.
import { FORMAS_DE_EMOJI } from './emoji';
import { COBERTURA_DE_ATKINSON, COBERTURA_DE_NOTO, type Cobertura } from './fuente-de-caracter-cobertura';

/** Las cuatro formas de dibujar un carácter de la tabla de la §6. */
export type FuenteDeCaracter = 'Atkinson Hyperlegible Next' | 'Noto Color Emoji' | 'la fuente del sistema' | 'el emoji del dispositivo';

/**
 * Se ve como emoji aunque haya una letra para él: se presenta como emoji por defecto, trae la
 * marca o el keycap, une pictogramas con ZWJ, o es un pictograma que este Unicode todavía no asignó.
 */
const EMOJI_SIN_DUDA = /\p{Emoji_Presentation}|\p{Emoji}️|\p{Emoji}⃣|\p{Extended_Pictographic}‍\p{Extended_Pictographic}|(?=\p{Extended_Pictographic})\p{Unassigned}/u;
const CON_VERSION_DE_EMOJI = /\p{Emoji}/u;
/** Las marcas invisibles (ZWJ, selectores, etiquetas) no piden un dibujo propio. */
const INVISIBLE = /\p{Default_Ignorable_Code_Point}/u;
const SIN_DIBUJO = /^[\p{Control}\p{Default_Ignorable_Code_Point}]+$/u;

/** Un carácter del texto: una secuencia de emoji entera, o un carácter con sus marcas combinadas. */
const GRAFEMAS = new RegExp(`${FORMAS_DE_EMOJI}|.\\p{Mark}*`, 'gsu');

function coberturaCubre(cobertura: Cobertura, grafema: string): boolean {
	return [...grafema].filter((caracter) => !INVISIBLE.test(caracter)).every((caracter) => cobertura.has(caracter.codePointAt(0) as number));
}

const fuenteDeEmoji = (grafema: string): FuenteDeCaracter =>
	coberturaCubre(COBERTURA_DE_NOTO, grafema) ? 'Noto Color Emoji' : 'el emoji del dispositivo';

/** Spec §6: la fuente que dibuja un carácter, un grafema entero (una secuencia de emoji es uno solo). */
export function fuenteDeCaracter(grafema: string): FuenteDeCaracter {
	if (EMOJI_SIN_DUDA.test(grafema)) return fuenteDeEmoji(grafema);
	if (coberturaCubre(COBERTURA_DE_ATKINSON, grafema)) return 'Atkinson Hyperlegible Next';
	return CON_VERSION_DE_EMOJI.test(grafema) ? fuenteDeEmoji(grafema) : 'la fuente del sistema';
}

/** Spec §6: las fuentes que dibujan un texto, sin repetir, en el orden en que aparecen; lo que no se dibuja no pide ninguna. */
export function fuentesDelTexto(texto: string): FuenteDeCaracter[] {
	const grafemas = Array.from(texto.matchAll(GRAFEMAS), (hallazgo) => hallazgo[0]);
	return [...new Set(grafemas.filter((grafema) => !SIN_DIBUJO.test(grafema)).map(fuenteDeCaracter))];
}
