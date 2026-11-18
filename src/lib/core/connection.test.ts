import { describe, expect, it } from 'vitest';
import { connectionStrip, entryScreen } from './connection';

describe('connectionStrip', () => {
	it('shows "Sin conexión" while there is no network', () => {
		expect(connectionStrip(false)).toBe('Sin conexión');
	});

	it('shows nothing with a network', () => {
		expect(connectionStrip(true)).toBeUndefined();
	});
});

describe('entryScreen', () => {
	it('without a connection asks for a connection to sign in the first time and disables the button', () => {
		expect(entryScreen(false)).toStrictEqual({
			message: 'Necesitás conexión para entrar la primera vez',
			buttonEnabled: false
		});
	});

	it('with a connection warns of nothing and enables the button', () => {
		expect(entryScreen(true)).toStrictEqual({ message: undefined, buttonEnabled: true });
	});
});
