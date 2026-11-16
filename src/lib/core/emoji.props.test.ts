// Spec §4.1 (Emoji): un único grafema emoji; todo lo demás es inválido.
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

describe('leerEmoji (propiedades)', () => {
	it('acepta cualquier grafema emoji y lo guarda sin los espacios de los extremos', () => {
		fc.assert(
			fc.property(spaces, anEmoji, spaces, (before, emoji, after) => {
				expect(readEmoji(before + emoji + after)).toStrictEqual({ ok: true, emoji });
			})
		);
	});

	it('rechaza dos o más grafemas emoji juntos o separados por un espacio', () => {
		fc.assert(
			fc.property(anEmoji, fc.constantFrom('', ' ', '\n'), anEmoji, (a, separator, b) => {
				expect(readEmoji(a + separator + b)).toStrictEqual({ ok: false });
			})
		);
	});

	it('rechaza un emoji con texto alrededor', () => {
		const text = fc.string({ minLength: 1, maxLength: 5 }).filter((s) => /^[\p{L}\p{N}]+$/u.test(s));
		fc.assert(
			fc.property(anEmoji, text, fc.boolean(), (emoji, letters, before) => {
				expect(readEmoji(before ? letters + emoji : emoji + letters)).toStrictEqual({ ok: false });
			})
		);
	});

	it('rechaza texto sin emoji', () => {
		fc.assert(
			fc.property(fc.string({ minLength: 1, maxLength: 8 }).filter((s) => s.trim() !== '' && !/\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u.test(s)), (text) => {
				expect(readEmoji(text)).toStrictEqual({ ok: false });
			})
		);
	});

	it('vacío o solo espacios es sin emoji', () => {
		fc.assert(
			fc.property(fc.stringMatching(/^\s{0,6}$/), (text) => {
				expect(readEmoji(text)).toStrictEqual({ ok: true });
			})
		);
	});

	it('es idempotente: releer lo guardado da lo mismo', () => {
		fc.assert(
			fc.property(anEmoji, (emoji) => {
				const first = readEmoji(emoji);
				expect(first.ok && first.emoji !== undefined ? readEmoji(first.emoji) : first).toStrictEqual(first);
			})
		);
	});

	it('rechaza etiquetas de bandera que no siguen a la bandera negra, o sin cancelar', () => {
		fc.assert(
			fc.property(tagLetters, fc.constantFrom('🌱', '🇦🇷', '👍'), (letters, base) => {
				expect(readEmoji(`${base}${letters}${cp(0xe007f)}`)).toStrictEqual({ ok: false });
				expect(readEmoji(`🏴${letters}`)).toStrictEqual({ ok: false });
			})
		);
	});

	it('rechaza un ZWJ colgado, un tag suelto y más de dos indicadores regionales', () => {
		fc.assert(
			fc.property(anEmoji, indicator, (emoji, regionalIndicator) => {
				expect(readEmoji(`${emoji}‍`)).toStrictEqual({ ok: false });
				expect(readEmoji(`${cp(0xe0067)}`)).toStrictEqual({ ok: false });
				expect(readEmoji(`🇦🇷${regionalIndicator}`)).toStrictEqual({ ok: false });
			})
		);
	});
});
