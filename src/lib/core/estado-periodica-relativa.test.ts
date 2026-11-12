import { describe, expect, it } from 'vitest';
import { estadoPeriodicaRelativa } from './estado-periodica-relativa';
import type { Completado, RecurrenciaRelativa } from './tarea';

const HORA = 3_600_000;
const CADA_4_HORAS: RecurrenciaRelativa = { modo: 'relativo', cada: 4, unidad: 'horas' };
const CADA_2_DIAS: RecurrenciaRelativa = { modo: 'relativo', cada: 2, unidad: 'dias' };
const U = new Date(2026, 6, 15, 8, 0, 0);

const completadoEn = (fecha: Date, id = 'c'): Completado => ({ id, tareaId: 't', completadoEn: fecha });
const despuesDeU = (ms: number) => new Date(U.getTime() + ms);

describe('estadoPeriodicaRelativa', () => {
	it('nunca completada: pendiente', () => {
		expect(estadoPeriodicaRelativa(CADA_4_HORAS, [], U)).toEqual({ tipo: 'pendiente' });
	});

	it('antes del vencimiento: en espera con la fracción transcurrida del intervalo', () => {
		expect(estadoPeriodicaRelativa(CADA_4_HORAS, [completadoEn(U)], despuesDeU(HORA))).toEqual({
			tipo: 'en espera',
			progreso: 0.25
		});
	});

	it('en el momento de completar: en espera con progreso 0', () => {
		expect(estadoPeriodicaRelativa(CADA_4_HORAS, [completadoEn(U)], U)).toEqual({ tipo: 'en espera', progreso: 0 });
	});

	it('un milisegundo antes del vencimiento sigue en espera', () => {
		const estado = estadoPeriodicaRelativa(CADA_4_HORAS, [completadoEn(U)], despuesDeU(4 * HORA - 1));
		expect(estado.tipo).toBe('en espera');
	});

	it('en el vencimiento pasa a pendiente', () => {
		expect(estadoPeriodicaRelativa(CADA_4_HORAS, [completadoEn(U)], despuesDeU(4 * HORA))).toEqual({
			tipo: 'pendiente'
		});
	});

	it('un milisegundo antes de perder un ciclo completo sigue pendiente', () => {
		const estado = estadoPeriodicaRelativa(CADA_4_HORAS, [completadoEn(U)], despuesDeU(8 * HORA - 1));
		expect(estado).toEqual({ tipo: 'pendiente' });
	});

	it('al perder un ciclo completo pasa a atrasada', () => {
		expect(estadoPeriodicaRelativa(CADA_4_HORAS, [completadoEn(U)], despuesDeU(8 * HORA))).toEqual({
			tipo: 'atrasada'
		});
	});

	it('"cada N días" son N × 24 horas', () => {
		expect(estadoPeriodicaRelativa(CADA_2_DIAS, [completadoEn(U)], despuesDeU(12 * HORA))).toEqual({
			tipo: 'en espera',
			progreso: 0.25
		});
		expect(estadoPeriodicaRelativa(CADA_2_DIAS, [completadoEn(U)], despuesDeU(48 * HORA)).tipo).toBe('pendiente');
		expect(estadoPeriodicaRelativa(CADA_2_DIAS, [completadoEn(U)], despuesDeU(96 * HORA)).tipo).toBe('atrasada');
	});

	it('cuenta desde el completado más reciente, sin importar el orden de la lista', () => {
		const anterior = completadoEn(new Date(2026, 6, 14, 8, 0, 0), 'viejo');
		const reciente = completadoEn(U, 'nuevo');
		const ahora = despuesDeU(2 * HORA);

		expect(estadoPeriodicaRelativa(CADA_4_HORAS, [reciente, anterior], ahora)).toEqual({
			tipo: 'en espera',
			progreso: 0.5
		});
		expect(estadoPeriodicaRelativa(CADA_4_HORAS, [anterior, reciente], ahora)).toEqual({
			tipo: 'en espera',
			progreso: 0.5
		});
	});

	it('un completado posterior a ahora (relojes desfasados) deja el progreso en 0', () => {
		expect(estadoPeriodicaRelativa(CADA_4_HORAS, [completadoEn(U)], despuesDeU(-HORA))).toEqual({
			tipo: 'en espera',
			progreso: 0
		});
	});
});
