// Spec §4.1: optional emoji and note.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { textFields } from './text-fields';

const optional = fc.option(fc.string(), { nil: undefined });

describe('textFields (properties)', () => {
	it('keeps the fields with a value and omits the key of the empty or absent ones', () => {
		fc.assert(
			fc.property(optional, optional, (emoji, note) => {
				const fields = textFields({ emoji, note });
				expect(Object.keys(fields).sort()).toStrictEqual([...(emoji ? ['emoji'] : []), ...(note ? ['note'] : [])]);
				if (emoji) expect(fields.emoji).toBe(emoji);
				if (note) expect(fields.note).toBe(note);
			})
		);
	});

	it('is idempotent', () => {
		fc.assert(
			fc.property(optional, optional, (emoji, note) => {
				const one = textFields({ emoji, note });
				expect(textFields(one)).toStrictEqual(one);
			})
		);
	});
});
