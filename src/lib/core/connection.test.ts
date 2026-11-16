import { describe, expect, it } from 'vitest';
import { connectionStrip, entryScreen } from './connection';

describe('franjaDeConexion', () => {
	it('muestra "Sin conexión" mientras no hay red', () => {
		expect(connectionStrip(false)).toBe('Sin conexión');
	});

	it('no muestra nada con red', () => {
		expect(connectionStrip(true)).toBeUndefined();
	});
});

describe('pantallaDeEntrada', () => {
	it('sin conexión pide conexión para entrar la primera vez y deshabilita el botón', () => {
		expect(entryScreen(false)).toStrictEqual({
			message: 'Necesitás conexión para entrar la primera vez',
			buttonEnabled: false
		});
	});

	it('con conexión no avisa nada y habilita el botón', () => {
		expect(entryScreen(true)).toStrictEqual({ message: undefined, buttonEnabled: true });
	});
});
