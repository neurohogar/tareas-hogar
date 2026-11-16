// Spec §4.1: emoji y nota opcionales.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { textFields } from './text-fields';

const optional = fc.option(fc.string(), { nil: undefined });

describe('camposDeTexto (propiedades)', () => {
	it('conserva los campos con valor y omite la clave de los vacíos o ausentes', () => {
		fc.assert(
			fc.property(optional, optional, (emoji, note) => {
				const fields = textFields({ emoji, note });
				expect(Object.keys(fields).sort()).toStrictEqual([...(emoji ? ['emoji'] : []), ...(note ? ['note'] : [])]);
				if (emoji) expect(fields.emoji).toBe(emoji);
				if (note) expect(fields.note).toBe(note);
			})
		);
	});

	it('es idempotente', () => {
		fc.assert(
			fc.property(optional, optional, (emoji, note) => {
				const one = textFields({ emoji, note });
				expect(textFields(one)).toStrictEqual(one);
			})
		);
	});
});
