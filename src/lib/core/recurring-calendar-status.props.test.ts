import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { complete } from './completions';
import { startOfDay } from './days';
import type { PendingStatus } from './status';
import { recurringCalendarStatus } from './recurring-calendar-status';
import { isOccurrence } from './occurrences';
import { WEEKDAYS, type Completion, type CalendarRecurrence, type RecurringTask } from './task';

const HOUR_MS = 3_600_000;
const RANGE: Record<PendingStatus['kind'], number> = { 'en espera': 0, pendiente: 1, atrasada: 2 };
const recurrence: fc.Arbitrary<CalendarRecurrence> = fc.oneof(
	fc.subarray([...WEEKDAYS], { minLength: 1 }).map((d) => ({ mode: 'calendario' as const, weekdays: d })),
	fc
		.uniqueArray(fc.integer({ min: 1, max: 31 }), { minLength: 1, maxLength: 6 })
		.map((d) => ({ mode: 'calendario' as const, monthDays: d.sort((a, b) => a - b) }))
);
const createdAt = fc
	.tuple(fc.integer({ min: 0, max: 30_000 }), fc.integer({ min: 0, max: 23 }))
	.map(([day, hour]) => new Date(1990, 0, 1 + day, hour));

/** Una tarea con un historial armado con `completar` en momentos al azar (horas desde creadaEn). */
const withHistory = fc
	.tuple(recurrence, createdAt, fc.array(fc.integer({ min: -48, max: 3_000 }), { maxLength: 10 }))
	.map(([r, created, hours]) => {
		const t: RecurringTask = { id: 't', title: 'T', kind: 'periodica', recurrence: r, createdAt: created };
		const cs = hours.reduce<Completion[]>(
			(priorCount, h) => [...priorCount, complete(t, priorCount, `c${priorCount.length}`, new Date(created.getTime() + h * HOUR_MS))],
			[]
		);
		return { r, created, cs };
	});
/** Horas después de creadaEn: hasta ~5 meses. */
const hours = fc.integer({ min: 0, max: 3_600 });
const status = ({ r, created, cs }: { r: CalendarRecurrence; created: Date; cs: Completion[] }, h: number) =>
	recurringCalendarStatus(r, created, cs, new Date(created.getTime() + h * HOUR_MS));

describe('estadoPeriodicaCalendario (propiedades)', () => {
	it('con el tiempo el estado solo avanza: en espera → pendiente → atrasada', () => {
		fc.assert(
			fc.property(withHistory, hours, hours, (task, a, b) => {
				const [before, after] = [Math.min(a, b), Math.max(a, b)];
				expect(RANGE[status(task, before).kind]).toBeLessThanOrEqual(RANGE[status(task, after).kind]);
			})
		);
	});

	it('el progreso de en espera está en [0, 1)', () => {
		fc.assert(
			fc.property(withHistory, hours, (task, h) => {
				const e = status(task, h);
				if (e.kind !== 'en espera') return;
				expect(e.progress).toBeGreaterThanOrEqual(0);
				expect(e.progress).toBeLessThan(1);
			})
		);
	});

	it('solo está pendiente en un día de ocurrencia', () => {
		fc.assert(
			fc.property(withHistory, hours, (task, h) => {
				const now = new Date(task.created.getTime() + h * HOUR_MS);
				if (status(task, h).kind === 'pendiente') expect(isOccurrence(task.r, startOfDay(now))).toBe(true);
			})
		);
	});

	it('recién creada: pendiente si se crea en un día de ocurrencia; si no, en espera desde 0', () => {
		fc.assert(
			fc.property(recurrence, createdAt, (r, created) => {
				const expected = isOccurrence(r, startOfDay(created)) ? { kind: 'pendiente' } : { kind: 'en espera', progress: 0 };
				expect(recurringCalendarStatus(r, created, [], created)).toEqual(expected);
			})
		);
	});

	it('el orden de los completados no cambia el estado', () => {
		const withPermutation = withHistory.chain((task) =>
			fc.shuffledSubarray(task.cs, { minLength: task.cs.length }).map((another) => [task, { ...task, cs: another }] as const)
		);
		fc.assert(
			fc.property(withPermutation, hours, ([task, other], h) => {
				expect(status(other, h)).toEqual(status(task, h));
			})
		);
	});
});
