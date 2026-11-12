// Spec §4.3 (Creación, Color de una etiqueta nueva) y §6.2: guardar el panel con etiquetas escritas.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { colorMenosUsado } from './color-de-etiqueta';
import { mismoNombre, PALETA, type Etiqueta } from './etiqueta';
import { elegirEtiquetas, guardarElegidas } from './etiquetas-escritas';

const nombre = fc.constantFrom('Cocina', 'cocina', ' COCINA ', 'Baño', 'baño', 'Patio', 'Árbol', 'arbol');
const existentes = fc
	.uniqueArray(
		fc.record({ id: fc.constantFrom('e1', 'e2', 'e3', 'e4'), nombre: nombre.map((n) => n.trim()), color: fc.constantFrom(...PALETA) }),
		{
			maxLength: 4,
			selector: ({ id }) => id
		}
	)
	.filter((lista) => lista.every((a, i) => lista.slice(i + 1).every((b) => !mismoNombre(a.nombre, b.nombre))))
	.map((lista) => lista as Etiqueta[]);
const escritas = fc.array(nombre, { maxLength: 6 });

describe('elegirEtiquetas (propiedades)', () => {
	it('una por nombre (sin distinguir mayúsculas): la existente si la hay; las nuevas con el color menos usado hasta ese momento', () => {
		fc.assert(
			fc.property(escritas, existentes, (lista, ya) => {
				const eleccion = elegirEtiquetas(lista, ya);
				if (!eleccion.ok) throw new Error('nombres válidos');
				const { elegidas } = eleccion;
				elegidas.forEach((a, i) => elegidas.slice(i + 1).forEach((b) => expect(mismoNombre(a.nombre, b.nombre)).toBe(false)));
				lista.forEach((escrita) => expect(elegidas.some((e) => mismoNombre(e.nombre, escrita.trim()))).toBe(true));
				const colores = ya.map(({ color }) => color);
				for (const elegida of elegidas) {
					const existente = ya.find((e) => mismoNombre(e.nombre, elegida.nombre));
					if (existente) expect(elegida).toStrictEqual(existente);
					else {
						expect(elegida.color).toBe(colorMenosUsado(colores));
						colores.push(elegida.color);
					}
				}
			})
		);
	});

	it('elegir lo ya elegido no cambia nada (volver a guardar el panel)', () => {
		fc.assert(
			fc.property(escritas, existentes, (lista, ya) => {
				const eleccion = elegirEtiquetas(lista, ya);
				if (!eleccion.ok) throw new Error('nombres válidos');
				const nombres = eleccion.elegidas.map(({ nombre }) => nombre);
				expect(elegirEtiquetas(nombres, ya)).toStrictEqual(eleccion);
			})
		);
	});
});

describe('guardarElegidas (propiedades)', () => {
	it('da un id a cada nueva, conserva el de las existentes y en el mismo orden', () => {
		fc.assert(
			fc.property(escritas, existentes, (lista, ya) => {
				const eleccion = elegirEtiquetas(lista, ya);
				if (!eleccion.ok) throw new Error('nombres válidos');
				let n = 0;
				const { ids, nuevas } = guardarElegidas(eleccion.elegidas, () => `n${n++}`);
				expect(new Set(ids).size).toBe(ids.length);
				expect(nuevas.map(({ id }) => id)).toStrictEqual(ids.filter((id) => id.startsWith('n')));
				eleccion.elegidas.forEach((elegida, i) => {
					if (elegida.id !== undefined) expect(ids[i]).toBe(elegida.id);
				});
			})
		);
	});
});
