import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
	SCREEN_MINIMUM_IN_SECONDS,
	SCREEN_LIMIT_IN_SECONDS,
	loadingScreenLeaves,
	nextScreenLimit,
	rememberedOnStart,
	notoLimitMemory,
	fontsSummary,
	type FontStatus,
	type WaitStatus
} from './loading-screen';

const font = fc.constantFrom<FontStatus>('ready', 'saved', 'unsaved', 'failed');
const wait = fc.record<WaitStatus>({
	secondsSinceStart: fc.double({ min: 0, max: 30, noNaN: true }),
	auth: fc.constantFrom('waiting', 'signedIn', 'signedOut'),
	tasksResponded: fc.boolean(),
	completionsResponded: fc.boolean(),
	atkinson: font,
	noto: font,
	online: fc.boolean(),
	remembersNotoLimit: fc.boolean()
});

describe('loadingScreenLeaves', () => {
	it('never leaves without Auth or before the minimum', () => {
		fc.assert(
			fc.property(wait, (e) => {
				if (e.auth === 'waiting' || e.secondsSinceStart < SCREEN_MINIMUM_IN_SECONDS) {
					expect(loadingScreenLeaves(e)).toBe(false);
				}
			})
		);
	});

	it('with Auth answered, it always leaves on reaching the limit', () => {
		fc.assert(
			fc.property(wait, fc.double({ min: SCREEN_LIMIT_IN_SECONDS, max: 1000, noNaN: true }), (e, t) => {
				if (e.auth !== 'waiting') expect(loadingScreenLeaves({ ...e, secondsSinceStart: t })).toBe(true);
			})
		);
	});

	it('is monotonic in time: if it left, it keeps leaving later', () => {
		fc.assert(
			fc.property(wait, fc.double({ min: 0, max: 30, noNaN: true }), (e, extra) => {
				if (loadingScreenLeaves(e)) {
					expect(loadingScreenLeaves({ ...e, secondsSinceStart: e.secondsSinceStart + extra })).toBe(true);
				}
			})
		);
	});
});

describe('Noto memory', () => {
	it('with Noto ready nothing is remembered', () => {
		fc.assert(
			fc.property(wait, (e) => {
				expect(notoLimitMemory({ ...e, noto: 'ready' })).toBe(false);
			})
		);
	});

	it('a version that changes the font set erases what was remembered; without a change it is kept', () => {
		fc.assert(
			fc.property(fc.boolean(), (remembered) => {
				expect(rememberedOnStart(remembered, true)).toBe(false);
				expect(rememberedOnStart(remembered, false)).toBe(remembered);
			})
		);
	});
});

describe('nextScreenLimit', () => {
	it('is the first limit still to come', () => {
		fc.assert(
			fc.property(fc.double({ min: 0, max: 30, noNaN: true }), (s) => {
				const limit = nextScreenLimit(s);
				if (limit === undefined) expect(s).toBeGreaterThanOrEqual(SCREEN_LIMIT_IN_SECONDS);
				else {
					expect(limit).toBeGreaterThan(s);
					expect([SCREEN_MINIMUM_IN_SECONDS, SCREEN_LIMIT_IN_SECONDS]).toContain(limit);
				}
			})
		);
	});
});

describe('fontsSummary', () => {
	it('does not depend on the order and the worst status wins', () => {
		fc.assert(
			fc.property(fc.array(fc.constantFrom<FontStatus>('saved', 'unsaved', 'failed'), { minLength: 1 }), (statuses) => {
				const summary = fontsSummary(statuses);
				expect(fontsSummary([...statuses].reverse())).toBe(summary);
				if (statuses.includes('failed')) expect(summary).toBe('failed');
				else if (statuses.includes('unsaved')) expect(summary).toBe('unsaved');
				else expect(summary).toBe('saved');
			})
		);
	});
});
