// Spec §7 (Cleanups and retries): properties of the cleanup rules.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { itemsToAttempt, retriesWith, attemptResult, type AppEvent } from './cleanups';

const ids = fc.uniqueArray(fc.constantFrom<string[]>('a1', 'a2', 'a3', 'a4', 'a5', 'a6'), { maxLength: 6 });
const failures = fc.array(fc.constantFrom<string[]>('a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'z9'), { maxLength: 8 });
const appEvents = fc.constantFrom<AppEvent>('vuelve la conexión', 'cambian los datos', 'pasa el tiempo');

describe('attemptResult (properties)', () => {
	it('cleaned and pending partition what was attempted, keeping the order', () => {
		fc.assert(
			fc.property(ids, failures, (attempted, failed) => {
				const { cleaned, pendings } = attemptResult(attempted, failed);
				expect([...cleaned, ...pendings].sort()).toEqual([...attempted].sort());
				expect(cleaned.filter((id) => pendings.includes(id))).toEqual([]);
				expect(attempted.filter((id) => cleaned.includes(id))).toEqual(cleaned);
				expect(attempted.filter((id) => pendings.includes(id))).toEqual(pendings);
			})
		);
	});
	it('exactly the attempted ones that failed are left to clean', () => {
		fc.assert(
			fc.property(ids, failures, (attempted, failed) => {
				expect(attemptResult(attempted, failed).pendings).toEqual(attempted.filter((id) => failed.includes(id)));
			})
		);
	});
	it('without a connection (all fail) none is cleaned, and if nothing fails all are cleaned', () => {
		fc.assert(
			fc.property(ids, (attempted) => {
				expect(attemptResult(attempted, attempted).cleaned).toEqual([]);
				expect(attemptResult(attempted, []).pendings).toEqual([]);
			})
		);
	});
});

describe('itemsToAttempt (properties)', () => {
	it('is what was detected without an attempt in progress, in the same order', () => {
		fc.assert(
			fc.property(ids, ids, (toClean, inProgress) => {
				const a = itemsToAttempt(toClean, new Set<string>(inProgress));
				expect(a).toEqual(toClean.filter((id) => !inProgress.includes(id)));
			})
		);
	});
	it('never returns an item in progress and, with nothing in progress, returns everything', () => {
		fc.assert(
			fc.property(ids, ids, (toClean, inProgress) => {
				expect(itemsToAttempt(toClean, new Set<string>(inProgress)).some((id) => inProgress.includes(id))).toBe(false);
				expect(itemsToAttempt(toClean, new Set<string>())).toEqual(toClean);
			})
		);
	});
	it('is idempotent: what was already sent to be attempted is not sent again', () => {
		fc.assert(
			fc.property(ids, ids, (toClean, inProgress) => {
				const firstOne = itemsToAttempt(toClean, new Set<string>(inProgress));
				expect(itemsToAttempt(toClean, new Set<string>([...inProgress, ...firstOne]))).toEqual([]);
			})
		);
	});
});

describe('retriesWith (properties)', () => {
	it('retries on every event except the passing of time', () => {
		fc.assert(
			fc.property(appEvents, (occurrenceEvent) => {
				expect(retriesWith(occurrenceEvent)).toBe(occurrenceEvent !== 'pasa el tiempo');
			})
		);
	});
});
