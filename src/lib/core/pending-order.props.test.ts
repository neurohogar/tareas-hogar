import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { PendingStatus } from './status';
import { compareCompleted, compareByUrgency, type CompletedRow, type RowToOrder } from './pending-order';

/** Few values per field, so the tie-breakers are exercised. */
const moment = fc.option(fc.integer({ min: 0, max: 3 }).map((n) => new Date(n * 86_400_000)), { nil: undefined });
const status = fc.constantFrom<PendingStatus>({ kind: 'atrasada' }, { kind: 'pendiente' }, { kind: 'en espera', progress: 0.5 });
const row = fc
	.record({
		id: fc.constantFrom('a', 'b', 'c', 'A', 'á'),
		title: fc.constantFrom('Barrer', 'barrer', 'Ñandú', 'Nube', 'Árbol'),
		createdAt: fc.integer({ min: 0, max: 2 }).map((n) => new Date(n)),
		status,
		instant: moment
	})
	.map(({ id, title, createdAt, status, instant }): RowToOrder => ({ task: { id, title, createdAt, kind: 'puntual' }, status, instant }));
const sign = (a: RowToOrder, b: RowToOrder) => Math.sign(compareByUrgency(a, b));

describe('compareByUrgency (properties)', () => {
	it('is a total order: antisymmetric, transitive and only ties a task with itself', () => {
		fc.assert(
			fc.property(row, row, row, (a, b, c) => {
				expect(compareByUrgency(a, a)).toBe(0);
				expect(sign(a, b)).toBe(-sign(b, a) || 0);
				if (sign(a, b) <= 0 && sign(b, c) <= 0) expect(sign(a, c)).toBeLessThanOrEqual(0);
				if (sign(a, b) === 0) expect(a.task.id).toBe(b.task.id);
			})
		);
	});

	it('the group rules: overdue before pending before waiting', () => {
		const range = { atrasada: 0, pendiente: 1, 'en espera': 2 };
		fc.assert(
			fc.property(row, row, (a, b) => {
				fc.pre(a.status.kind !== b.status.kind);
				expect(sign(a, b)).toBe(Math.sign(range[a.status.kind] - range[b.status.kind]));
			})
		);
	});

	it('within the group, the oldest instant first and without an instant last', () => {
		fc.assert(
			fc.property(row, row, (a, b) => {
				fc.pre(a.status.kind === b.status.kind && a.instant?.getTime() !== b.instant?.getTime());
				const key = (f: RowToOrder) => f.instant?.getTime() ?? Infinity;
				expect(sign(a, b)).toBe(Math.sign(key(a) - key(b)));
			})
		);
	});
});

const completed = fc
	.record({
		id: fc.constantFrom('a', 'b', 'c', 'A', 'á'),
		title: fc.constantFrom('Barrer', 'barrer', 'Ñandú', 'Nube', 'Árbol'),
		createdAt: fc.integer({ min: 0, max: 2 }).map((n) => new Date(n)),
		lastCompletedAt: fc.integer({ min: 0, max: 3 })
	})
	.map(({ id, title, createdAt, lastCompletedAt }): CompletedRow => ({
		task: { id, title, createdAt, kind: 'puntual' },
		status: { kind: 'completada' },
		lastCompletedAt
	}));
const signCompleted = (a: CompletedRow, b: CompletedRow) => Math.sign(compareCompleted(a, b));

describe('compareCompleted (properties)', () => {
	it('is a total order: antisymmetric, transitive and only ties a task with itself', () => {
		fc.assert(
			fc.property(completed, completed, completed, (a, b, c) => {
				expect(compareCompleted(a, a)).toBe(0);
				expect(signCompleted(a, b)).toBe(-signCompleted(b, a) || 0);
				if (signCompleted(a, b) <= 0 && signCompleted(b, c) <= 0) expect(signCompleted(a, c)).toBeLessThanOrEqual(0);
				if (signCompleted(a, b) === 0) expect(a.task.id).toBe(b.task.id);
			})
		);
	});

	it('the most recent completion first', () => {
		fc.assert(
			fc.property(completed, completed, (a, b) => {
				fc.pre(a.lastCompletedAt !== b.lastCompletedAt);
				expect(signCompleted(a, b)).toBe(Math.sign(b.lastCompletedAt - a.lastCompletedAt));
			})
		);
	});

	it('if they tie, it breaks the tie like compareByUrgency', () => {
		const asUrgent = (f: CompletedRow): RowToOrder => ({ task: f.task, status: { kind: 'pendiente' }, instant: undefined });
		fc.assert(
			fc.property(completed, completed, (a, b) => {
				fc.pre(a.lastCompletedAt === b.lastCompletedAt);
				expect(signCompleted(a, b)).toBe(Math.sign(compareByUrgency(asUrgent(a), asUrgent(b))));
			})
		);
	});
});
