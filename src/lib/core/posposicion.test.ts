import { describe, expect, it } from 'vitest';
import { OPCIONES_DE_POSPONER, posponer, quitarPosponer } from './posposicion';

describe('posponer (spec §5.9)', () => {
	it('1 hora y 3 horas suman al momento, con los segundos', () => {
		const ahora = new Date(2026, 6, 15, 10, 15, 30);

		expect(posponer('1 hora', ahora)).toStrictEqual({ pospuesta: { desde: ahora, hasta: new Date(2026, 6, 15, 11, 15, 30) } });
		expect(posponer('3 horas', ahora)).toStrictEqual({ pospuesta: { desde: ahora, hasta: new Date(2026, 6, 15, 13, 15, 30) } });
	});

	it('las horas pasan la medianoche y el fin de mes', () => {
		const ahora = new Date(2026, 6, 31, 22, 30, 0);

		expect(posponer('3 horas', ahora).pospuesta).toStrictEqual({ desde: ahora, hasta: new Date(2026, 7, 1, 1, 30, 0) });
	});

	it.each([
		['de día', new Date(2026, 6, 15, 10, 0, 0), new Date(2026, 6, 16, 7, 0, 0)],
		['de madrugada: no es a las 07:00 de hoy', new Date(2026, 6, 15, 0, 30, 0), new Date(2026, 6, 16, 7, 0, 0)],
		['el último segundo del día', new Date(2026, 6, 15, 23, 59, 59), new Date(2026, 6, 16, 7, 0, 0)],
		['el último día del año', new Date(2026, 11, 31, 8, 0, 0), new Date(2027, 0, 1, 7, 0, 0)]
	])('hasta mañana es a las 07:00 del día siguiente: %s', (_, ahora, hasta) => {
		expect(posponer('hasta mañana', ahora)).toStrictEqual({ pospuesta: { desde: ahora, hasta } });
	});

	it('ofrece las tres opciones, con su texto del panel', () => {
		expect(OPCIONES_DE_POSPONER).toStrictEqual([
			{ opcion: '1 hora', etiqueta: '1 hora' },
			{ opcion: '3 horas', etiqueta: '3 horas' },
			{ opcion: 'hasta mañana', etiqueta: 'Hasta mañana' }
		]);
	});
});

describe('quitarPosponer (spec §5.9)', () => {
	it('borra pospuesta', () => {
		expect(quitarPosponer()).toStrictEqual({ pospuesta: null });
	});
});
