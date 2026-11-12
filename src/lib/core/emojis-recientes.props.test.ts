// Spec §6.2 (Emoji, Recientes): invariantes de agregarReciente.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { MAXIMO_DE_RECIENTES, agregarReciente } from './emojis-recientes';

const emoji = fc.constantFrom('🌱', '🔥', '🧹', '😀', '👍', '☀', '✈', '🏳', '🍎', '🐱', '🎲', '🚲', '📚', '🔑', '🎵', '🌙', '🧊', '🪴', '🍞', '🛒');
/** Una lista de recientes válida: sin repetidos y con a lo sumo el tope. */
const recientes = fc.uniqueArray(emoji, { maxLength: MAXIMO_DE_RECIENTES });

describe('agregarReciente (propiedades)', () => {
	it('el elegido queda primero', () => {
		fc.assert(fc.property(recientes, emoji, (lista, elegido) => agregarReciente(lista, elegido)[0] === elegido));
	});

	it('nunca hay repetidos ni más del tope, incluso partiendo de una lista inflada', () => {
		fc.assert(
			fc.property(fc.array(emoji, { maxLength: 40 }), emoji, (lista, elegido) => {
				const resultado = agregarReciente(lista, elegido);
				expect(new Set(resultado).size).toBe(resultado.length);
				expect(resultado.length).toBeLessThanOrEqual(MAXIMO_DE_RECIENTES);
			})
		);
	});

	it('los demás conservan su orden relativo', () => {
		fc.assert(
			fc.property(recientes, emoji, (lista, elegido) => {
				const resto = agregarReciente(lista, elegido).slice(1);
				expect(resto).toEqual(lista.filter((e) => e !== elegido).slice(0, resto.length));
			})
		);
	});

	it('solo se pierde el último, y solo si el elegido es nuevo y la lista estaba llena', () => {
		fc.assert(
			fc.property(recientes, emoji, (lista, elegido) => {
				const resultado = agregarReciente(lista, elegido);
				const perdidos = lista.filter((e) => !resultado.includes(e));
				const seDescarta = !lista.includes(elegido) && lista.length === MAXIMO_DE_RECIENTES;
				expect(perdidos).toEqual(seDescarta ? [lista.at(-1)] : []);
			})
		);
	});

	it('es idempotente: elegir dos veces seguidas el mismo emoji deja lo mismo', () => {
		fc.assert(
			fc.property(recientes, emoji, (lista, elegido) => {
				const una = agregarReciente(lista, elegido);
				expect(agregarReciente(una, elegido)).toEqual(una);
			})
		);
	});

	it('no modifica la lista recibida', () => {
		fc.assert(
			fc.property(recientes, emoji, (lista, elegido) => {
				const copia = [...lista];
				agregarReciente(lista, elegido);
				expect(lista).toEqual(copia);
			})
		);
	});
});
