// Spec §4.5, §5.10 y §6.7: texto de una anotación, contexto al anotar y Editar texto.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { annotate, editText, normalizeAnnotationText, type Annotation, type CurrentScreen, type Sense } from './annotation';

const sense = fc.constantFrom<Sense>('Me sirvió', 'Me molestó');
const screen = fc.constantFrom<CurrentScreen>('Pendientes', 'Historial', 'Anotaciones');
const instant = fc.date({ noInvalidDate: true });
const text = fc.string({ unit: fc.constantFrom('a', 'b', ' ', '\n', '\r', '\t', 'é'), maxLength: 12 });
const panel = fc.option(fc.record({ taskId: fc.option(fc.constantFrom('t1', 't2'), { nil: undefined }) }), { nil: undefined });
const ids = fc.constantFrom('a1', 'a2', 'a3');

const annotation = fc.record(
	{ id: ids, sense, annotatedAt: instant, screen, text: fc.constantFrom('x', 'y') },
	{ requiredKeys: ['id', 'sense', 'annotatedAt', 'screen'] }
);
const annotations = fc.uniqueArray(annotation, { selector: ({ id }) => id, maxLength: 3 }) as fc.Arbitrary<Annotation[]>;

describe('normalizarTextoDeAnotacion (propiedades)', () => {
	it('es idempotente y nunca devuelve saltos de línea, espacios en los bordes ni vacío', () => {
		fc.assert(
			fc.property(text, (typedOne) => {
				const normalizedValue = normalizeAnnotationText(typedOne);
				if (normalizedValue === undefined) return;
				expect(normalizeAnnotationText(normalizedValue)).toBe(normalizedValue);
				expect(normalizedValue).not.toMatch(/[\r\n]/);
				expect(normalizedValue).toBe(normalizedValue.trim());
				expect(normalizedValue).not.toBe('');
			})
		);
	});

	it('sin nada visible no hay texto', () => {
		fc.assert(
			fc.property(fc.string({ unit: fc.constantFrom(' ', '\n', '\r', '\t'), maxLength: 8 }), (blanks) => {
				expect(normalizeAnnotationText(blanks)).toBeUndefined();
			})
		);
	});
});

describe('anotar (propiedades)', () => {
	it('con el panel abierto la pantalla es el Panel de edición y la tarea es la del panel; sin panel, la pantalla actual', () => {
		fc.assert(
			fc.property(sense, instant, screen, panel, text, (s, now, currentScreen, p, typedOne) => {
				const done = annotate('a1', s, now, { screen: currentScreen, ...(p && { panel: p }) }, typedOne);
				expect(done.screen).toBe(p ? 'Panel de edición' : currentScreen);
				expect(done.taskId).toBe(p?.taskId);
				expect(done.text).toBe(normalizeAnnotationText(typedOne));
				expect(done.annotatedAt).toBe(now);
				expect(done.sense).toBe(s);
			})
		);
	});

	it('el campo texto está si y solo si hay texto', () => {
		fc.assert(
			fc.property(sense, instant, screen, text, (s, now, currentScreen, typedOne) => {
				const done = annotate('a1', s, now, { screen: currentScreen }, typedOne);
				expect('text' in done).toBe(normalizeAnnotationText(typedOne) !== undefined);
			})
		);
	});
});

describe('editarTexto (propiedades)', () => {
	it('cambia solo el texto de esa anotación y deja las demás', () => {
		fc.assert(
			fc.property(annotations, ids, text, (list, id, typedOne) => {
				const editedItems = editText(list, id, typedOne);
				expect(editedItems).toHaveLength(list.length);
				list.forEach((original, i) => {
					const { text: _a, ...restOriginal } = original;
					const { text: newValue, ...restEdited } = editedItems[i];
					expect(restEdited).toStrictEqual(restOriginal);
					expect(newValue).toBe(original.id === id ? normalizeAnnotationText(typedOne) : original.text);
				});
			})
		);
	});

	it('es idempotente y no revive una anotación que ya no está', () => {
		fc.assert(
			fc.property(annotations, ids, text, (list, id, typedOne) => {
				const one = editText(list, id, typedOne);
				expect(editText(one, id, typedOne)).toStrictEqual(one);
				const without = list.filter((a) => a.id !== id);
				expect(editText(without, id, typedOne)).toStrictEqual(without);
			})
		);
	});
});
