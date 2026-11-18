import { describe, expect, it } from 'vitest';
import {
	SCREEN_MINIMUM_IN_SECONDS,
	SCREEN_LIMIT_IN_SECONDS,
	loadingScreenLeaves,
	rememberedOnStart,
	notoLimitMemory,
	nextScreenLimit,
	fontsSummary,
	type WaitStatus
} from './loading-screen';

/** With a session, online and with everything ready, at 2 s: it leaves; each test changes what it tests. */
function wait(changes: Partial<WaitStatus> = {}): WaitStatus {
	return {
		secondsSinceStart: 2,
		auth: 'signedIn',
		tasksResponded: true,
		completionsResponded: true,
		atkinson: 'ready',
		noto: 'ready',
		online: true,
		remembersNotoLimit: false,
		...changes
	};
}

describe('screen limits', () => {
	it('the minimum is 0.5 s and the limit is 10 s', () => {
		expect(SCREEN_MINIMUM_IN_SECONDS).toBe(0.5);
		expect(SCREEN_LIMIT_IN_SECONDS).toBe(10);
	});
});

describe('loadingScreenLeaves: with a session', () => {
	it('leaves when everything it waits for is ready', () => {
		expect(loadingScreenLeaves(wait())).toBe(true);
	});

	it.each([
		['the tasks', { tasksResponded: false }],
		['the completions', { completionsResponded: false }],
		['Atkinson', { atkinson: 'unsaved' }],
		['Noto', { noto: 'unsaved' }]
	] as const)('waits for %s', (_name, changes) => {
		expect(loadingScreenLeaves(wait(changes))).toBe(false);
	});
});

describe('loadingScreenLeaves: minimum of 0.5 s', () => {
	it('with everything ready it does not leave before the minimum', () => {
		expect(loadingScreenLeaves(wait({ secondsSinceStart: 0.4 }))).toBe(false);
	});

	it('leaves right on reaching the minimum', () => {
		expect(loadingScreenLeaves(wait({ secondsSinceStart: 0.5 }))).toBe(true);
	});

	it('it also holds without a session, offline and with the fonts failed', () => {
		const status = wait({
			secondsSinceStart: 0.4,
			auth: 'signedOut',
			online: false,
			atkinson: 'failed',
			noto: 'failed'
		});
		expect(loadingScreenLeaves(status)).toBe(false);
	});
});

describe('loadingScreenLeaves: limit of 10 s', () => {
	const nothingReady = {
		tasksResponded: false,
		completionsResponded: false,
		atkinson: 'unsaved',
		noto: 'unsaved'
	} as const;

	it('before the limit it keeps waiting', () => {
		expect(loadingScreenLeaves(wait({ ...nothingReady, secondsSinceStart: 9.9 }))).toBe(false);
	});

	it('on reaching the limit it enters with what there is', () => {
		expect(loadingScreenLeaves(wait({ ...nothingReady, secondsSinceStart: 10 }))).toBe(true);
	});

	it('the wait for Auth does not count toward the limit', () => {
		expect(loadingScreenLeaves(wait({ auth: 'waiting', secondsSinceStart: 60 }))).toBe(
			false
		);
	});

	it('if Auth answers after the limit, it leaves at that moment even if the rest is missing', () => {
		expect(loadingScreenLeaves(wait({ ...nothingReady, secondsSinceStart: 12 }))).toBe(true);
	});
});

describe('loadingScreenLeaves: without a session', () => {
	const withoutSession = {
		auth: 'signedOut',
		tasksResponded: false,
		completionsResponded: false
	} as const;

	it('does not wait for data or for Noto', () => {
		expect(loadingScreenLeaves(wait({ ...withoutSession, noto: 'unsaved' }))).toBe(true);
	});

	it('waits for Atkinson', () => {
		expect(loadingScreenLeaves(wait({ ...withoutSession, atkinson: 'unsaved' }))).toBe(false);
	});
});

describe('loadingScreenLeaves: does not wait for what will not arrive', () => {
	it.each([
		['Atkinson', { atkinson: 'failed' }],
		['Noto', { noto: 'failed' }]
	] as const)('%s failed stops being waited for when online', (_name, changes) => {
		expect(loadingScreenLeaves(wait(changes))).toBe(true);
	});

	it('a failed font does not release the rest still pending', () => {
		expect(loadingScreenLeaves(wait({ noto: 'failed', atkinson: 'unsaved' }))).toBe(false);
		expect(loadingScreenLeaves(wait({ noto: 'failed', tasksResponded: false }))).toBe(false);
	});

	it.each([
		['Atkinson', { atkinson: 'unsaved' }],
		['Noto', { noto: 'unsaved' }]
	] as const)('offline it does not wait for %s not stored', (_name, changes) => {
		expect(loadingScreenLeaves(wait({ ...changes, online: false }))).toBe(true);
	});

	it.each([
		['Atkinson', { atkinson: 'saved' }],
		['Noto', { noto: 'saved' }]
	] as const)('offline it keeps waiting for %s stored', (_name, changes) => {
		const status = wait({ ...changes, online: false });
		expect(loadingScreenLeaves(status)).toBe(false);
	});

	it('offline it keeps waiting for the local cache of the data', () => {
		expect(loadingScreenLeaves(wait({ online: false, completionsResponded: false }))).toBe(
			false
		);
	});
});

