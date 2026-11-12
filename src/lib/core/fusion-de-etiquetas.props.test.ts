// Spec §7 (Etiquetas duplicadas) y §4.3 (Borrar una etiqueta, Etiqueta borrada):
// lo que la app escribe al fusionar, borrar y limpiar, aplicado como el servidor.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { borradoDeEtiqueta, referenciasRotas } from './borrado-de-etiqueta';
import { aplicarCambiosDeReferencias, tareaDesdeDocumento } from './documento-de-tarea';
import { mismoNombre, PALETA, type Etiqueta } from './etiqueta';
import { fusionDeDuplicadas } from './fusion-de-etiquetas';
import { idsDeEtiquetas, type Tarea } from './tarea';

/** Pocos nombres, con variantes de mayúsculas y acentos, para que haya duplicadas. */
const nombre = fc.constantFrom('Cocina', 'cocina', 'COCINA', 'Baño', 'baño', 'Bano', 'Patio');
const IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'a1', 'a10', 'a2'];
const etiquetas = fc
	.uniqueArray(fc.record({ id: fc.constantFrom(...IDS), nombre, color: fc.constantFrom(...PALETA) }), {
		maxLength: 8,
		selector: ({ id }) => id
	})
	.map((lista) => lista as Etiqueta[]);
/** Tareas cuyas etiquetas son ids cualesquiera (algunos pueden no existir), sin repetir. */
const tareas = fc
	.array(fc.option(fc.uniqueArray(fc.constantFrom(...IDS, 'borrada'), { maxLength: 5 }), { nil: undefined }), { maxLength: 6 })
	.map((listas) =>
		listas.map((ids, i): Tarea => ({
			id: `t${i}`,
			titulo: `T${i}`,
			tipo: 'puntual',
			creadaEn: new Date(0),
			...(ids && { etiquetas: ids })
		}))
	);
const permutacion = <T>(lista: readonly T[]) => fc.shuffledSubarray([...lista], { minLength: lista.length });

/** El estado tras aplicar la fusión como el servidor. */
function fusionar(lista: readonly Etiqueta[], ts: readonly Tarea[]) {
	const { borradas, referencias } = fusionDeDuplicadas(lista, ts);
	return {
		etiquetas: lista.filter(({ id }) => !borradas.includes(id)),
		tareas: aplicarCambiosDeReferencias(ts, referencias).map(tareaDesdeDocumento)
	};
}

const sinRepetir = (ids: readonly string[]) => new Set(ids).size === ids.length;
const porId = (ids: readonly string[]) => [...ids].sort();

