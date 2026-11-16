// Spec §4.4: ocurrenciaCubierta como texto, ida y vuelta.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { enElMinuto } from './days';
import { ocurrenciaDesdeTexto, ocurrenciaEnTexto } from './occurrence-in-text';

const dia = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
const minuto = fc.integer({ min: 0, max: 1439 });

describe('ocurrencia en texto (propiedades, spec §4.4)', () => {
	it('una fecha sola vuelve como la misma fecha', () => {
		fc.assert(
			fc.property(dia, (d) => {
				expect(ocurrenciaDesdeTexto(ocurrenciaEnTexto(d))).toEqual(d);
			})
		);
	});

	it('el inicio de una ocurrencia vuelve como el mismo inicio, también a las 00:00, nunca como una fecha', () => {
		fc.assert(
			fc.property(dia, minuto, (d, m) => {
				const ocurrencia = { inicio: enElMinuto(d, m) };
				expect(ocurrenciaDesdeTexto(ocurrenciaEnTexto(ocurrencia))).toEqual(ocurrencia);
			})
		);
	});
});
