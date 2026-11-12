// Spec §6, "Qué se dibuja con qué": invariantes de la clasificación de fuente por carácter.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { leerEmoji } from './emoji';
import { COBERTURA_DE_ATKINSON } from './fuente-de-caracter-cobertura';
import { fuenteDeCaracter, fuentesDelTexto } from './fuente-de-caracter';

const cp = (...codigos: number[]) => String.fromCodePoint(...codigos);
const rango = (desde: number, hasta: number) => fc.integer({ min: desde, max: hasta });

const emojiValido = fc.constantFrom('🌱', '🔥', '😀', '👍🏽', '👨‍👩‍👧', '🇦🇷', '1️⃣', '#️⃣', '❤️', '☀️', '✈️', cp(0x1faff));
const letraDeAtkinson = fc.constantFrom(...[...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,;:!?áéíóúñüÁÉÍÓÚÑÜ¿¡']);
const textoDeAtkinson = fc.array(letraDeAtkinson, { maxLength: 20 }).map((letras) => letras.join(''));
const otroAlfabeto = fc.array(rango(0x4e00, 0x4e50), { minLength: 1, maxLength: 5 }).map((p) => cp(...p));
const textoLibre = fc.array(fc.oneof(letraDeAtkinson, emojiValido, otroAlfabeto), { maxLength: 8 }).map((partes) => partes.join(''));

describe('fuentesDelTexto (propiedades)', () => {
	it('nunca repite una fuente', () => {
		fc.assert(
			fc.property(textoLibre, (texto) => {
				const fuentes = fuentesDelTexto(texto);
				expect(new Set(fuentes).size).toBe(fuentes.length);
			})
		);
	});

	it('es idempotente sobre el texto repetido: repetirlo no suma fuentes', () => {
		fc.assert(
			fc.property(textoLibre, (texto) => {
				expect(new Set(fuentesDelTexto(texto + texto))).toEqual(new Set(fuentesDelTexto(texto)));
			})
		);
	});

	it('el texto concatenado se dibuja con la unión de las fuentes de sus partes', () => {
		fc.assert(
			fc.property(textoDeAtkinson, textoDeAtkinson, emojiValido, (a, b, emoji) => {
				// Se separan con espacios para que ninguna parte se pegue a la otra en un mismo grafema.
				const unido = new Set(fuentesDelTexto(`${a} ${emoji} ${b}`));
				const partes = new Set([...fuentesDelTexto(`${a} `), ...fuentesDelTexto(` ${emoji} `), ...fuentesDelTexto(` ${b}`)]);
				expect(unido).toEqual(partes);
			})
		);
	});

	it('el texto que Atkinson tiene entero se dibuja solo con Atkinson', () => {
		fc.assert(
			fc.property(textoDeAtkinson, (texto) => {
				expect(fuentesDelTexto(texto)).toEqual(texto === '' ? [] : ['Atkinson Hyperlegible Next']);
			})
		);
	});

	it('un texto vacío no pide ninguna fuente', () => {
		expect(fuentesDelTexto('')).toEqual([]);
	});
});

describe('fuenteDeCaracter (propiedades)', () => {
	it('un emoji válido se dibuja con Noto o con el emoji del dispositivo, nunca con una fuente de texto', () => {
		fc.assert(
			fc.property(emojiValido, (emoji) => {
				expect(['Noto Color Emoji', 'el emoji del dispositivo']).toContain(fuenteDeCaracter(emoji));
			})
		);
	});

	it('la fuente de un emoji no cambia lo que leerEmoji acepta', () => {
		fc.assert(
			fc.property(emojiValido, (emoji) => {
				fuenteDeCaracter(emoji);
				expect(leerEmoji(emoji)).toStrictEqual({ ok: true, emoji });
			})
		);
	});

	it('cualquier carácter de texto que Atkinson tiene se dibuja con Atkinson', () => {
		const delTexto = [...COBERTURA_DE_ATKINSON].filter((punto) => !/\p{Mark}|\p{Control}/u.test(cp(punto)) && !/\p{Emoji_Presentation}/u.test(cp(punto)));
		fc.assert(
			fc.property(fc.constantFrom(...delTexto), (punto) => {
				expect(fuenteDeCaracter(cp(punto))).toBe('Atkinson Hyperlegible Next');
			})
		);
	});

	it('un carácter de otro alfabeto se dibuja con la fuente del sistema', () => {
		fc.assert(
			fc.property(rango(0x4e00, 0x4e50), (punto) => {
				expect(fuenteDeCaracter(cp(punto))).toBe('la fuente del sistema');
			})
		);
	});
});
