import { describe, expect, it } from 'vitest';
import { ultimaCubierta, ultimaOcurrenciaCubierta } from './ocurrencia-cubierta';
import type { Completado } from './tarea';

const CREADA = new Date(2026, 5, 1, 8, 0, 0);
const dia = (d: number) => new Date(2026, 6, d);

const cubre = (d: number, completadoEn = dia(d)): Completado => ({
	id: `c-${d}`,
	tareaId: 't',
	completadoEn,
	ocurrenciaCubierta: dia(d)
});
const sinCubierta = (completadoEn: Date): Completado => ({ id: 'c-libre', tareaId: 't', completadoEn });

describe('ultimaOcurrenciaCubierta (P)', () => {
	it('sin completados es el día anterior a creadaEn', () => {
		expect(ultimaOcurrenciaCubierta(CREADA, [])).toEqual(new Date(2026, 4, 31));
	});

	it('es la mayor ocurrenciaCubierta', () => {
		expect(ultimaOcurrenciaCubierta(CREADA, [cubre(16, dia(14)), cubre(7)])).toEqual(dia(16));
	});

	it('un completado sin ocurrenciaCubierta aporta el día de su completadoEn', () => {
		expect(ultimaOcurrenciaCubierta(CREADA, [sinCubierta(new Date(2026, 6, 13, 10, 0, 0))])).toEqual(dia(13));
	});

	it('toma la mayor entre las cubiertas y los días de los completados sin cubierta', () => {
		const completados = [cubre(7), sinCubierta(new Date(2026, 6, 13, 10, 0, 0))];

		expect(ultimaOcurrenciaCubierta(CREADA, completados)).toEqual(dia(13));
		expect(ultimaOcurrenciaCubierta(CREADA, [cubre(16), sinCubierta(new Date(2026, 6, 14, 23, 0, 0))])).toEqual(dia(16));
	});
});

const en = (d: number, hora = 0) => new Date(2026, 6, d, hora);
const ms = (d: number, hora = 0) => en(d, hora).getTime();
const completado = (completadoEn: Date, ocurrenciaCubierta?: Completado['ocurrenciaCubierta']): Completado => ({
	id: `c-${completadoEn.getTime()}`,
	tareaId: 't',
	completadoEn,
	...(ocurrenciaCubierta && { ocurrenciaCubierta })
});
const cubreInicio = (completadoEn: Date, inicio: Date) => completado(completadoEn, { inicio });

describe('P con horario (spec §5.6)', () => {
	it('una ocurrenciaCubierta con hora es el instante que cubrió', () => {
		expect(ultimaCubierta(en(1), [cubreInicio(en(15, 8), en(15, 7))])).toBe(ms(15, 7));
	});

	it('una fecha sola, o un completado sin ocurrenciaCubierta, cubre el día entero', () => {
		expect(ultimaCubierta(en(1), [completado(en(15, 8), en(15))])).toBe(ms(16) - 1);
		expect(ultimaCubierta(en(1), [completado(en(15, 6))])).toBe(ms(16) - 1);
	});

	it('con hora y sin hora, es la mayor de los completados', () => {
		expect(ultimaCubierta(en(1), [cubreInicio(en(15, 19), en(15, 18)), completado(en(15, 8), en(15))])).toBe(ms(16) - 1);
		expect(ultimaCubierta(en(1), [completado(en(14, 8), en(14)), cubreInicio(en(15, 8), en(15, 7))])).toBe(ms(15, 7));
	});

	it('sin completados, cubre el día anterior a creadaEn entero', () => {
		expect(ultimaCubierta(en(15, 12), [])).toBe(ms(15) - 1);
	});
});

describe('ultimaOcurrenciaCubierta con horario (spec §5.3, §5.6)', () => {
	it('una ocurrenciaCubierta con hora cuenta por su día', () => {
		expect(ultimaOcurrenciaCubierta(CREADA, [cubreInicio(en(15, 19), en(15, 18))])).toEqual(dia(15));
	});
});
