import { describe, expect, it } from 'vitest';
import type { Label } from './label';
import { applyLabelChange, rename } from './label-management';

const KITCHEN: Label = { id: 'e1', name: 'Cocina', color: 'azul' };
const BATHROOM: Label = { id: 'e2', name: 'Baño', color: 'verde' };

describe('renombrar', () => {
	it('un nombre válido, sin los espacios de los extremos, es el cambio', () => {
		expect(rename(KITCHEN, '  Ropa sucia ', [KITCHEN, BATHROOM])).toStrictEqual({ ok: true, change: { name: 'Ropa sucia' } });
	});

	it('el nombre de otra etiqueta, sin distinguir mayúsculas, se rechaza', () => {
		expect(rename(KITCHEN, 'BAÑO', [KITCHEN, BATHROOM])).toStrictEqual({ ok: false, error: 'repetido' });
	});

	it('cambiar solo mayúsculas de la misma etiqueta se permite', () => {
		expect(rename(KITCHEN, 'COCINA', [KITCHEN, BATHROOM])).toStrictEqual({ ok: true, change: { name: 'COCINA' } });
	});

	it('difiere solo en acentos: es otro nombre', () => {
		expect(rename(KITCHEN, 'Bano', [KITCHEN, BATHROOM])).toStrictEqual({ ok: true, change: { name: 'Bano' } });
	});

	it('vacío o de más de 30 caracteres se rechaza', () => {
		expect(rename(KITCHEN, '   ', [KITCHEN])).toStrictEqual({ ok: false, error: 'vacio' });
		expect(rename(KITCHEN, 'Limpieza profunda del baño 1234', [KITCHEN])).toStrictEqual({ ok: false, error: 'largo' });
	});
});

describe('aplicarCambioDeEtiqueta', () => {
	it('nombre y color son campos independientes: se conservan los dos cambios', () => {
		const renamed = applyLabelChange([KITCHEN, BATHROOM], 'e1', { name: 'Comida' });

		expect(applyLabelChange(renamed, 'e1', { color: 'violeta' })).toStrictEqual([
			{ id: 'e1', name: 'Comida', color: 'violeta' },
			BATHROOM
		]);
	});

	it('el mismo campo: gana el último cambio', () => {
		const blue = applyLabelChange([KITCHEN], 'e1', { color: 'rojo' });

		expect(applyLabelChange(blue, 'e1', { color: 'verde' })).toStrictEqual([{ ...KITCHEN, color: 'verde' }]);
	});

	it('gana el borrado: un cambio de una etiqueta que no existe no la revive', () => {
		expect(applyLabelChange([BATHROOM], 'e1', { name: 'Comida' })).toStrictEqual([BATHROOM]);
	});
});
