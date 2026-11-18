// Spec §6.2 (Emoji, Recents): invariants of addRecent.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { MAX_RECENT, addRecent } from './recent-emojis';

const emoji = fc.constantFrom('🌱', '🔥', '🧹', '😀', '👍', '☀', '✈', '🏳', '🍎', '🐱', '🎲', '🚲', '📚', '🔑', '🎵', '🌙', '🧊', '🪴', '🍞', '🛒');
/** A valid recents list: without repeats and with at most the cap. */
const recents = fc.uniqueArray(emoji, { maxLength: MAX_RECENT });

describe('addRecent (properties)', () => {
	it('the chosen one ends up first', () => {
		fc.assert(fc.property(recents, emoji, (list, chosenOne) => addRecent(list, chosenOne)[0] === chosenOne));
	});

	it('there are never repeats or more than the cap, even starting from an inflated list', () => {
		fc.assert(
			fc.property(fc.array(emoji, { maxLength: 40 }), emoji, (list, chosenOne) => {
				const result = addRecent(list, chosenOne);
				expect(new Set(result).size).toBe(result.length);
				expect(result.length).toBeLessThanOrEqual(MAX_RECENT);
			})
		);
	});

	it('the others keep their relative order', () => {
		fc.assert(
			fc.property(recents, emoji, (list, chosenOne) => {
				const rest = addRecent(list, chosenOne).slice(1);
				expect(rest).toEqual(list.filter((e) => e !== chosenOne).slice(0, rest.length));
			})
		);
	});

	it('only the last one is lost, and only if the chosen one is new and the list was full', () => {
		fc.assert(
			fc.property(recents, emoji, (list, chosenOne) => {
				const result = addRecent(list, chosenOne);
				const lost = list.filter((e) => !result.includes(e));
				const isDiscarded = !list.includes(chosenOne) && list.length === MAX_RECENT;
				expect(lost).toEqual(isDiscarded ? [list.at(-1)] : []);
			})
		);
	});

	it('is idempotent: choosing the same emoji twice in a row leaves the same', () => {
		fc.assert(
			fc.property(recents, emoji, (list, chosenOne) => {
				const one = addRecent(list, chosenOne);
				expect(addRecent(one, chosenOne)).toEqual(one);
			})
		);
	});

	it('does not modify the received list', () => {
		fc.assert(
			fc.property(recents, emoji, (list, chosenOne) => {
				const copy = [...list];
				addRecent(list, chosenOne);
				expect(list).toEqual(copy);
			})
		);
	});
});
