// Spec §6.1 (Filtro por etiqueta).
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { PALETA, type Etiqueta } from './etiqueta';
import { filtrarPorEtiqueta, filtroVigente } from './filtro-por-etiqueta';
import type { FilaDePendientes } from './pendientes';
import { tieneEtiqueta } from './tarea';

const IDS = ['a', 'b', 'c'];
const filas = fc.array(fc.uniqueArray(fc.constantFrom(...IDS), { maxLength: 3 }), { maxLength: 8 }).map((listas) =>
	listas.map((etiquetas, i): FilaDePendientes => ({
		tarea: { id: `t${i}`, titulo: `T${i}`, tipo: 'puntual', creadaEn: new Date(0), etiquetas },
		estado: { tipo: 'pendiente' },
		completada: false
	}))
);
const elegida = fc.option(fc.constantFrom(...IDS), { nil: undefined });

describe('filtrarPorEtiqueta (propiedades)', () => {
	it('es la subsecuencia de las filas con esa etiqueta: mismo orden de urgencia, ninguna de más ni de menos', () => {
		fc.assert(
			fc.property(filas, elegida, (lista, etiquetaId) => {
				const filtradas = filtrarPorEtiqueta(lista, etiquetaId);
				const esperadas = etiquetaId === undefined ? lista : lista.filter(({ tarea }) => tieneEtiqueta(tarea, etiquetaId));
				expect(filtradas).toStrictEqual(esperadas);
			})
		);
	});

	it('filtrar dos veces por la misma es lo mismo que una', () => {
		fc.assert(
			fc.property(filas, elegida, (lista, etiquetaId) => {
				const una = filtrarPorEtiqueta(lista, etiquetaId);
				expect(filtrarPorEtiqueta(una, etiquetaId)).toStrictEqual(una);
			})
		);
	});
});

describe('filtroVigente (propiedades)', () => {
	it('es la elegida si existe; si no, "Todas"', () => {
		const etiquetas = fc.subarray(IDS).map((ids) => ids.map((id): Etiqueta => ({ id, nombre: id, color: PALETA[0] })));
		fc.assert(
			fc.property(elegida, etiquetas, (etiquetaId, lista) => {
				const existe = lista.some(({ id }) => id === etiquetaId);
				expect(filtroVigente(etiquetaId, lista)).toBe(existe ? etiquetaId : undefined);
			})
		);
	});
});
