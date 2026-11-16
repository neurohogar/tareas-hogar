// Spec §6, "Qué se dibuja con qué": invariantes de la clasificación de fuente por carácter.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { readEmoji } from './emoji';
import { ATKINSON_COVERAGE } from './character-font-coverage';
import { characterFont, textFonts } from './character-font';

const cp = (...codes: number[]) => String.fromCodePoint(...codes);
const range = (from: number, to: number) => fc.integer({ min: from, max: to });

const validEmoji = fc.constantFrom('🌱', '🔥', '😀', '👍🏽', '👨‍👩‍👧', '🇦🇷', '1️⃣', '#️⃣', '❤️', '☀️', '✈️', cp(0x1faff));
const atkinsonLetter = fc.constantFrom(...[...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,;:!?áéíóúñüÁÉÍÓÚÑÜ¿¡']);
const atkinsonText = fc.array(atkinsonLetter, { maxLength: 20 }).map((letters) => letters.join(''));
const otherAlphabet = fc.array(range(0x4e00, 0x4e50), { minLength: 1, maxLength: 5 }).map((p) => cp(...p));
const freeText = fc.array(fc.oneof(atkinsonLetter, validEmoji, otherAlphabet), { maxLength: 8 }).map((parts) => parts.join(''));

describe('fuentesDelTexto (propiedades)', () => {
	it('nunca repite una fuente', () => {
		fc.assert(
			fc.property(freeText, (text) => {
				const fonts = textFonts(text);
				expect(new Set(fonts).size).toBe(fonts.length);
			})
		);
	});

	it('es idempotente sobre el texto repetido: repetirlo no suma fuentes', () => {
		fc.assert(
			fc.property(freeText, (text) => {
				expect(new Set(textFonts(text + text))).toEqual(new Set(textFonts(text)));
			})
		);
	});

	it('el texto concatenado se dibuja con la unión de las fuentes de sus partes', () => {
		fc.assert(
			fc.property(atkinsonText, atkinsonText, validEmoji, (a, b, emoji) => {
				// Se separan con espacios para que ninguna parte se pegue a la otra en un mismo grafema.
				const joined = new Set(textFonts(`${a} ${emoji} ${b}`));
				const parts = new Set([...textFonts(`${a} `), ...textFonts(` ${emoji} `), ...textFonts(` ${b}`)]);
				expect(joined).toEqual(parts);
			})
		);
	});

	it('el texto que Atkinson tiene entero se dibuja solo con Atkinson', () => {
		fc.assert(
			fc.property(atkinsonText, (text) => {
				expect(textFonts(text)).toEqual(text === '' ? [] : ['Atkinson Hyperlegible Next']);
			})
		);
	});

	it('un texto vacío no pide ninguna fuente', () => {
		expect(textFonts('')).toEqual([]);
	});
});

describe('fuenteDeCaracter (propiedades)', () => {
	it('un emoji válido se dibuja con Noto o con el emoji del dispositivo, nunca con una fuente de texto', () => {
		fc.assert(
			fc.property(validEmoji, (emoji) => {
				expect(['Noto Color Emoji', 'el emoji del dispositivo']).toContain(characterFont(emoji));
			})
		);
	});

	it('la fuente de un emoji no cambia lo que leerEmoji acepta', () => {
		fc.assert(
			fc.property(validEmoji, (emoji) => {
				characterFont(emoji);
				expect(readEmoji(emoji)).toStrictEqual({ ok: true, emoji });
			})
		);
	});

	it('cualquier carácter de texto que Atkinson tiene se dibuja con Atkinson', () => {
		const ofText = [...ATKINSON_COVERAGE].filter((point) => !/\p{Mark}|\p{Control}/u.test(cp(point)) && !/\p{Emoji_Presentation}/u.test(cp(point)));
		fc.assert(
			fc.property(fc.constantFrom(...ofText), (point) => {
				expect(characterFont(cp(point))).toBe('Atkinson Hyperlegible Next');
			})
		);
	});

	it('un carácter de otro alfabeto se dibuja con la fuente del sistema', () => {
		fc.assert(
			fc.property(range(0x4e00, 0x4e50), (point) => {
				expect(characterFont(cp(point))).toBe('la fuente del sistema');
			})
		);
	});
});
