import { describe, expect, it } from 'vitest';
import { itemsToAttempt, retriesWith, attemptResult } from './cleanups';

describe('attemptResult', () => {
	it('cleans those that do not fail and leaves to clean only those that failed', () => {
		expect(attemptResult(['a1', 'a2', 'a3'], ['a2'])).toEqual({ cleaned: ['a1', 'a3'], pendings: ['a2'] });
	});
	it('without a connection (all fail) nothing is left clean', () => {
		expect(attemptResult(['a1', 'a2'], ['a1', 'a2'])).toEqual({ cleaned: [], pendings: ['a1', 'a2'] });
	});
	it('if nothing fails, everything is left clean', () => {
		expect(attemptResult(['a1', 'a2'], [])).toEqual({ cleaned: ['a1', 'a2'], pendings: [] });
	});
	it('ignores failures of ids that were not attempted', () => {
		expect(attemptResult(['a1'], ['z9'])).toEqual({ cleaned: ['a1'], pendings: [] });
	});
});

describe('itemsToAttempt', () => {
	it('attempts what was detected that has no attempt in progress', () => {
		expect(itemsToAttempt(['a1', 'a2', 'a3'], new Set(['a2']))).toEqual(['a1', 'a3']);
	});
	it('an item whose attempt ended (failed) is attempted again', () => {
		expect(itemsToAttempt(['a1', 'a2'], new Set())).toEqual(['a1', 'a2']);
	});
});

describe('retriesWith', () => {
	it('retries when the connection returns', () => {
		expect(retriesWith('vuelve la conexión')).toBe(true);
	});
	it('retries when the data changes', () => {
		expect(retriesWith('cambian los datos')).toBe(true);
	});
	it('does not retry because time passes', () => {
		expect(retriesWith('pasa el tiempo')).toBe(false);
	});
});
