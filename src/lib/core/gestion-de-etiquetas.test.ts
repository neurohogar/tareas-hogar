import { describe, expect, it } from 'vitest';
import type { Etiqueta } from './etiqueta';
import { aplicarCambioDeEtiqueta, renombrar } from './gestion-de-etiquetas';

const COCINA: Etiqueta = { id: 'e1', nombre: 'Cocina', color: 'azul' };
const BANO: Etiqueta = { id: 'e2', nombre: 'Baño', color: 'verde' };

describe('renombrar', () => {
	it('un nombre válido, sin los espacios de los extremos, es el cambio', () => {
		expect(renombrar(COCINA, '  Ropa sucia ', [COCINA, BANO])).toStrictEqual({ ok: true, cambio: { nombre: 'Ropa sucia' } });
	});

	it('el nombre de otra etiqueta, sin distinguir mayúsculas, se rechaza', () => {
		expect(renombrar(COCINA, 'BAÑO', [COCINA, BANO])).toStrictEqual({ ok: false, error: 'repetido' });
	});

	it('cambiar solo mayúsculas de la misma etiqueta se permite', () => {
		expect(renombrar(COCINA, 'COCINA', [COCINA, BANO])).toStrictEqual({ ok: true, cambio: { nombre: 'COCINA' } });
	});

	it('difiere solo en acentos: es otro nombre', () => {
		expect(renombrar(COCINA, 'Bano', [COCINA, BANO])).toStrictEqual({ ok: true, cambio: { nombre: 'Bano' } });
	});

	it('vacío o de más de 30 caracteres se rechaza', () => {
		expect(renombrar(COCINA, '   ', [COCINA])).toStrictEqual({ ok: false, error: 'vacio' });
		expect(renombrar(COCINA, 'Limpieza profunda del baño 1234', [COCINA])).toStrictEqual({ ok: false, error: 'largo' });
	});
});

describe('aplicarCambioDeEtiqueta', () => {
	it('nombre y color son campos independientes: se conservan los dos cambios', () => {
		const renombrada = aplicarCambioDeEtiqueta([COCINA, BANO], 'e1', { nombre: 'Comida' });

		expect(aplicarCambioDeEtiqueta(renombrada, 'e1', { color: 'violeta' })).toStrictEqual([
			{ id: 'e1', nombre: 'Comida', color: 'violeta' },
			BANO
		]);
	});

	it('el mismo campo: gana el último cambio', () => {
		const azul = aplicarCambioDeEtiqueta([COCINA], 'e1', { color: 'rojo' });

		expect(aplicarCambioDeEtiqueta(azul, 'e1', { color: 'verde' })).toStrictEqual([{ ...COCINA, color: 'verde' }]);
	});

	it('gana el borrado: un cambio de una etiqueta que no existe no la revive', () => {
		expect(aplicarCambioDeEtiqueta([BANO], 'e1', { nombre: 'Comida' })).toStrictEqual([BANO]);
	});
});
