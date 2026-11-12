// Spec §6.2, §4.3 y §7: guardar el panel con etiquetas, y los chips de una tarea.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { datosDeTarea } from './datos-de-tarea';
import { aplicarCambio, tareaDesdeDocumento } from './documento-de-tarea';
import { PALETA, type Etiqueta } from './etiqueta';
import { etiquetasDeTarea } from './etiquetas-de-tarea';
import { editarConEtiquetas } from './guardar-con-etiquetas';
import { ordenarEtiquetas } from './orden-de-etiquetas';
import { idsDeEtiquetas, type Tarea } from './tarea';

const existentes: Etiqueta[] = ['Cocina', 'Baño', 'Patio', 'Árbol'].map((nombre, i) => ({ id: `e${i}`, nombre, color: PALETA[i] }));
const tarea = fc
	.option(fc.uniqueArray(fc.constantFrom('e0', 'e1', 'e2', 'e3', 'borrada'), { maxLength: 4 }), { nil: undefined })
	.map((ids): Tarea => ({ id: 't1', titulo: 'Pagar', tipo: 'puntual', creadaEn: new Date(0), ...(ids && { etiquetas: ids }) }));
const escritas = fc.array(fc.constantFrom('cocina', 'Baño', ' PATIO ', 'Nueva', 'nueva'), { maxLength: 5 });
let n = 0;
const nuevoId = () => `n${n++}`;

describe('etiquetasDeTarea (propiedades)', () => {
	it('son las existentes que la tarea referencia, en el orden de la §4.3: las rotas se ignoran', () => {
		fc.assert(
			fc.property(tarea, (t) => {
				const esperadas = ordenarEtiquetas(existentes.filter(({ id }) => idsDeEtiquetas(t).includes(id)));
				expect(etiquetasDeTarea(t, existentes)).toStrictEqual(esperadas);
			})
		);
	});
});

describe('editarConEtiquetas (propiedades)', () => {
	it('guardar sin tocar las etiquetas que se ven no escribe el campo', () => {
		fc.assert(
			fc.property(tarea, (t) => {
				fc.pre(idsDeEtiquetas(t).every((id) => existentes.some((e) => e.id === id)));
				const nombres = etiquetasDeTarea(t, existentes).map(({ nombre }) => nombre);
				const resultado = editarConEtiquetas(t, datosDeTarea(t), nombres, { existentes, nuevoId });
				if (!resultado.ok) throw new Error('datos válidos');
				expect(resultado.cambio.etiquetas).toBeUndefined();
				expect(resultado.nuevas).toStrictEqual([]);
			})
		);
	});

	it('la tarea queda exactamente con las etiquetas escritas, y volver a guardarlas no cambia nada', () => {
		fc.assert(
			fc.property(tarea, escritas, (t, lista) => {
				const resultado = editarConEtiquetas(t, datosDeTarea(t), lista, { existentes, nuevoId });
				if (!resultado.ok) throw new Error('datos válidos');
				const todas = [...existentes, ...resultado.nuevas];
				const [editada] = aplicarCambio([t], t.id, resultado.cambio).map(tareaDesdeDocumento);
				const nombres = etiquetasDeTarea(editada, todas).map(({ nombre }) => nombre.toLowerCase());
				expect([...nombres].sort()).toStrictEqual([...new Set(lista.map((e) => e.trim().toLowerCase()))].sort());
				const otraVez = editarConEtiquetas(editada, datosDeTarea(editada), lista, { existentes: todas, nuevoId });
				if (!otraVez.ok) throw new Error('datos válidos');
				expect(otraVez.cambio.etiquetas).toBeUndefined();
				expect(otraVez.nuevas).toStrictEqual([]);
			})
		);
	});
});
