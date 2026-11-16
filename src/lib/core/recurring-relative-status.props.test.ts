import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { PendingStatus } from './status';
import { recurringRelativeStatus } from './recurring-relative-status';
import type { Completion, RelativeRecurrence } from './task';

const MS_PER_HOUR = 3_600_000;
/** Momentos entre 1970 y ~2096, en ms: cualquier diferencia entre dos es exacta. */
const instant = fc.integer({ min: 0, max: 4_000_000_000_000 });
const recurrence = fc.record({
	mode: fc.constant('relativo' as const),
	every: fc.integer({ min: 1, max: 10_000 }),
	unit: fc.constantFrom('horas' as const, 'dias' as const)
});
const completions = fc
	.array(instant, { minLength: 1, maxLength: 8 })
	.map((moments) => moments.map((ms, i): Completion => ({ id: `c${i}`, taskId: 't', completedAt: new Date(ms) })));
const withPermutation = completions.chain((cs) =>
	fc.shuffledSubarray(cs, { minLength: cs.length, maxLength: cs.length }).map((permutedOnes) => [cs, permutedOnes] as const)
);

const RANGE: Record<PendingStatus['kind'], number> = { 'en espera': 0, pendiente: 1, atrasada: 2 };
const status = (r: RelativeRecurrence, cs: readonly Completion[], ms: number) =>
	recurringRelativeStatus(r, cs, new Date(ms));
const intervalInMs = (r: RelativeRecurrence) => r.every * (r.unit === 'dias' ? 24 : 1) * MS_PER_HOUR;
const last = (cs: readonly Completion[]) => Math.max(...cs.map((c) => c.completedAt.getTime()));

describe('estadoPeriodicaRelativa (propiedades)', () => {
	it('nunca completada: pendiente en cualquier momento', () => {
		fc.assert(
			fc.property(recurrence, instant, (r, now) => {
				expect(status(r, [], now)).toEqual({ kind: 'pendiente' });
			})
		);
	});

	it('el progreso de en espera está en [0, 1)', () => {
		fc.assert(
			fc.property(recurrence, completions, instant, (r, cs, now) => {
				const e = status(r, cs, now);
				if (e.kind !== 'en espera') return;
				expect(e.progress).toBeGreaterThanOrEqual(0);
				expect(e.progress).toBeLessThan(1);
			})
		);
	});

	it('no depende del orden de los completados', () => {
		fc.assert(
			fc.property(recurrence, withPermutation, instant, (r, [cs, permutedOnes], now) => {
				expect(status(r, permutedOnes, now)).toEqual(status(r, cs, now));
			})
		);
	});

	it('solo cuenta el completado más reciente: agregar uno anterior no cambia nada', () => {
		fc.assert(
			fc.property(recurrence, completions, instant, fc.integer({ min: 0, max: 1e12 }), (r, cs, now, before) => {
				const oldOne: Completion = { id: 'viejo', taskId: 't', completedAt: new Date(last(cs) - before) };
				expect(status(r, [...cs, oldOne], now)).toEqual(status(r, cs, now));
			})
		);
	});

	it('avanza en un solo sentido: en espera → pendiente → atrasada, con progreso creciente', () => {
		fc.assert(
			fc.property(recurrence, completions, instant, instant, (r, cs, a, b) => {
				const [before, after] = [status(r, cs, Math.min(a, b)), status(r, cs, Math.max(a, b))];
				expect(RANGE[before.kind]).toBeLessThanOrEqual(RANGE[after.kind]);
				if (before.kind === 'en espera' && after.kind === 'en espera')
					expect(before.progress).toBeLessThanOrEqual(after.progress);
			})
		);
	});

	it('cambia de estado exactamente en V = U + intervalo y en V + intervalo', () => {
		fc.assert(
			fc.property(recurrence, completions, (r, cs) => {
				const expiry = last(cs) + intervalInMs(r);
				expect(status(r, cs, expiry - 1).kind).toBe('en espera');
				expect(status(r, cs, expiry).kind).toBe('pendiente');
				expect(status(r, cs, expiry + intervalInMs(r) - 1).kind).toBe('pendiente');
				expect(status(r, cs, expiry + intervalInMs(r)).kind).toBe('atrasada');
			})
		);
	});

	it('completar reinicia: justo al completar queda en espera con progreso 0, desde cualquier estado', () => {
		fc.assert(
			fc.property(recurrence, completions, fc.integer({ min: 0, max: 1e12 }), (r, cs, after) => {
				const now = last(cs) + after;
				const newValue: Completion = { id: 'nuevo', taskId: 't', completedAt: new Date(now) };
				expect(status(r, [...cs, newValue], now)).toEqual({ kind: 'en espera', progress: 0 });
			})
		);
	});

	it('"cada N días" equivale a "cada N × 24 horas"', () => {
		fc.assert(
			fc.property(fc.integer({ min: 1, max: 1_000 }), completions, instant, (n, cs, now) => {
				const days: RelativeRecurrence = { mode: 'relativo', every: n, unit: 'dias' };
				const hours: RelativeRecurrence = { mode: 'relativo', every: 24 * n, unit: 'horas' };
				expect(status(days, cs, now)).toEqual(status(hours, cs, now));
			})
		);
	});

	it('solo importa el tiempo transcurrido: desplazar todos los momentos no cambia el estado', () => {
		fc.assert(
			fc.property(recurrence, completions, instant, fc.integer({ min: -1e12, max: 1e12 }), (r, cs, now, delta) => {
				const shifted = cs.map((c) => ({ ...c, completedAt: new Date(c.completedAt.getTime() + delta) }));
				expect(status(r, shifted, now + delta)).toEqual(status(r, cs, now));
			})
		);
	});
});
