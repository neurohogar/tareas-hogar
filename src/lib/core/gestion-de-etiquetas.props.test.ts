// Spec §4.3 y §6.4 (Renombrar).
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { mismoNombre, PALETA, type Etiqueta } from './etiqueta';
import { aplicarCambioDeEtiqueta, renombrar } from './gestion-de-etiquetas';

const nombre = fc.constantFrom('Cocina', 'cocina', ' COCINA ', 'Baño', 'Patio', '  ', 'x'.repeat(31));
const etiquetas = fc
	.uniqueArray(fc.constantFrom('Cocina', 'Baño', 'Patio', 'Árbol'), { minLength: 1, maxLength: 4 })
	.map((nombres) => nombres.map((n, i): Etiqueta => ({ id: `e${i}`, nombre: n, color: PALETA[i] })));

describe('renombrar (propiedades)', () => {
	it('un renombrado aceptado nunca deja dos etiquetas con el mismo nombre (sin distinguir mayúsculas)', () => {
		fc.assert(
			fc.property(etiquetas, fc.nat(), nombre, (lista, indice, escrito) => {
				const etiqueta = lista[indice % lista.length];
				const resultado = renombrar(etiqueta, escrito, lista);
				if (!resultado.ok) return;
				const despues = aplicarCambioDeEtiqueta(lista, etiqueta.id, resultado.cambio);
				despues.forEach((a, i) => despues.slice(i + 1).forEach((b) => expect(mismoNombre(a.nombre, b.nombre)).toBe(false)));
				expect(despues.find(({ id }) => id === etiqueta.id)?.color).toBe(etiqueta.color);
			})
		);
	});
});
