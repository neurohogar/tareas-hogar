import { describe, expect, it } from 'vitest';
import { esOcurrencia, primeraOcurrenciaPosterior, ultimaOcurrenciaEntre } from './ocurrencias';
import type { DiaSemana, RecurrenciaCalendario } from './tarea';

const dia = (anio: number, mes: number, d: number) => new Date(anio, mes - 1, d);
const semanal = (...diasSemana: DiaSemana[]): RecurrenciaCalendario => ({
	modo: 'calendario',
	diasSemana
});
const mensual = (...diasMes: number[]): RecurrenciaCalendario => ({ modo: 'calendario', diasMes });

describe('esOcurrencia', () => {
	it.each([
		['lunes', dia(2026, 7, 13)],
		['martes', dia(2026, 7, 14)],
		['sábado', dia(2026, 7, 18)],
		['domingo', dia(2026, 7, 19)]
	] as const)('una semanal ocurre el %s que corresponde', (nombre, fecha) => {
		expect(esOcurrencia(semanal(nombre), fecha)).toBe(true);
		expect(esOcurrencia(semanal(nombre), dia(2026, 7, fecha.getDate() + 1))).toBe(false);
	});

	it('una mensual ocurre en sus días del mes', () => {
		expect(esOcurrencia(mensual(10, 20), dia(2026, 7, 20))).toBe(true);
		expect(esOcurrencia(mensual(10, 20), dia(2026, 7, 21))).toBe(false);
	});

	it('un día que no existe en el mes cae en el último día de ese mes', () => {
		expect(esOcurrencia(mensual(31), dia(2026, 6, 30))).toBe(true);
		expect(esOcurrencia(mensual(31), dia(2026, 7, 30))).toBe(false);
		expect(esOcurrencia(mensual(29), dia(2026, 2, 28))).toBe(true);
		expect(esOcurrencia(mensual(29), dia(2028, 2, 28))).toBe(false);
		expect(esOcurrencia(mensual(29), dia(2028, 2, 29))).toBe(true);
	});
});

describe('primeraOcurrenciaPosterior', () => {
	it('es la primera ocurrencia estrictamente posterior al día dado', () => {
		expect(primeraOcurrenciaPosterior(semanal('martes', 'jueves'), dia(2026, 7, 14))).toEqual(dia(2026, 7, 16));
		expect(primeraOcurrenciaPosterior(semanal('martes', 'jueves'), dia(2026, 7, 16))).toEqual(dia(2026, 7, 21));
	});

	it('cruza meses y años, con los días que no existen en el último día del mes', () => {
		expect(primeraOcurrenciaPosterior(mensual(31), dia(2026, 1, 31))).toEqual(dia(2026, 2, 28));
		expect(primeraOcurrenciaPosterior(mensual(31), dia(2026, 2, 28))).toEqual(dia(2026, 3, 31));
		expect(primeraOcurrenciaPosterior(mensual(30, 31), dia(2026, 6, 30))).toEqual(dia(2026, 7, 30));
		expect(primeraOcurrenciaPosterior(mensual(1), dia(2026, 12, 1))).toEqual(dia(2027, 1, 1));
	});

	it('devuelve el día a las 00:00 aunque el día dado tenga hora', () => {
		expect(primeraOcurrenciaPosterior(mensual(15), new Date(2026, 6, 10, 18, 30))).toEqual(dia(2026, 7, 15));
	});

	it('rechaza una recurrencia que viola §4.2 y no ocurre nunca (por ejemplo, un documento corrupto)', () => {
		expect(() => primeraOcurrenciaPosterior(semanal(), dia(2026, 7, 14))).toThrow('no tiene días de ocurrencia');
		expect(() => primeraOcurrenciaPosterior(mensual(0), dia(2026, 7, 14))).toThrow('no tiene días de ocurrencia');
	});
});

describe('ultimaOcurrenciaEntre', () => {
	const martesYJueves = semanal('martes', 'jueves');

	it('es la ocurrencia más reciente en (desde, hasta], incluido el día hasta', () => {
		expect(ultimaOcurrenciaEntre(martesYJueves, dia(2026, 7, 12), dia(2026, 7, 17))).toEqual(dia(2026, 7, 16));
		expect(ultimaOcurrenciaEntre(martesYJueves, dia(2026, 7, 12), dia(2026, 7, 16))).toEqual(dia(2026, 7, 16));
	});

	it('excluye el día desde', () => {
		expect(ultimaOcurrenciaEntre(martesYJueves, dia(2026, 7, 14), dia(2026, 7, 15))).toBeUndefined();
	});

	it('no hay ninguna si hasta no es posterior a desde', () => {
		expect(ultimaOcurrenciaEntre(martesYJueves, dia(2026, 7, 16), dia(2026, 7, 14))).toBeUndefined();
	});
});
