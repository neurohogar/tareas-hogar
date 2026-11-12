// Spec §5.6 y §5.7: ocurrencias de una periódica con horario.
import { describe, expect, it } from 'vitest';
import {
	ocurrenciaQueCubreCalendario,
	ocurrenciaQueCubrePorVentana,
	proximaOcurrenciaCalendario,
	proximaOcurrenciaPorVentana,
	seCompletaPorVentana
} from './ocurrencias-con-horario';
import type { Completado, Horario, RecurrenciaCalendario, RecurrenciaRelativa } from './tarea';

const MANANA_Y_TARDE: Horario = [
	{ desde: '07:00', hasta: '10:00' },
	{ desde: '18:00', hasta: '21:00' }
];
const en = (dia: number, hora = 0, minuto = 0, segundo = 0) => new Date(2026, 6, dia, hora, minuto, segundo);
const ms = (dia: number, hora = 0, minuto = 0) => en(dia, hora, minuto).getTime();
const ocurrencia = (dia: number, desde: number, hasta: number) => ({ inicio: ms(dia, desde), cierre: ms(dia, hasta) });
const completado = (completadoEn: Date, ocurrenciaCubierta?: Completado['ocurrenciaCubierta']): Completado => ({
	id: `c-${completadoEn.getTime()}`,
	tareaId: 't',
	completadoEn,
	...(ocurrenciaCubierta && { ocurrenciaCubierta })
});
const cubreInicio = (completadoEn: Date, inicio: Date) => completado(completadoEn, { inicio });

/** Miércoles 15 y jueves 16 de julio de 2026. */
const MIERCOLES_Y_JUEVES: RecurrenciaCalendario = { modo: 'calendario', diasSemana: ['miércoles', 'jueves'] };
const CADA_2_DIAS: RecurrenciaRelativa = { modo: 'relativo', cada: 2, unidad: 'dias' };

describe('próxima ocurrencia de calendario con horario (spec §5.6)', () => {
	it('con la mañana cubierta, es la tarde del mismo día', () => {
		const n = proximaOcurrenciaCalendario(MIERCOLES_Y_JUEVES, MANANA_Y_TARDE, en(1), [cubreInicio(en(15, 8), en(15, 7))]);
		expect(n).toStrictEqual(ocurrencia(15, 18, 21));
	});

	it('con la tarde cubierta, es la mañana del próximo día de ocurrencia', () => {
		const n = proximaOcurrenciaCalendario(MIERCOLES_Y_JUEVES, MANANA_Y_TARDE, en(1), [cubreInicio(en(9, 19), en(9, 18))]);
		expect(n).toStrictEqual(ocurrencia(15, 7, 10));
	});

	it('con el día cubierto entero, es la mañana del próximo día de ocurrencia', () => {
		const n = proximaOcurrenciaCalendario(MIERCOLES_Y_JUEVES, MANANA_Y_TARDE, en(1), [completado(en(15, 8), en(15))]);
		expect(n).toStrictEqual(ocurrencia(16, 7, 10));
	});

	it('sin completados, creada un día de ocurrencia, es la primera ventana de ese día aunque ya haya pasado', () => {
		expect(proximaOcurrenciaCalendario(MIERCOLES_Y_JUEVES, MANANA_Y_TARDE, en(15, 12), [])).toStrictEqual(ocurrencia(15, 7, 10));
	});

	it('con una ventana que empieza a las 00:00 justo después de un día cubierto entero, es esa', () => {
		const medianoche: Horario = [{ desde: '00:00', hasta: '02:00' }];
		const n = proximaOcurrenciaCalendario(MIERCOLES_Y_JUEVES, medianoche, en(1), [completado(en(15, 1), en(15))]);
		expect(n).toStrictEqual(ocurrencia(16, 0, 2));
	});
});

describe('qué ocurrencia cubre un completado de calendario con horario (spec §5.6)', () => {
	const tardeDelJueves9 = [cubreInicio(en(9, 19), en(9, 18))];

	it('en la mañana, la mañana', () => {
		expect(ocurrenciaQueCubreCalendario(MIERCOLES_Y_JUEVES, MANANA_Y_TARDE, en(1), tardeDelJueves9, en(15, 8))).toStrictEqual(en(15, 7));
	});

	it('perdida la mañana, en la tarde cubre la tarde (la mañana se descarta)', () => {
		expect(ocurrenciaQueCubreCalendario(MIERCOLES_Y_JUEVES, MANANA_Y_TARDE, en(1), tardeDelJueves9, en(15, 18, 30))).toStrictEqual(
			en(15, 18)
		);
	});

	it('atrasada entre ventanas, la más reciente sin cubrir', () => {
		expect(ocurrenciaQueCubreCalendario(MIERCOLES_Y_JUEVES, MANANA_Y_TARDE, en(1), tardeDelJueves9, en(15, 12))).toStrictEqual(en(15, 7));
	});

	it('antes de N, cubre N', () => {
		const tardeDelMiercoles = [cubreInicio(en(15, 19), en(15, 18))];
		const recurrencia: RecurrenciaCalendario = { modo: 'calendario', diasSemana: ['miércoles'] };
		expect(ocurrenciaQueCubreCalendario(recurrencia, MANANA_Y_TARDE, en(1), tardeDelMiercoles, en(16, 8))).toStrictEqual(en(22, 7));
	});
});

