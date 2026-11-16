import { describe, expect, it } from 'vitest';
import { lastCovered, lastCoveredOccurrence } from './covered-occurrence';
import type { Completion } from './task';

const CREATED = new Date(2026, 5, 1, 8, 0, 0);
const day = (d: number) => new Date(2026, 6, d);

const covers = (d: number, completedAt = day(d)): Completion => ({
	id: `c-${d}`,
	taskId: 't',
	completedAt,
	coveredOccurrence: day(d)
});
const uncovered = (completedAt: Date): Completion => ({ id: 'c-libre', taskId: 't', completedAt });

describe('ultimaOcurrenciaCubierta (P)', () => {
	it('sin completados es el día anterior a creadaEn', () => {
		expect(lastCoveredOccurrence(CREATED, [])).toEqual(new Date(2026, 4, 31));
	});

	it('es la mayor ocurrenciaCubierta', () => {
		expect(lastCoveredOccurrence(CREATED, [covers(16, day(14)), covers(7)])).toEqual(day(16));
	});

	it('un completado sin ocurrenciaCubierta aporta el día de su completadoEn', () => {
		expect(lastCoveredOccurrence(CREATED, [uncovered(new Date(2026, 6, 13, 10, 0, 0))])).toEqual(day(13));
	});

	it('toma la mayor entre las cubiertas y los días de los completados sin cubierta', () => {
		const completions = [covers(7), uncovered(new Date(2026, 6, 13, 10, 0, 0))];

		expect(lastCoveredOccurrence(CREATED, completions)).toEqual(day(13));
		expect(lastCoveredOccurrence(CREATED, [covers(16), uncovered(new Date(2026, 6, 14, 23, 0, 0))])).toEqual(day(16));
	});
});

const at = (d: number, hour = 0) => new Date(2026, 6, d, hour);
const ms = (d: number, hour = 0) => at(d, hour).getTime();
const completion = (completedAt: Date, coveredOccurrence?: Completion['coveredOccurrence']): Completion => ({
	id: `c-${completedAt.getTime()}`,
	taskId: 't',
	completedAt,
	...(coveredOccurrence && { coveredOccurrence })
});
const coversStart = (completedAt: Date, start: Date) => completion(completedAt, { start });

describe('P con horario (spec §5.6)', () => {
	it('una ocurrenciaCubierta con hora es el instante que cubrió', () => {
		expect(lastCovered(at(1), [coversStart(at(15, 8), at(15, 7))])).toBe(ms(15, 7));
	});

	it('una fecha sola, o un completado sin ocurrenciaCubierta, cubre el día entero', () => {
		expect(lastCovered(at(1), [completion(at(15, 8), at(15))])).toBe(ms(16) - 1);
		expect(lastCovered(at(1), [completion(at(15, 6))])).toBe(ms(16) - 1);
	});

	it('con hora y sin hora, es la mayor de los completados', () => {
		expect(lastCovered(at(1), [coversStart(at(15, 19), at(15, 18)), completion(at(15, 8), at(15))])).toBe(ms(16) - 1);
		expect(lastCovered(at(1), [completion(at(14, 8), at(14)), coversStart(at(15, 8), at(15, 7))])).toBe(ms(15, 7));
	});

	it('sin completados, cubre el día anterior a creadaEn entero', () => {
		expect(lastCovered(at(15, 12), [])).toBe(ms(15) - 1);
	});
});

describe('ultimaOcurrenciaCubierta con horario (spec §5.3, §5.6)', () => {
	it('una ocurrenciaCubierta con hora cuenta por su día', () => {
		expect(lastCoveredOccurrence(CREATED, [coversStart(at(15, 19), at(15, 18))])).toEqual(day(15));
	});
});
