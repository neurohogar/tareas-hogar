import { describe, expect, it } from 'vitest';
import { recurringRelativeStatus } from './recurring-relative-status';
import type { Completion, RelativeRecurrence } from './task';

const TIME_RE = 3_600_000;
const EVERY_4_HOURS: RelativeRecurrence = { mode: 'relativo', every: 4, unit: 'horas' };
const EVERY_2_DAYS: RelativeRecurrence = { mode: 'relativo', every: 2, unit: 'dias' };
const U = new Date(2026, 6, 15, 8, 0, 0);

const completedAt = (date: Date, id = 'c'): Completion => ({ id, taskId: 't', completedAt: date });
const afterU = (ms: number) => new Date(U.getTime() + ms);

describe('recurringRelativeStatus', () => {
	it('never completed: pending', () => {
		expect(recurringRelativeStatus(EVERY_4_HOURS, [], U)).toEqual({ kind: 'pendiente' });
	});

	it('before the due moment: waiting with the elapsed fraction of the interval', () => {
		expect(recurringRelativeStatus(EVERY_4_HOURS, [completedAt(U)], afterU(TIME_RE))).toEqual({
			kind: 'en espera',
			progress: 0.25
		});
	});

	it('at the moment of completing: waiting with progress 0', () => {
		expect(recurringRelativeStatus(EVERY_4_HOURS, [completedAt(U)], U)).toEqual({ kind: 'en espera', progress: 0 });
	});

	it('one millisecond before the due moment it is still waiting', () => {
		const status = recurringRelativeStatus(EVERY_4_HOURS, [completedAt(U)], afterU(4 * TIME_RE - 1));
		expect(status.kind).toBe('en espera');
	});

	it('at the due moment it becomes pending', () => {
		expect(recurringRelativeStatus(EVERY_4_HOURS, [completedAt(U)], afterU(4 * TIME_RE))).toEqual({
			kind: 'pendiente'
		});
	});

	it('one millisecond before missing a full cycle it is still pending', () => {
		const status = recurringRelativeStatus(EVERY_4_HOURS, [completedAt(U)], afterU(8 * TIME_RE - 1));
		expect(status).toEqual({ kind: 'pendiente' });
	});

	it('on missing a full cycle it becomes overdue', () => {
		expect(recurringRelativeStatus(EVERY_4_HOURS, [completedAt(U)], afterU(8 * TIME_RE))).toEqual({
			kind: 'atrasada'
		});
	});

	it('"every N days" is N × 24 hours', () => {
		expect(recurringRelativeStatus(EVERY_2_DAYS, [completedAt(U)], afterU(12 * TIME_RE))).toEqual({
			kind: 'en espera',
			progress: 0.25
		});
		expect(recurringRelativeStatus(EVERY_2_DAYS, [completedAt(U)], afterU(48 * TIME_RE)).kind).toBe('pendiente');
		expect(recurringRelativeStatus(EVERY_2_DAYS, [completedAt(U)], afterU(96 * TIME_RE)).kind).toBe('atrasada');
	});

	it('counts from the most recent completion, regardless of the order of the list', () => {
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

	it('a completion later than now (skewed clocks) leaves the progress at 0', () => {
		expect(recurringRelativeStatus(EVERY_4_HOURS, [completedAt(U)], afterU(-TIME_RE))).toEqual({
			kind: 'en espera',
			progress: 0
		});
	});
});
