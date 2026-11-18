import { describe, expect, it } from 'vitest';
import { MAX_RECENT, addRecent } from './recent-emojis';

describe('addRecent', () => {
	it('without previous recents, the chosen one becomes the only recent', () => {
		expect(addRecent([], '🌱')).toEqual(['🌱']);
	});

	it('the chosen one moves to the first place and the previous ones go down', () => {
		expect(addRecent(['🔥', '🌱'], '🧹')).toEqual(['🧹', '🔥', '🌱']);
	});

	it('one that was already there moves to the first place without repeating', () => {
		expect(addRecent(['🔥', '🌱', '🧹'], '🧹')).toEqual(['🧹', '🔥', '🌱']);
		expect(addRecent(['🔥', '🌱', '🧹'], '🌱')).toEqual(['🌱', '🔥', '🧹']);
	});

	it('the one that was already first stays the same', () => {
		expect(addRecent(['🔥', '🌱'], '🔥')).toEqual(['🔥', '🌱']);
	});

	it('keeps up to 16 and, with a full list, discards the oldest', () => {
		const fifteen = Array.from({ length: 15 }, (_, i) => `a${i}`);
		expect(addRecent(fifteen, 'nuevo')).toHaveLength(16);
		const sixteen = Array.from({ length: 16 }, (_, i) => `a${i}`);
		const result = addRecent(sixteen, 'nuevo');
		expect(MAX_RECENT).toBe(16);
		expect(result).toEqual(['nuevo', ...sixteen.slice(0, 15)]);
	});

	it('with a full list, choosing one that was already there discards none', () => {
		const sixteen = Array.from({ length: 16 }, (_, i) => `a${i}`);
		expect(addRecent(sixteen, 'a15')).toEqual(['a15', ...sixteen.slice(0, 15)]);
	});

	it('does not modify the received list', () => {
		const recents = ['🔥'];
		addRecent(recents, '🌱');
		expect(recents).toEqual(['🔥']);
	});
});