describe('loadingScreenLeaves: after a limit reached with Noto not downloaded', () => {
	it('with a session it does not wait for Noto', () => {
		expect(loadingScreenLeaves(wait({ remembersNotoLimit: true, noto: 'unsaved' }))).toBe(
			true
		);
	});

	it('the rest is still waited for', () => {
		const status = wait({ remembersNotoLimit: true, noto: 'unsaved', atkinson: 'saved' });
		expect(loadingScreenLeaves(status)).toBe(false);
	});
});

describe('notoLimitMemory', () => {
	const atLimit = { secondsSinceStart: 10, noto: 'unsaved' } as const;

	it('a limit reached with Noto not downloaded in an opening that waited for it is remembered', () => {
		expect(notoLimitMemory(wait(atLimit))).toBe(true);
	});

	it('also when Noto was being read from the device', () => {
		expect(notoLimitMemory(wait({ ...atLimit, noto: 'saved' }))).toBe(true);
	});

	it('if the screen left before the limit there is nothing to remember', () => {
		expect(notoLimitMemory(wait({ ...atLimit, secondsSinceStart: 9.9 }))).toBe(false);
	});

	it('a late Auth also counts as limit reached', () => {
		expect(notoLimitMemory(wait({ ...atLimit, secondsSinceStart: 12 }))).toBe(true);
	});

	it('without a session it does not count: it did not wait for it', () => {
		expect(notoLimitMemory(wait({ ...atLimit, auth: 'signedOut' }))).toBe(false);
	});

	it('Noto failed before the limit does not count: it was no longer waited for', () => {
		expect(notoLimitMemory(wait({ ...atLimit, noto: 'failed' }))).toBe(false);
	});

	it('Noto not stored and offline does not count: it was no longer waited for', () => {
		expect(notoLimitMemory(wait({ ...atLimit, online: false }))).toBe(false);
	});

	it('Noto stored and offline counts: it was still waited for', () => {
		expect(notoLimitMemory(wait({ ...atLimit, online: false, noto: 'saved' }))).toBe(true);
	});

	it('with Noto ready at the limit it is not remembered', () => {
		expect(notoLimitMemory(wait({ secondsSinceStart: 10 }))).toBe(false);
	});

	it.each([
		['without a session', { auth: 'signedOut' }],
		['with Noto failed', { noto: 'failed' }],
		['offline', { online: false }],
		['before the limit', { secondsSinceStart: 1 }]
	] as const)('what was already remembered is kept %s', (_name, changes) => {
		const status = wait({ noto: 'unsaved', remembersNotoLimit: true, ...changes });
		expect(notoLimitMemory(status)).toBe(true);
	});

	it('it is forgotten when Noto is stored', () => {
		expect(notoLimitMemory(wait({ remembersNotoLimit: true, noto: 'ready' }))).toBe(false);
	});

	it('it is forgotten even if the opening has no session', () => {
		const status = wait({ remembersNotoLimit: true, noto: 'ready', auth: 'signedOut' });
		expect(notoLimitMemory(status)).toBe(false);
	});
});

describe('rememberedOnStart', () => {
	it('without a version that changes the font set, what was remembered stays', () => {
		expect(rememberedOnStart(true, false)).toBe(true);
	});

	it('a version that changes the font set makes it wait for it once more', () => {
		expect(rememberedOnStart(true, true)).toBe(false);
	});

	it('with nothing remembered, nothing to remember appears', () => {
		expect(rememberedOnStart(false, false)).toBe(false);
		expect(rememberedOnStart(false, true)).toBe(false);
	});
});

describe('next limit', () => {
	it('is the minimum, then the limit, and then there is none', () => {
		expect(nextScreenLimit(0)).toBe(0.5);
		expect(nextScreenLimit(0.5)).toBe(10);
		expect(nextScreenLimit(10)).toBeUndefined();
	});
});

describe('fonts summary', () => {
	it('the worst rules: failed, then not stored, then stored', () => {
		expect(fontsSummary(['saved', 'unsaved', 'failed'])).toBe('failed');
		expect(fontsSummary(['saved', 'unsaved'])).toBe('unsaved');
		expect(fontsSummary(['saved'])).toBe('saved');
	});
});
