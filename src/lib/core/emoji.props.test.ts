// Spec §4.1 (Emoji): un único grafema emoji; todo lo demás es inválido.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { leerEmoji } from './emoji';

const cp = (...codigos: number[]) => String.fromCodePoint(...codigos);
const rango = (desde: number, hasta: number) => fc.integer({ min: desde, max: hasta });

const pictograma = fc.constantFrom('🌱', '🔥', '😀', '🧹', '👍', '❤', '☀', '✈', '👨', '👩', '👧', '🏳', '🏴');
const tono = fc.constantFrom(...[0x1f3fb, 0x1f3fc, 0x1f3fd, 0x1f3fe, 0x1f3ff].map((c) => cp(c)));
const conTonoOSelector = fc.oneof(
	pictograma,
	pictograma.map((p) => `${p}️`),
	fc.tuple(fc.constantFrom('👍', '👋', '🧑'), tono).map(([p, t]) => p + t)
);
const secuenciaZwj = fc.array(conTonoOSelector, { minLength: 1, maxLength: 4 }).map((partes) => partes.join('‍'));
const indicador = rango(0x1f1e6, 0x1f1ff).map((c) => cp(c));
const bandera = fc.tuple(indicador, indicador).map(([a, b]) => a + b);
const letrasTag = fc.array(rango(0xe0061, 0xe007a), { minLength: 2, maxLength: 6 }).map((l) => cp(...l));
const banderaDeSubdivision = letrasTag.map((letras) => `🏴${letras}${cp(0xe007f)}`);
const keycap = fc.tuple(fc.constantFrom(...'0123456789#*'), fc.boolean()).map(([c, vs]) => `${c}${vs ? '️' : ''}⃣`);
const unEmoji = fc.oneof(conTonoOSelector, secuenciaZwj, bandera, banderaDeSubdivision, keycap);
const espacios = fc.stringMatching(/^[ \t\n]{0,3}$/);

describe('leerEmoji (propiedades)', () => {
	it('acepta cualquier grafema emoji y lo guarda sin los espacios de los extremos', () => {
		fc.assert(
			fc.property(espacios, unEmoji, espacios, (antes, emoji, despues) => {
				expect(leerEmoji(antes + emoji + despues)).toStrictEqual({ ok: true, emoji });
			})
		);
	});

	it('rechaza dos o más grafemas emoji juntos o separados por un espacio', () => {
		fc.assert(
			fc.property(unEmoji, fc.constantFrom('', ' ', '\n'), unEmoji, (a, separador, b) => {
				expect(leerEmoji(a + separador + b)).toStrictEqual({ ok: false });
			})
		);
	});

	it('rechaza un emoji con texto alrededor', () => {
		const texto = fc.string({ minLength: 1, maxLength: 5 }).filter((s) => /^[\p{L}\p{N}]+$/u.test(s));
		fc.assert(
			fc.property(unEmoji, texto, fc.boolean(), (emoji, letras, antes) => {
				expect(leerEmoji(antes ? letras + emoji : emoji + letras)).toStrictEqual({ ok: false });
			})
		);
	});

	it('rechaza texto sin emoji', () => {
		fc.assert(
			fc.property(fc.string({ minLength: 1, maxLength: 8 }).filter((s) => s.trim() !== '' && !/\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u.test(s)), (texto) => {
				expect(leerEmoji(texto)).toStrictEqual({ ok: false });
			})
		);
	});

	it('vacío o solo espacios es sin emoji', () => {
		fc.assert(
			fc.property(fc.stringMatching(/^\s{0,6}$/), (texto) => {
				expect(leerEmoji(texto)).toStrictEqual({ ok: true });
			})
		);
	});

	it('es idempotente: releer lo guardado da lo mismo', () => {
		fc.assert(
			fc.property(unEmoji, (emoji) => {
				const primera = leerEmoji(emoji);
				expect(primera.ok && primera.emoji !== undefined ? leerEmoji(primera.emoji) : primera).toStrictEqual(primera);
			})
		);
	});

	it('rechaza etiquetas de bandera que no siguen a la bandera negra, o sin cancelar', () => {
		fc.assert(
			fc.property(letrasTag, fc.constantFrom('🌱', '🇦🇷', '👍'), (letras, base) => {
				expect(leerEmoji(`${base}${letras}${cp(0xe007f)}`)).toStrictEqual({ ok: false });
				expect(leerEmoji(`🏴${letras}`)).toStrictEqual({ ok: false });
			})
		);
	});

	it('rechaza un ZWJ colgado, un tag suelto y más de dos indicadores regionales', () => {
		fc.assert(
			fc.property(unEmoji, indicador, (emoji, regional) => {
				expect(leerEmoji(`${emoji}‍`)).toStrictEqual({ ok: false });
				expect(leerEmoji(`${cp(0xe0067)}`)).toStrictEqual({ ok: false });
				expect(leerEmoji(`🇦🇷${regional}`)).toStrictEqual({ ok: false });
			})
		);
	});
});