describe('fusionDeDuplicadas (propiedades)', () => {
	it('nunca pone una etiqueta que quita: cada borrada se reemplaza por una sobreviviente', () => {
		fc.assert(
			fc.property(etiquetas, tareas, (lista, ts) => {
				const { borradas, referencias } = fusionDeDuplicadas(lista, ts);
				referencias.forEach(({ quitar, poner }) => {
					quitar.forEach((id) => expect(borradas).toContain(id));
					poner.forEach((id) => expect(borradas).not.toContain(id));
				});
			})
		);
	});

	it('deja nombres únicos sin distinguir mayúsculas; las sobrevivientes conservan nombre y color', () => {
		fc.assert(
			fc.property(etiquetas, tareas, (lista, ts) => {
				const despues = fusionar(lista, ts).etiquetas;
				despues.forEach((a, i) => despues.slice(i + 1).forEach((b) => expect(mismoNombre(a.nombre, b.nombre)).toBe(false)));
				despues.forEach((etiqueta) => expect(lista).toContainEqual(etiqueta));
			})
		);
	});

	it('es idempotente: después de fusionar no queda nada que fusionar', () => {
		fc.assert(
			fc.property(etiquetas, tareas, (lista, ts) => {
				const despues = fusionar(lista, ts);
				expect(fusionDeDuplicadas(despues.etiquetas, despues.tareas)).toStrictEqual({ borradas: [], referencias: [] });
			})
		);
	});

	it('no pierde asignaciones: cada tarea queda con la sobreviviente de cada nombre que tenía, sin repetir', () => {
		fc.assert(
			fc.property(etiquetas, tareas, (lista, ts) => {
				const despues = fusionar(lista, ts);
				ts.forEach((antes, i) => {
					const ahora = idsDeEtiquetas(despues.tareas[i]);
					expect(sinRepetir(ahora)).toBe(true);
					for (const id of idsDeEtiquetas(antes)) {
						const etiqueta = lista.find((e) => e.id === id);
						const esperada = etiqueta ? despues.etiquetas.find((e) => mismoNombre(e.nombre, etiqueta.nombre))?.id : id;
						expect(ahora).toContain(esperada);
					}
					const nombradas = new Set(idsDeEtiquetas(antes));
					ahora.forEach((id) => expect(nombradas.has(id) || despues.etiquetas.some((e) => e.id === id)).toBe(true));
				});
			})
		);
	});

	it('no borra tareas ni toca las que no tenían duplicadas', () => {
		fc.assert(
			fc.property(etiquetas, tareas, (lista, ts) => {
				const { borradas } = fusionDeDuplicadas(lista, ts);
				const despues = fusionar(lista, ts).tareas;
				expect(despues.map(({ id }) => id)).toStrictEqual(ts.map(({ id }) => id));
				ts.forEach((tarea, i) => {
					if (!idsDeEtiquetas(tarea).some((id) => borradas.includes(id))) expect(despues[i]).toStrictEqual(tarea);
				});
			})
		);
	});

	it('no depende del orden de las etiquetas', () => {
		fc.assert(
			fc.property(
				etiquetas.chain((lista) => permutacion(lista).map((otra) => [lista, otra] as const)),
				tareas,
				([lista, otra], ts) => {
					const una = fusionDeDuplicadas(lista, ts);
					const otraFusion = fusionDeDuplicadas(otra, ts);
					expect(porId(otraFusion.borradas)).toStrictEqual(porId(una.borradas));
					expect(fusionar(otra, ts).tareas.map((t) => porId(idsDeEtiquetas(t)))).toStrictEqual(
						fusionar(lista, ts).tareas.map((t) => porId(idsDeEtiquetas(t)))
					);
				}
			)
		);
	});
});

describe('borradoDeEtiqueta (propiedades)', () => {
	it('la quita de todas las tareas, no borra ninguna y deja las otras etiquetas', () => {
		fc.assert(
			fc.property(tareas, fc.constantFrom(...IDS), (ts, etiquetaId) => {
				const despues = aplicarCambiosDeReferencias(ts, borradoDeEtiqueta(etiquetaId, ts).referencias).map(tareaDesdeDocumento);
				expect(despues.map(({ id }) => id)).toStrictEqual(ts.map(({ id }) => id));
				ts.forEach((tarea, i) => {
					expect(idsDeEtiquetas(despues[i])).toStrictEqual(idsDeEtiquetas(tarea).filter((id) => id !== etiquetaId));
				});
			})
		);
	});
});

describe('referenciasRotas (propiedades)', () => {
	it('limpiarlas quita solo las que no existen y es idempotente', () => {
		fc.assert(
			fc.property(etiquetas, tareas, (lista, ts) => {
				const despues = aplicarCambiosDeReferencias(ts, referenciasRotas(ts, lista)).map(tareaDesdeDocumento);
				ts.forEach((tarea, i) => {
					const existe = (id: string) => lista.some((e) => e.id === id);
					expect(idsDeEtiquetas(despues[i])).toStrictEqual(idsDeEtiquetas(tarea).filter(existe));
				});
				expect(referenciasRotas(despues, lista)).toStrictEqual([]);
			})
		);
	});
});
