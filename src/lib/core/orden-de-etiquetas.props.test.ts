// Spec §4.3 (Orden): el mismo en todos lados.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { compararIds } from './comparar-ids';
import { PALETA, type Etiqueta } from './etiqueta';
import { compararTitulos } from './orden-alfabetico';
import { ordenarEtiquetas } from './orden-de-etiquetas';

const nombre = fc.constantFrom('Cocina', 'cocina', 'Baño', 'bano', 'Ñandú', 'Nube', 'Árbol', 'arbol', 'Patio');
const etiquetas = fc.uniqueArray(
	fc.record({
		id: fc.string({ maxLength: 3 }),
		nombre,
		color: fc.constantFrom(...PALETA)
	}),
	{
		maxLength: 10,
		selector: ({ id }) => id
	}
) as fc.Arbitrary<Etiqueta[]>;
const permutadas = etiquetas.chain((lista) =>
	fc.shuffledSubarray(lista, { minLength: lista.length }).map((otra) => [lista, otra] as const)
);

describe('ordenarEtiquetas (propiedades)', () => {
	it('es una permutación de la entrada, ordenada por nombre y después por id', () => {
		fc.assert(
			fc.property(etiquetas, (lista) => {
				const ordenadas = ordenarEtiquetas(lista);
				expect([...ordenadas].sort((a, b) => compararIds(a.id, b.id))).toStrictEqual([...lista].sort((a, b) => compararIds(a.id, b.id)));
				for (let i = 1; i < ordenadas.length; i++) {
					const [a, b] = [ordenadas[i - 1], ordenadas[i]];
					const porNombre = compararTitulos(a.nombre, b.nombre);
					expect(porNombre < 0 || (porNombre === 0 && compararIds(a.id, b.id) < 0)).toBe(true);
				}
			})
		);
	});

	it('es total: no depende del orden de entrada', () => {
		fc.assert(
			fc.property(permutadas, ([lista, otra]) => {
				expect(ordenarEtiquetas(otra)).toStrictEqual(ordenarEtiquetas(lista));
			})
		);
	});

	it('no modifica la entrada', () => {
		fc.assert(
			fc.property(etiquetas, (lista) => {
				const copia = [...lista];
				ordenarEtiquetas(lista);
				expect(lista).toStrictEqual(copia);
			})
		);
	});
});
