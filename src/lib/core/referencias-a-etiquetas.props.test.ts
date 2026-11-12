// Spec §4.3 y §7: los cambios de la app a las etiquetas de una tarea.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { aplicarReferencias } from './referencias-a-etiquetas';

const id: fc.Arbitrary<string> = fc.constantFrom('a', 'b', 'c', 'd', 'e');
const ids = fc.uniqueArray(id, { maxLength: 5 });
/** Como los arman borrar, fusionar y limpiar: nunca se pone una que se quita. */
const cambio = fc
	.record({ quitar: fc.array(id, { maxLength: 3 }), poner: fc.array(id, { maxLength: 3 }) })
	.map(({ quitar, poner }) => ({ quitar, poner: poner.filter((x) => !quitar.includes(x)) }));

describe('aplicarReferencias (propiedades)', () => {
	it('no repite, contiene las puestas y, de las demás, solo las que estaban y no se quitaron', () => {
		fc.assert(
			fc.property(ids, cambio, (antes, c) => {
				const despues = aplicarReferencias(antes, c);
				expect(new Set(despues).size).toBe(despues.length);
				c.poner.forEach((puesta) => expect(despues).toContain(puesta));
				despues.filter((x) => !c.poner.includes(x)).forEach((x) => expect(antes.includes(x) && !c.quitar.includes(x)).toBe(true));
			})
		);
	});

	it('es idempotente: repetir el cambio (otro dispositivo, un reintento) no cambia nada', () => {
		fc.assert(
			fc.property(ids, cambio, (antes, c) => {
				const una = aplicarReferencias(antes, c);
				expect(aplicarReferencias(una, c)).toStrictEqual(una);
			})
		);
	});
});
