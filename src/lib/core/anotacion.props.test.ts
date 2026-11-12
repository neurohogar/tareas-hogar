// Spec §4.5, §5.10 y §6.7: texto de una anotación, contexto al anotar y Editar texto.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { anotar, editarTexto, normalizarTextoDeAnotacion, type Anotacion, type PantallaActual, type Sentido } from './anotacion';

const sentido = fc.constantFrom<Sentido>('Me sirvió', 'Me molestó');
const pantalla = fc.constantFrom<PantallaActual>('Pendientes', 'Historial', 'Etiquetas', 'Anotaciones');
const instante = fc.date({ noInvalidDate: true });
const texto = fc.string({ unit: fc.constantFrom('a', 'b', ' ', '\n', '\r', '\t', 'é'), maxLength: 12 });
const panel = fc.option(fc.record({ tareaId: fc.option(fc.constantFrom('t1', 't2'), { nil: undefined }) }), { nil: undefined });
const ids = fc.constantFrom('a1', 'a2', 'a3');

const anotacion = fc.record(
	{ id: ids, sentido, anotadaEn: instante, pantalla, texto: fc.constantFrom('x', 'y') },
	{ requiredKeys: ['id', 'sentido', 'anotadaEn', 'pantalla'] }
);
const anotaciones = fc.uniqueArray(anotacion, { selector: ({ id }) => id, maxLength: 3 }) as fc.Arbitrary<Anotacion[]>;

describe('normalizarTextoDeAnotacion (propiedades)', () => {
	it('es idempotente y nunca devuelve saltos de línea, espacios en los bordes ni vacío', () => {
		fc.assert(
			fc.property(texto, (escrito) => {
				const normalizado = normalizarTextoDeAnotacion(escrito);
				if (normalizado === undefined) return;
				expect(normalizarTextoDeAnotacion(normalizado)).toBe(normalizado);
				expect(normalizado).not.toMatch(/[\r\n]/);
				expect(normalizado).toBe(normalizado.trim());
				expect(normalizado).not.toBe('');
			})
		);
	});

	it('sin nada visible no hay texto', () => {
		fc.assert(
			fc.property(fc.string({ unit: fc.constantFrom(' ', '\n', '\r', '\t'), maxLength: 8 }), (blancos) => {
				expect(normalizarTextoDeAnotacion(blancos)).toBeUndefined();
			})
		);
	});
});

describe('anotar (propiedades)', () => {
	it('con el panel abierto la pantalla es el Panel de edición y la tarea es la del panel; sin panel, la pantalla actual', () => {
		fc.assert(
			fc.property(sentido, instante, pantalla, panel, texto, (s, ahora, pantallaActual, p, escrito) => {
				const hecha = anotar('a1', s, ahora, { pantalla: pantallaActual, ...(p && { panel: p }) }, escrito);
				expect(hecha.pantalla).toBe(p ? 'Panel de edición' : pantallaActual);
				expect(hecha.tareaId).toBe(p?.tareaId);
				expect(hecha.texto).toBe(normalizarTextoDeAnotacion(escrito));
				expect(hecha.anotadaEn).toBe(ahora);
				expect(hecha.sentido).toBe(s);
			})
		);
	});

	it('el campo texto está si y solo si hay texto', () => {
		fc.assert(
			fc.property(sentido, instante, pantalla, texto, (s, ahora, pantallaActual, escrito) => {
				const hecha = anotar('a1', s, ahora, { pantalla: pantallaActual }, escrito);
				expect('texto' in hecha).toBe(normalizarTextoDeAnotacion(escrito) !== undefined);
			})
		);
	});
});

describe('editarTexto (propiedades)', () => {
	it('cambia solo el texto de esa anotación y deja las demás', () => {
		fc.assert(
			fc.property(anotaciones, ids, texto, (lista, id, escrito) => {
				const editadas = editarTexto(lista, id, escrito);
				expect(editadas).toHaveLength(lista.length);
				lista.forEach((original, i) => {
					const { texto: _a, ...restoOriginal } = original;
					const { texto: nuevo, ...restoEditada } = editadas[i];
					expect(restoEditada).toStrictEqual(restoOriginal);
					expect(nuevo).toBe(original.id === id ? normalizarTextoDeAnotacion(escrito) : original.texto);
				});
			})
		);
	});

	it('es idempotente y no revive una anotación que ya no está', () => {
		fc.assert(
			fc.property(anotaciones, ids, texto, (lista, id, escrito) => {
				const una = editarTexto(lista, id, escrito);
				expect(editarTexto(una, id, escrito)).toStrictEqual(una);
				const sin = lista.filter((a) => a.id !== id);
				expect(editarTexto(sin, id, escrito)).toStrictEqual(sin);
			})
		);
	});
});
