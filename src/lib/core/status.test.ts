import { describe, expect, it } from 'vitest';
import { progressPercentage } from './status';

describe('progressPercentage', () => {
	it.each([
		[0, 0],
		[0.5, 50],
		[47 / 48, 98],
		[0.994, 99],
		[0.125, 13]
	])('progress %s → %s %%, rounded to an integer', (progress, percentage) => {
		expect(progressPercentage(progress)).toBe(percentage);
	});
});
