// Spec §4.3 y §7: los cambios de la app a las etiquetas de una tarea.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { applyReferences } from './label-references';

const id: fc.Arbitrary<string> = fc.constantFrom('a', 'b', 'c', 'd', 'e');
const ids = fc.uniqueArray(id, { maxLength: 5 });
/** Como los arman borrar, fusionar y limpiar: nunca se pone una que se quita. */
const change = fc
	.record({ remove: fc.array(id, { maxLength: 3 }), put: fc.array(id, { maxLength: 3 }) })
	.map(({ remove, put }) => ({ remove, put: put.filter((x) => !remove.includes(x)) }));

describe('aplicarReferencias (propiedades)', () => {
	it('no repite, contiene las puestas y, de las demás, solo las que estaban y no se quitaron', () => {
		fc.assert(
			fc.property(ids, change, (before, c) => {
				const after = applyReferences(before, c);
				expect(new Set(after).size).toBe(after.length);
				c.put.forEach((putLabel) => expect(after).toContain(putLabel));
				after.filter((x) => !c.put.includes(x)).forEach((x) => expect(before.includes(x) && !c.remove.includes(x)).toBe(true));
			})
		);
	});

	it('es idempotente: repetir el cambio (otro dispositivo, un reintento) no cambia nada', () => {
		fc.assert(
			fc.property(ids, change, (before, c) => {
				const one = applyReferences(before, c);
				expect(applyReferences(one, c)).toStrictEqual(one);
			})
		);
	});
});
