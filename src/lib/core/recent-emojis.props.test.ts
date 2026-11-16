// Spec §6.2 (Emoji, Recientes): invariantes de agregarReciente.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { MAX_RECENT, addRecent } from './recent-emojis';

const emoji = fc.constantFrom('🌱', '🔥', '🧹', '😀', '👍', '☀', '✈', '🏳', '🍎', '🐱', '🎲', '🚲', '📚', '🔑', '🎵', '🌙', '🧊', '🪴', '🍞', '🛒');
/** Una lista de recientes válida: sin repetidos y con a lo sumo el tope. */
const recents = fc.uniqueArray(emoji, { maxLength: MAX_RECENT });

describe('agregarReciente (propiedades)', () => {
	it('el elegido queda primero', () => {
		fc.assert(fc.property(recents, emoji, (list, chosenOne) => addRecent(list, chosenOne)[0] === chosenOne));
	});

	it('nunca hay repetidos ni más del tope, incluso partiendo de una lista inflada', () => {
		fc.assert(
			fc.property(fc.array(emoji, { maxLength: 40 }), emoji, (list, chosenOne) => {
				const result = addRecent(list, chosenOne);
				expect(new Set(result).size).toBe(result.length);
				expect(result.length).toBeLessThanOrEqual(MAX_RECENT);
			})
		);
	});

	it('los demás conservan su orden relativo', () => {
		fc.assert(
			fc.property(recents, emoji, (list, chosenOne) => {
				const rest = addRecent(list, chosenOne).slice(1);
				expect(rest).toEqual(list.filter((e) => e !== chosenOne).slice(0, rest.length));
			})
		);
	});

	it('solo se pierde el último, y solo si el elegido es nuevo y la lista estaba llena', () => {
		fc.assert(
			fc.property(recents, emoji, (list, chosenOne) => {
				const result = addRecent(list, chosenOne);
				const lost = list.filter((e) => !result.includes(e));
				const isDiscarded = !list.includes(chosenOne) && list.length === MAX_RECENT;
				expect(lost).toEqual(isDiscarded ? [list.at(-1)] : []);
			})
		);
	});

	it('es idempotente: elegir dos veces seguidas el mismo emoji deja lo mismo', () => {
		fc.assert(
			fc.property(recents, emoji, (list, chosenOne) => {
				const one = addRecent(list, chosenOne);
				expect(addRecent(one, chosenOne)).toEqual(one);
			})
		);
	});

	it('no modifica la lista recibida', () => {
		fc.assert(
			fc.property(recents, emoji, (list, chosenOne) => {
				const copy = [...list];
				addRecent(list, chosenOne);
				expect(list).toEqual(copy);
			})
		);
	});
});
