import { describe, expect, it } from 'vitest';
import { aplicarReferencias } from './referencias-a-etiquetas';

describe('aplicarReferencias', () => {
	it('quita las nombradas y deja las otras en su orden', () => {
		expect(aplicarReferencias(['a', 'b', 'c'], { quitar: ['b', 'x'], poner: [] })).toStrictEqual(['a', 'c']);
	});

	it('pone al final las que no estaban, sin repetir las que ya están ni entre ellas', () => {
		expect(aplicarReferencias(['a', 'b'], { quitar: [], poner: ['b', 'c', 'c'] })).toStrictEqual(['a', 'b', 'c']);
	});

	it('quita antes de poner: reemplazar una por otra', () => {
		expect(aplicarReferencias(['b', 'a'], { quitar: ['b'], poner: ['a'] })).toStrictEqual(['a']);
	});
});
