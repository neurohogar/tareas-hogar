import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
	LAST_RETRY_IN_MS,
	FIRST_RETRY_IN_MS,
	keyInCache,
	replacedKeys,
	nextWait
} from './bundled-fonts';

const name = fc.stringMatching(/^[a-z0-9-]{1,12}$/).map((n) => `${n}.woff2`);
const fingerprint = fc.stringMatching(/^[a-f0-9]{1,8}$/);

describe('retries', () => {
	it('the wait never decreases, never exceeds the maximum and reaches it', () => {
		fc.assert(
			fc.property(fc.integer({ min: FIRST_RETRY_IN_MS, max: LAST_RETRY_IN_MS }), (wait) => {
				const following = nextWait(wait);
				expect(following).toBeGreaterThanOrEqual(wait);
				expect(following).toBeLessThanOrEqual(LAST_RETRY_IN_MS);
			})
		);
		let wait = FIRST_RETRY_IN_MS;
		for (let i = 0; i < 10; i++) wait = nextWait(wait);
		expect(wait).toBe(LAST_RETRY_IN_MS);
	});
});

describe('replaced entries', () => {
	it('never include the current key and are all of the same file', () => {
		fc.assert(
			fc.property(name, name, fc.array(fingerprint, { maxLength: 6 }), fingerprint, (a, another, olds, active) => {
				const urls = [...olds.map((h) => `https://x.test${keyInCache(a, h)}`), `https://x.test${keyInCache(another, 'z')}`];
				const replaced = replacedKeys(urls, a, keyInCache(a, active));
				for (const url of replaced) {
					expect(url.includes(`/fuentes/${a}?`)).toBe(true);
					expect(url.endsWith(keyInCache(a, active))).toBe(false);
				}
			})
		);
	});

	it('is idempotent: what is left after deleting them replaces nothing else', () => {
		fc.assert(
			fc.property(name, fc.array(fingerprint, { maxLength: 6 }), fingerprint, (a, olds, active) => {
				const key = keyInCache(a, active);
				const urls = [...olds.map((h) => keyInCache(a, h)), key];
				const deletedItems = replacedKeys(urls, a, key);
				const remain = urls.filter((u) => !deletedItems.includes(u));
				expect(replacedKeys(remain, a, key)).toEqual([]);
			})
		);
	});
});
