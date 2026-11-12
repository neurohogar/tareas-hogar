// Spec §6.2 (Etiquetas en el panel).
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { mismoNombre, PALETA, type Etiqueta } from './etiqueta';
import { agregarEscrita, quitarElegida, sugerencias } from './panel-de-etiquetas';

const nombre = fc.constantFrom('Cocina', 'cocina', ' COCINA ', 'Baño', 'BANO', 'Patio', '   ', 'co', 'x'.repeat(31));
const existentes: Etiqueta[] = [
	{ id: 'e1', nombre: 'Cocina', color: PALETA[0] },
	{ id: 'e2', nombre: 'Baño', color: PALETA[1] }
];
/** Lo elegido en el panel: lo que dejan agregar los Enter sucesivos. */
const elegidas = fc.array(nombre, { maxLength: 5 }).map((escritas) =>
	escritas.reduce<string[]>((actuales, escrita) => {
		const agregado = agregarEscrita(escrita, existentes, actuales);
		return agregado.ok ? agregado.nombres : actuales;
	}, [])
);
const sinRepetir = (nombres: readonly string[]) => nombres.every((a, i) => nombres.slice(i + 1).every((b) => !mismoNombre(a, b)));

describe('agregarEscrita (propiedades)', () => {
	it('nunca repite un nombre y agregar dos veces lo mismo es como una', () => {
		fc.assert(
			fc.property(nombre, elegidas, (escrita, actuales) => {
				expect(sinRepetir(actuales)).toBe(true);
				const una = agregarEscrita(escrita, existentes, actuales);
				if (!una.ok) return;
				expect(sinRepetir(una.nombres)).toBe(true);
				expect(agregarEscrita(escrita, existentes, una.nombres)).toStrictEqual(una);
			})
		);
	});

	it('quitar lo agregado lo saca, sin tocar el resto', () => {
		fc.assert(
			fc.property(nombre, elegidas, (escrita, actuales) => {
				const agregado = agregarEscrita(escrita, existentes, actuales);
				if (!agregado.ok || agregado.nombres.length === actuales.length) return;
				const nuevo = agregado.nombres[agregado.nombres.length - 1];
				expect(quitarElegida(nuevo, agregado.nombres)).toStrictEqual(actuales);
			})
		);
	});
});

describe('sugerencias (propiedades)', () => {
	it('nunca sugiere una ya elegida ni ofrece crear una que existe', () => {
		fc.assert(
			fc.property(nombre, elegidas, (escrito, actuales) => {
				const { etiquetas, crear } = sugerencias(escrito, existentes, actuales);
				etiquetas.forEach((e) => expect(actuales.some((n) => mismoNombre(n, e.nombre))).toBe(false));
				if (crear !== undefined) expect(existentes.some((e) => mismoNombre(e.nombre, crear))).toBe(false);
			})
		);
	});
});
