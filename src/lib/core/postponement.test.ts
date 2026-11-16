import { describe, expect, it } from 'vitest';
import { POSTPONE_OPTIONS, postpone, removePostpone } from './postponement';

describe('posponer (spec §5.9)', () => {
	it('1 hora y 3 horas suman al momento, con los segundos', () => {
		const now = new Date(2026, 6, 15, 10, 15, 30);

		expect(postpone('1 hora', now)).toStrictEqual({ postponed: { from: now, to: new Date(2026, 6, 15, 11, 15, 30) } });
		expect(postpone('3 horas', now)).toStrictEqual({ postponed: { from: now, to: new Date(2026, 6, 15, 13, 15, 30) } });
	});

	it('las horas pasan la medianoche y el fin de mes', () => {
		const now = new Date(2026, 6, 31, 22, 30, 0);

		expect(postpone('3 horas', now).postponed).toStrictEqual({ from: now, to: new Date(2026, 7, 1, 1, 30, 0) });
	});

	it.each([
		['de día', new Date(2026, 6, 15, 10, 0, 0), new Date(2026, 6, 16, 7, 0, 0)],
		['de madrugada: no es a las 07:00 de hoy', new Date(2026, 6, 15, 0, 30, 0), new Date(2026, 6, 16, 7, 0, 0)],
		['el último segundo del día', new Date(2026, 6, 15, 23, 59, 59), new Date(2026, 6, 16, 7, 0, 0)],
		['el último día del año', new Date(2026, 11, 31, 8, 0, 0), new Date(2027, 0, 1, 7, 0, 0)]
	])('hasta mañana es a las 07:00 del día siguiente: %s', (_, now, to) => {
		expect(postpone('hasta mañana', now)).toStrictEqual({ postponed: { from: now, to } });
	});

	it('ofrece las tres opciones, con su texto del panel', () => {
		expect(POSTPONE_OPTIONS).toStrictEqual([
			{ option: '1 hora', label: '1 hora' },
			{ option: '3 horas', label: '3 horas' },
			{ option: 'hasta mañana', label: 'Hasta mañana' }
		]);
	});
});

describe('quitarPosponer (spec §5.9)', () => {
	it('borra pospuesta', () => {
		expect(removePostpone()).toStrictEqual({ postponed: null });
	});
});
