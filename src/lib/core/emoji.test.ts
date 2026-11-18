import { describe, expect, it } from 'vitest';
import { readEmoji } from './emoji';

const NO_EMOJI = { ok: true };

describe('readEmoji', () => {
	it.each([
		['a simple emoji', '🌱'],
		['a sequence with ZWJ', '👨‍👩‍👧'],
		['an emoji with skin tone', '👍🏽'],
		['an emoji with variation selector', '❤️'],
		['a flag', '🇦🇷'],
		['a flag with tags', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'],
		['a keycap', '1️⃣']
	])('accepts %s as a single emoji and saves it as is', (_, emoji) => {
		expect(readEmoji(emoji)).toStrictEqual({ ok: true, emoji });
	});

	it('an emoji that the bundled font set does not have is saved anyway', () => {
		expect(readEmoji('\u{1FAFF}')).toStrictEqual({ ok: true, emoji: '\u{1FAFF}' });
	});

	it('trims the spaces at the ends', () => {
		expect(readEmoji('  🌱 \n')).toStrictEqual({ ok: true, emoji: '🌱' });
	});

	it.each(['', '   ', ' \n\t '])('empty or only spaces (%j) is no emoji, not an error', (text) => {
		expect(readEmoji(text)).toStrictEqual(NO_EMOJI);
	});

	it.each([
		['two emojis', '🌱🔥'],
		['two emojis separated by a space', '🌱 🔥'],
		['two flags', '🇦🇷🇧🇷'],
		['three regional indicators', '🇦🇷🇧'],
		['a letter', 'a'],
		['an emoji and a letter', '🔥a'],
		['a letter and an emoji', 'a🔥'],
		['a word', 'hola'],
		['a digit', '1'],
		['two digits', '12'],
		['a loose regional indicator', '🇦'],
		['a dangling ZWJ', '🌱‍'],
		['a loose variation selector', '️'],
		['a loose skin tone', '🏽'],
		['a punctuation mark', '!']
	])('rejects %s', (_, text) => {
		expect(readEmoji(text)).toStrictEqual({ ok: false });
	});
});
