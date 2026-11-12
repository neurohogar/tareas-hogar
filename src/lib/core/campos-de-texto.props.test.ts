// Spec §4.1: emoji y nota opcionales.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { camposDeTexto } from './campos-de-texto';

const opcional = fc.option(fc.string(), { nil: undefined });

describe('camposDeTexto (propiedades)', () => {
	it('conserva los campos con valor y omite la clave de los vacíos o ausentes', () => {
		fc.assert(
			fc.property(opcional, opcional, (emoji, nota) => {
				const campos = camposDeTexto({ emoji, nota });
				expect(Object.keys(campos).sort()).toStrictEqual([...(emoji ? ['emoji'] : []), ...(nota ? ['nota'] : [])]);
				if (emoji) expect(campos.emoji).toBe(emoji);
				if (nota) expect(campos.nota).toBe(nota);
			})
		);
	});

	it('es idempotente', () => {
		fc.assert(
			fc.property(opcional, opcional, (emoji, nota) => {
				const una = camposDeTexto({ emoji, nota });
				expect(camposDeTexto(una)).toStrictEqual(una);
			})
		);
	});
});
