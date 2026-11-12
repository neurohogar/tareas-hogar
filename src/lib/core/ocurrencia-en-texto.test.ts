// Spec §4.4: ocurrenciaCubierta se guarda como fecha (2026-07-14) o como fecha y hora (2026-07-14T07:00).
import { describe, expect, it } from 'vitest';
import { ocurrenciaDesdeTexto, ocurrenciaEnTexto } from './ocurrencia-en-texto';

describe('ocurrenciaCubierta en texto (spec §4.4)', () => {
	it('una fecha se escribe sin hora', () => {
		expect(ocurrenciaEnTexto(new Date(2026, 6, 14))).toBe('2026-07-14');
	});

	it('el inicio de una ocurrencia se escribe con fecha y hora, también a las 00:00', () => {
		expect(ocurrenciaEnTexto({ inicio: new Date(2026, 6, 14, 7, 0) })).toBe('2026-07-14T07:00');
		expect(ocurrenciaEnTexto({ inicio: new Date(2026, 6, 14, 0, 0) })).toBe('2026-07-14T00:00');
	});

	it('se lee en el mismo formato en que se escribió', () => {
		expect(ocurrenciaDesdeTexto('2026-07-14')).toStrictEqual(new Date(2026, 6, 14));
		expect(ocurrenciaDesdeTexto('2026-07-14T07:00')).toStrictEqual({ inicio: new Date(2026, 6, 14, 7, 0) });
		expect(ocurrenciaDesdeTexto('2026-07-14T00:00')).toStrictEqual({ inicio: new Date(2026, 6, 14, 0, 0) });
	});

	it.each(['2026-07-14T7:00', '2026-07-14T24:00', '2026-02-30T07:00', '2026-07-14 07:00', ''])('un texto inválido es un error (%s)', (texto) => {
		expect(() => ocurrenciaDesdeTexto(texto)).toThrow();
	});
});