describe('relativa con varias ventanas (spec §5.7)', () => {
	it('se completa por ventana solo con más de una ventana y el intervalo en días', () => {
		expect(seCompletaPorVentana(CADA_2_DIAS, MANANA_Y_TARDE)).toBe(true);
		expect(seCompletaPorVentana(CADA_2_DIAS, [MANANA_Y_TARDE[0]])).toBe(false);
		expect(seCompletaPorVentana({ modo: 'relativo', cada: 8, unidad: 'horas' }, MANANA_Y_TARDE)).toBe(false);
	});

	it('nunca completada, N es la primera ventana cuyo hasta es posterior a creadaEn', () => {
		expect(proximaOcurrenciaPorVentana(CADA_2_DIAS, MANANA_Y_TARDE, en(13, 6), [])).toStrictEqual(ocurrencia(13, 7, 10));
		expect(proximaOcurrenciaPorVentana(CADA_2_DIAS, MANANA_Y_TARDE, en(13, 8), [])).toStrictEqual(ocurrencia(13, 7, 10));
		expect(proximaOcurrenciaPorVentana(CADA_2_DIAS, MANANA_Y_TARDE, en(13, 10), [])).toStrictEqual(ocurrencia(13, 18, 21));
		expect(proximaOcurrenciaPorVentana(CADA_2_DIAS, MANANA_Y_TARDE, en(13, 21), [])).toStrictEqual(ocurrencia(14, 7, 10));
	});

	it('con la mañana cubierta, la ronda del día sigue', () => {
		expect(proximaOcurrenciaPorVentana(CADA_2_DIAS, MANANA_Y_TARDE, en(1), [cubreInicio(en(13, 8), en(13, 7))])).toStrictEqual(
			ocurrencia(13, 18, 21)
		);
	});

	it('con la ronda completa, la primera ventana cada `cada` días', () => {
		expect(proximaOcurrenciaPorVentana(CADA_2_DIAS, MANANA_Y_TARDE, en(1), [cubreInicio(en(13, 19), en(13, 18))])).toStrictEqual(
			ocurrencia(15, 7, 10)
		);
		const cada3: RecurrenciaRelativa = { modo: 'relativo', cada: 3, unidad: 'dias' };
		expect(proximaOcurrenciaPorVentana(cada3, MANANA_Y_TARDE, en(1), [cubreInicio(en(13, 19), en(13, 18))])).toStrictEqual(
			ocurrencia(16, 7, 10)
		);
	});

	it('un completado sin ocurrenciaCubierta cubre el día entero de su completadoEn', () => {
		expect(proximaOcurrenciaPorVentana(CADA_2_DIAS, MANANA_Y_TARDE, en(1), [completado(en(13, 8))])).toStrictEqual(ocurrencia(15, 7, 10));
	});

	it('antes del cierre de N, un completado cubre N', () => {
		const rondaDelLunes = [cubreInicio(en(13, 19), en(13, 18))];
		expect(ocurrenciaQueCubrePorVentana(CADA_2_DIAS, MANANA_Y_TARDE, en(1), rondaDelLunes, en(14, 19))).toStrictEqual(en(15, 7));
		expect(ocurrenciaQueCubrePorVentana(CADA_2_DIAS, MANANA_Y_TARDE, en(1), rondaDelLunes, en(15, 8))).toStrictEqual(en(15, 7));
	});

	it('atrasada, cubre la ventana con el inicio más reciente, de cualquier día', () => {
		const rondaDelLunes = [cubreInicio(en(13, 19), en(13, 18))];
		expect(ocurrenciaQueCubrePorVentana(CADA_2_DIAS, MANANA_Y_TARDE, en(1), rondaDelLunes, en(16, 8))).toStrictEqual(en(16, 7));
		expect(ocurrenciaQueCubrePorVentana(CADA_2_DIAS, MANANA_Y_TARDE, en(1), rondaDelLunes, en(15, 19))).toStrictEqual(en(15, 18));
		expect(ocurrenciaQueCubrePorVentana(CADA_2_DIAS, MANANA_Y_TARDE, en(1), rondaDelLunes, en(16, 5))).toStrictEqual(en(15, 18));
	});
});
