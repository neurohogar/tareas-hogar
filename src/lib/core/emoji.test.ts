import { describe, expect, it } from 'vitest';
import { leerEmoji } from './emoji';

const SIN_EMOJI = { ok: true };

describe('leerEmoji', () => {
	it.each([
		['un emoji simple', '🌱'],
		['una secuencia con ZWJ', '👨‍👩‍👧'],
		['un emoji con tono de piel', '👍🏽'],
		['un emoji con selector de variación', '❤️'],
		['una bandera', '🇦🇷'],
		['una bandera con etiquetas', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'],
		['un keycap', '1️⃣']
	])('acepta %s como un solo emoji y lo guarda tal cual', (_, emoji) => {
		expect(leerEmoji(emoji)).toStrictEqual({ ok: true, emoji });
	});

	it('un emoji que el juego empaquetado no tiene se guarda igual', () => {
		expect(leerEmoji('\u{1FAFF}')).toStrictEqual({ ok: true, emoji: '\u{1FAFF}' });
	});

	it('quita los espacios de los extremos', () => {
		expect(leerEmoji('  🌱 \n')).toStrictEqual({ ok: true, emoji: '🌱' });
	});

	it.each(['', '   ', ' \n\t '])('vacío o solo espacios (%j) es sin emoji, no un error', (texto) => {
		expect(leerEmoji(texto)).toStrictEqual(SIN_EMOJI);
	});

	it.each([
		['dos emojis', '🌱🔥'],
		['dos emojis separados por un espacio', '🌱 🔥'],
		['dos banderas', '🇦🇷🇧🇷'],
		['tres indicadores regionales', '🇦🇷🇧'],
		['una letra', 'a'],
		['un emoji y una letra', '🔥a'],
		['una letra y un emoji', 'a🔥'],
		['una palabra', 'hola'],
		['un dígito', '1'],
		['dos dígitos', '12'],
		['un indicador regional suelto', '🇦'],
		['un ZWJ colgado', '🌱‍'],
		['un selector de variación suelto', '️'],
		['un tono de piel suelto', '🏽'],
		['un signo de puntuación', '!']
	])('rechaza %s', (_, texto) => {
		expect(leerEmoji(texto)).toStrictEqual({ ok: false });
	});
});
