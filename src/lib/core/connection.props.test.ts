import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { connectionStrip, entryScreen } from './connection';

describe('connection: properties', () => {
	it('the strip and the entry message appear exactly when there is no network', () => {
		fc.assert(
			fc.property(fc.boolean(), (online) => {
				const entry = entryScreen(online);
				expect(connectionStrip(online) === undefined).toBe(online);
				expect(entry.message === undefined).toBe(online);
				expect(entry.buttonEnabled).toBe(online);
			})
		);
	});
});
