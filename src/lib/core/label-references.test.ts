import { describe, expect, it } from 'vitest';
import { applyReferences } from './label-references';

describe('aplicarReferencias', () => {
	it('quita las nombradas y deja las otras en su orden', () => {
		expect(applyReferences(['a', 'b', 'c'], { remove: ['b', 'x'], put: [] })).toStrictEqual(['a', 'c']);
	});

	it('pone al final las que no estaban, sin repetir las que ya están ni entre ellas', () => {
		expect(applyReferences(['a', 'b'], { remove: [], put: ['b', 'c', 'c'] })).toStrictEqual(['a', 'b', 'c']);
	});

	it('quita antes de poner: reemplazar una por otra', () => {
		expect(applyReferences(['b', 'a'], { remove: ['b'], put: ['a'] })).toStrictEqual(['a']);
	});
});
