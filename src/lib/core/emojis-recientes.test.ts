import { describe, expect, it } from 'vitest';
import { MAXIMO_DE_RECIENTES, agregarReciente } from './emojis-recientes';

describe('agregarReciente', () => {
	it('sin recientes previos, el elegido queda como único reciente', () => {
		expect(agregarReciente([], '🌱')).toEqual(['🌱']);
	});

	it('el elegido pasa al primer lugar y los anteriores bajan', () => {
		expect(agregarReciente(['🔥', '🌱'], '🧹')).toEqual(['🧹', '🔥', '🌱']);
	});

	it('uno que ya estaba se mueve al primer lugar sin repetirse', () => {
		expect(agregarReciente(['🔥', '🌱', '🧹'], '🧹')).toEqual(['🧹', '🔥', '🌱']);
		expect(agregarReciente(['🔥', '🌱', '🧹'], '🌱')).toEqual(['🌱', '🔥', '🧹']);
	});

	it('el que ya era el primero queda igual', () => {
		expect(agregarReciente(['🔥', '🌱'], '🔥')).toEqual(['🔥', '🌱']);
	});

	it('conserva hasta 16 y, con la lista llena, descarta el más viejo', () => {
		const quince = Array.from({ length: 15 }, (_, i) => `a${i}`);
		expect(agregarReciente(quince, 'nuevo')).toHaveLength(16);
		const dieciseis = Array.from({ length: 16 }, (_, i) => `a${i}`);
		const resultado = agregarReciente(dieciseis, 'nuevo');
		expect(MAXIMO_DE_RECIENTES).toBe(16);
		expect(resultado).toEqual(['nuevo', ...dieciseis.slice(0, 15)]);
	});

	it('con la lista llena, elegir uno que ya estaba no descarta ninguno', () => {
		const dieciseis = Array.from({ length: 16 }, (_, i) => `a${i}`);
		expect(agregarReciente(dieciseis, 'a15')).toEqual(['a15', ...dieciseis.slice(0, 15)]);
	});

	it('no modifica la lista recibida', () => {
		const recientes = ['🔥'];
		agregarReciente(recientes, '🌱');
		expect(recientes).toEqual(['🔥']);
	});
});
