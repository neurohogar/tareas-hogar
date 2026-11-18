import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { progressPercentage } from './status';

const progress = fc.double({ min: 0, max: 1, noNaN: true });

describe('progressPercentage (properties)', () => {
	it('gives an integer between 0 and 100 within half a point of the progress', () => {
		fc.assert(
			fc.property(progress, (p) => {
				const percentage = progressPercentage(p);
				expect(Number.isInteger(percentage)).toBe(true);
				expect(percentage).toBeGreaterThanOrEqual(0);
				expect(percentage).toBeLessThanOrEqual(100);
				expect(Math.abs(percentage - p * 100)).toBeLessThanOrEqual(0.5);
			})
		);
	});

	it('is monotonic', () => {
		fc.assert(
			fc.property(progress, progress, (a, b) => {
				expect(progressPercentage(Math.min(a, b))).toBeLessThanOrEqual(progressPercentage(Math.max(a, b)));
			})
		);
	});
});
