import { describe, expect, it } from 'vitest';
import { recurringRelativeStatus } from './recurring-relative-status';
import type { Completion, RelativeRecurrence } from './task';

const TIME_RE = 3_600_000;
const EVERY_4_HOURS: RelativeRecurrence = { mode: 'relativo', every: 4, unit: 'horas' };
const EVERY_2_DAYS: RelativeRecurrence = { mode: 'relativo', every: 2, unit: 'dias' };
const U = new Date(2026, 6, 15, 8, 0, 0);

const completedAt = (date: Date, id = 'c'): Completion => ({ id, taskId: 't', completedAt: date });
const afterU = (ms: number) => new Date(U.getTime() + ms);

describe('estadoPeriodicaRelativa', () => {
	it('nunca completada: pendiente', () => {
		expect(recurringRelativeStatus(EVERY_4_HOURS, [], U)).toEqual({ kind: 'pendiente' });
	});

	it('antes del vencimiento: en espera con la fracción transcurrida del intervalo', () => {
		expect(recurringRelativeStatus(EVERY_4_HOURS, [completedAt(U)], afterU(TIME_RE))).toEqual({
			kind: 'en espera',
			progress: 0.25
		});
	});

	it('en el momento de completar: en espera con progreso 0', () => {
		expect(recurringRelativeStatus(EVERY_4_HOURS, [completedAt(U)], U)).toEqual({ kind: 'en espera', progress: 0 });
	});

	it('un milisegundo antes del vencimiento sigue en espera', () => {
		const status = recurringRelativeStatus(EVERY_4_HOURS, [completedAt(U)], afterU(4 * TIME_RE - 1));
		expect(status.kind).toBe('en espera');
	});

	it('en el vencimiento pasa a pendiente', () => {
		expect(recurringRelativeStatus(EVERY_4_HOURS, [completedAt(U)], afterU(4 * TIME_RE))).toEqual({
			kind: 'pendiente'
		});
	});

	it('un milisegundo antes de perder un ciclo completo sigue pendiente', () => {
		const status = recurringRelativeStatus(EVERY_4_HOURS, [completedAt(U)], afterU(8 * TIME_RE - 1));
		expect(status).toEqual({ kind: 'pendiente' });
	});

	it('al perder un ciclo completo pasa a atrasada', () => {
		expect(recurringRelativeStatus(EVERY_4_HOURS, [completedAt(U)], afterU(8 * TIME_RE))).toEqual({
			kind: 'atrasada'
		});
	});

	it('"cada N días" son N × 24 horas', () => {
		expect(recurringRelativeStatus(EVERY_2_DAYS, [completedAt(U)], afterU(12 * TIME_RE))).toEqual({
			kind: 'en espera',
			progress: 0.25
		});
		expect(recurringRelativeStatus(EVERY_2_DAYS, [completedAt(U)], afterU(48 * TIME_RE)).kind).toBe('pendiente');
		expect(recurringRelativeStatus(EVERY_2_DAYS, [completedAt(U)], afterU(96 * TIME_RE)).kind).toBe('atrasada');
	});

	it('cuenta desde el completado más reciente, sin importar el orden de la lista', () => {
		const previous = completedAt(new Date(2026, 6, 14, 8, 0, 0), 'viejo');
		const recent = completedAt(U, 'nuevo');
		const now = afterU(2 * TIME_RE);

		expect(recurringRelativeStatus(EVERY_4_HOURS, [recent, previous], now)).toEqual({
			kind: 'en espera',
			progress: 0.5
		});
		expect(recurringRelativeStatus(EVERY_4_HOURS, [previous, recent], now)).toEqual({
			kind: 'en espera',
			progress: 0.5
		});
	});

	it('un completado posterior a ahora (relojes desfasados) deja el progreso en 0', () => {
		expect(recurringRelativeStatus(EVERY_4_HOURS, [completedAt(U)], afterU(-TIME_RE))).toEqual({
			kind: 'en espera',
			progress: 0
		});
	});
});
