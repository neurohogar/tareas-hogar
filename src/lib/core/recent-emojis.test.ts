import { describe, expect, it } from 'vitest';
import { MAX_RECENT, addRecent } from './recent-emojis';

describe('agregarReciente', () => {
	it('sin recientes previos, el elegido queda como único reciente', () => {
		expect(addRecent([], '🌱')).toEqual(['🌱']);
	});

	it('el elegido pasa al primer lugar y los anteriores bajan', () => {
		expect(addRecent(['🔥', '🌱'], '🧹')).toEqual(['🧹', '🔥', '🌱']);
	});

	it('uno que ya estaba se mueve al primer lugar sin repetirse', () => {
		expect(addRecent(['🔥', '🌱', '🧹'], '🧹')).toEqual(['🧹', '🔥', '🌱']);
		expect(addRecent(['🔥', '🌱', '🧹'], '🌱')).toEqual(['🌱', '🔥', '🧹']);
	});

	it('el que ya era el primero queda igual', () => {
		expect(addRecent(['🔥', '🌱'], '🔥')).toEqual(['🔥', '🌱']);
	});

	it('conserva hasta 16 y, con la lista llena, descarta el más viejo', () => {
		const fifteen = Array.from({ length: 15 }, (_, i) => `a${i}`);
		expect(addRecent(fifteen, 'nuevo')).toHaveLength(16);
		const sixteen = Array.from({ length: 16 }, (_, i) => `a${i}`);
		const result = addRecent(sixteen, 'nuevo');
		expect(MAX_RECENT).toBe(16);
		expect(result).toEqual(['nuevo', ...sixteen.slice(0, 15)]);
	});

	it('con la lista llena, elegir uno que ya estaba no descarta ninguno', () => {
		const sixteen = Array.from({ length: 16 }, (_, i) => `a${i}`);
		expect(addRecent(sixteen, 'a15')).toEqual(['a15', ...sixteen.slice(0, 15)]);
	});

	it('no modifica la lista recibida', () => {
		const recents = ['🔥'];
		addRecent(recents, '🌱');
		expect(recents).toEqual(['🔥']);
	});
});
