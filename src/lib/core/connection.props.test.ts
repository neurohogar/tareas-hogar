import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { connectionStrip, entryScreen } from './connection';

describe('conexión: propiedades', () => {
	it('la franja y el mensaje de entrada aparecen exactamente cuando no hay red', () => {
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
