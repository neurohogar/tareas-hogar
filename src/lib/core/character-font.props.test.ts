// Spec §6, "Qué se dibuja con qué": invariants of the per-character font classification.
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

describe('textFonts (properties)', () => {
	it('never repeats a font', () => {
		fc.assert(
			fc.property(freeText, (text) => {
				const fonts = textFonts(text);
				expect(new Set(fonts).size).toBe(fonts.length);
			})
		);
	});

	it('is idempotent over repeated text: repeating it adds no fonts', () => {
		fc.assert(
			fc.property(freeText, (text) => {
				expect(new Set(textFonts(text + text))).toEqual(new Set(textFonts(text)));
			})
		);
	});

	it('the concatenated text is drawn with the union of the fonts of its parts', () => {
		fc.assert(
			fc.property(atkinsonText, atkinsonText, validEmoji, (a, b, emoji) => {
				// They are separated with spaces so that no part sticks to another in a single grapheme.
				const joined = new Set(textFonts(`${a} ${emoji} ${b}`));
				const parts = new Set([...textFonts(`${a} `), ...textFonts(` ${emoji} `), ...textFonts(` ${b}`)]);
				expect(joined).toEqual(parts);
			})
		);
	});

	it('the text that Atkinson has entirely is drawn only with Atkinson', () => {
		fc.assert(
			fc.property(atkinsonText, (text) => {
				expect(textFonts(text)).toEqual(text === '' ? [] : ['Atkinson Hyperlegible Next']);
			})
		);
	});

	it('an empty text asks for no font', () => {
		expect(textFonts('')).toEqual([]);
	});
});

describe('characterFont (properties)', () => {
	it('a valid emoji is drawn with Noto or with the device emoji, never with a text font', () => {
		fc.assert(
			fc.property(validEmoji, (emoji) => {
				expect(['Noto Color Emoji', 'el emoji del dispositivo']).toContain(characterFont(emoji));
			})
		);
	});

	it('the font of an emoji does not change what readEmoji accepts', () => {
		fc.assert(
			fc.property(validEmoji, (emoji) => {
				characterFont(emoji);
				expect(readEmoji(emoji)).toStrictEqual({ ok: true, emoji });
			})
		);
	});

	it('any text character that Atkinson has is drawn with Atkinson', () => {
		const ofText = [...ATKINSON_COVERAGE].filter((point) => !/\p{Mark}|\p{Control}/u.test(cp(point)) && !/\p{Emoji_Presentation}/u.test(cp(point)));
		fc.assert(
			fc.property(fc.constantFrom(...ofText), (point) => {
				expect(characterFont(cp(point))).toBe('Atkinson Hyperlegible Next');
			})
		);
	});

	it('a character of another alphabet is drawn with the system font', () => {
		fc.assert(
			fc.property(range(0x4e00, 0x4e50), (point) => {
				expect(characterFont(cp(point))).toBe('la fuente del sistema');
			})
		);
	});
});
