// Spec §4.1 (Emoji): a single emoji grapheme; everything else is invalid.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { readEmoji } from './emoji';

const cp = (...codes: number[]) => String.fromCodePoint(...codes);
const range = (from: number, to: number) => fc.integer({ min: from, max: to });

const pictogram = fc.constantFrom('🌱', '🔥', '😀', '🧹', '👍', '❤', '☀', '✈', '👨', '👩', '👧', '🏳', '🏴');
const tone = fc.constantFrom(...[0x1f3fb, 0x1f3fc, 0x1f3fd, 0x1f3fe, 0x1f3ff].map((c) => cp(c)));
const withToneOrSelector = fc.oneof(
	pictogram,
	pictogram.map((p) => `${p}️`),
	fc.tuple(fc.constantFrom('👍', '👋', '🧑'), tone).map(([p, t]) => p + t)
);
const zwjSequence = fc.array(withToneOrSelector, { minLength: 1, maxLength: 4 }).map((parts) => parts.join('‍'));
const indicator = range(0x1f1e6, 0x1f1ff).map((c) => cp(c));
const flag = fc.tuple(indicator, indicator).map(([a, b]) => a + b);
const tagLetters = fc.array(range(0xe0061, 0xe007a), { minLength: 2, maxLength: 6 }).map((l) => cp(...l));
const subdivisionFlag = tagLetters.map((letters) => `🏴${letters}${cp(0xe007f)}`);
const keycap = fc.tuple(fc.constantFrom(...'0123456789#*'), fc.boolean()).map(([c, vs]) => `${c}${vs ? '️' : ''}⃣`);
const anEmoji = fc.oneof(withToneOrSelector, zwjSequence, flag, subdivisionFlag, keycap);
const spaces = fc.stringMatching(/^[ \t\n]{0,3}$/);

describe('readEmoji (properties)', () => {
	it('accepts any emoji grapheme and saves it without the spaces at the ends', () => {
		fc.assert(
			fc.property(spaces, anEmoji, spaces, (before, emoji, after) => {
				expect(readEmoji(before + emoji + after)).toStrictEqual({ ok: true, emoji });
			})
		);
	});

	it('rejects two or more emoji graphemes together or separated by a space', () => {
		fc.assert(
			fc.property(anEmoji, fc.constantFrom('', ' ', '\n'), anEmoji, (a, separator, b) => {
				expect(readEmoji(a + separator + b)).toStrictEqual({ ok: false });
			})
		);
	});

	it('rejects an emoji with text around it', () => {
		const text = fc.string({ minLength: 1, maxLength: 5 }).filter((s) => /^[\p{L}\p{N}]+$/u.test(s));
		fc.assert(
			fc.property(anEmoji, text, fc.boolean(), (emoji, letters, before) => {
				expect(readEmoji(before ? letters + emoji : emoji + letters)).toStrictEqual({ ok: false });
			})
		);
	});

	it('rejects text without an emoji', () => {
		fc.assert(
			fc.property(fc.string({ minLength: 1, maxLength: 8 }).filter((s) => s.trim() !== '' && !/\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u.test(s)), (text) => {
				expect(readEmoji(text)).toStrictEqual({ ok: false });
			})
		);
	});

	it('empty or only spaces is no emoji', () => {
		fc.assert(
			fc.property(fc.stringMatching(/^\s{0,6}$/), (text) => {
				expect(readEmoji(text)).toStrictEqual({ ok: true });
			})
		);
	});

	it('is idempotent: rereading what was saved gives the same', () => {
		fc.assert(
			fc.property(anEmoji, (emoji) => {
				const first = readEmoji(emoji);
				expect(first.ok && first.emoji !== undefined ? readEmoji(first.emoji) : first).toStrictEqual(first);
			})
		);
	});

	it('rejects flag tags that do not follow the black flag, or without cancel', () => {
		fc.assert(
			fc.property(tagLetters, fc.constantFrom('🌱', '🇦🇷', '👍'), (letters, base) => {
				expect(readEmoji(`${base}${letters}${cp(0xe007f)}`)).toStrictEqual({ ok: false });
				expect(readEmoji(`🏴${letters}`)).toStrictEqual({ ok: false });
			})
		);
	});

	it('rejects a dangling ZWJ, a loose tag and more than two regional indicators', () => {
		fc.assert(
			fc.property(anEmoji, indicator, (emoji, regionalIndicator) => {
				expect(readEmoji(`${emoji}‍`)).toStrictEqual({ ok: false });
				expect(readEmoji(`${cp(0xe0067)}`)).toStrictEqual({ ok: false });
				expect(readEmoji(`🇦🇷${regionalIndicator}`)).toStrictEqual({ ok: false });
			})
		);
	});
});
