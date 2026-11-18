import { describe, expect, it } from 'vitest';
import { characterFont, textFonts } from './character-font';

const ATKINSON = 'Atkinson Hyperlegible Next';
const NOTO = 'Noto Color Emoji';
const SYSTEM = 'la fuente del sistema';
const DEVICE = 'el emoji del dispositivo';

describe('characterFont', () => {
	it.each(['a', 'ñ', 'Á', 'é', 'é', '¿', '€', '–', ' ', '0', '9', '#', '*', '©', '®', '™'])(
		'the text that Atkinson has, digits and signs without an emoji mark included (%s), goes with Atkinson',
		(character) => {
			expect(characterFont(character)).toBe(ATKINSON);
		}
	);

	it.each(['日', 'я', 'ع', 'א', '→', 'µ'])('the text that Atkinson does not have (%s) goes with the system font', (character) => {
		expect(characterFont(character)).toBe(SYSTEM);
	});

	it.each(['★', '♔', '★\uFE0F'])('a pictogram without an emoji version (%j) is text, even with a mark: it goes with the system font', (character) => {
		expect(characterFont(character)).toBe(SYSTEM);
	});

	it.each(['❤', '☀', '☎', '✈', '↔', '\u3030'])('with a text and an emoji version, without a mark, that Atkinson does not have (%s) goes with Noto', (character) => {
		expect(characterFont(character)).toBe(NOTO);
	});

	it.each(['❤︎', '☀︎'])('the text mark (%j) is not an emoji mark: it follows the no-mark rule', (character) => {
		expect(characterFont(character)).toBe(NOTO);
	});

	it.each([
		['no mark', '🌱'],
		['with mark', '❤\uFE0F'],
		['digit with mark', '1\uFE0F'],
		['Atkinson symbol with mark', '©\uFE0F'],
		['keycap', '#\uFE0F\u20E3'],
		['keycap without selector', '#\u20E3'],
		['ZWJ', '👨\u200D👩\u200D👧'],
		['ZWJ of text pictograms', '⛹\u200D♂'],
		['skin tone', '👍🏽'],
		['flag', '🇦🇷'],
		['subdivision flag', '🏴󠁧󠁢󠁥󠁮󠁧󠁿']
	])('an emoji that Noto has (%s) goes with Noto', (_, emoji) => {
		expect(characterFont(emoji)).toBe(NOTO);
	});

	it.each([
		['not assigned yet', '\u{1FAFF}'],
		['not assigned, with mark', '\u{1FAFF}\uFE0F'],
		['ZWJ with a missing one', '👨\u200D\u{1FAFF}']
	])('an emoji that Noto does not have (%s) goes with the device emoji', (_, emoji) => {
		expect(characterFont(emoji)).toBe(DEVICE);
	});

	it('an emoji mark over a letter does not turn it into an emoji', () => {
		expect(characterFont('a\uFE0F')).toBe(ATKINSON);
	});

	it('a keycap over a letter does not turn it into an emoji', () => {
		expect(characterFont('a\u20E3')).toBe(SYSTEM);
	});

	it('a ZWJ after a pictogram without another pictogram does not turn it into an emoji', () => {
		expect(characterFont('©\u200D')).toBe(ATKINSON);
	});

	it('the text without an emoji version that Atkinson does not have does not go with Noto', () => {
		expect(characterFont('\u2003')).toBe(SYSTEM);
	});

	it('the edges of the coverage ranges count: Atkinson has the last one and not the next', () => {
		expect(characterFont('~')).toBe(ATKINSON); // 7e, end of 20-7e
		expect(characterFont(' ')).toBe(ATKINSON); // a0, start of a0-ac
		expect(characterFont('¬')).toBe(ATKINSON); // ac, end of a0-ac
		expect(characterFont('Ă')).toBe(ATKINSON); // single
		expect(characterFont('ă')).toBe(ATKINSON);
		expect(characterFont('Ĉ')).toBe(SYSTEM); // between 100-107 and 10a-113
	});
});

describe('textFonts', () => {
	it('a text in Spanish uses only Atkinson', () => {
		expect(textFonts('Atención, camión y niño')).toStrictEqual([ATKINSON]);
	});

	it('gives each font once, in the order it appears', () => {
		expect(textFonts('Regar 🌱 日本 las 🌿 \u{1FAFF} plantas')).toStrictEqual([ATKINSON, NOTO, SYSTEM, DEVICE]);
	});

	it.each([
		['ZWJ', '👨\u200D👩\u200D👧'],
		['ZWJ with mark', '❤\uFE0F\u200D🔥'],
		['keycap', '#\uFE0F\u20E3'],
		['skin tone', '👍🏽'],
		['flag', '🇦🇷'],
		['subdivision flag', '🏴\u{E0067}\u{E0062}\u{E007F}']
	])('an emoji sequence (%s) is a single character', (_, emoji) => {
		expect(textFonts(emoji)).toStrictEqual([NOTO]);
	});

	it('a sequence with an emoji that Noto does not have goes whole with the device one', () => {
		expect(textFonts('👨\u200D\u{1FAFF}')).toStrictEqual([DEVICE]);
	});

	it('a combining mark is part of its letter', () => {
		expect(textFonts('e\u0301')).toStrictEqual([ATKINSON]);
		expect(textFonts('a\u20E3')).toStrictEqual([SYSTEM]);
	});

	it('a lone emoji character without a sequence follows its own rule', () => {
		expect(textFonts('1 ©')).toStrictEqual([ATKINSON]);
		expect(textFonts('©❤')).toStrictEqual([ATKINSON, NOTO]);
	});

	it('what is not drawn asks for no font: line breaks, tabs and invisible marks', () => {
		expect(textFonts('uno\ndos\r\ntres\tcuatro')).toStrictEqual([ATKINSON]);
		expect(textFonts('\u200D\uFE0F­\n')).toStrictEqual([]);
	});

	it('an empty text asks for no font', () => {
		expect(textFonts('')).toStrictEqual([]);
	});
});
