import { describe, expect, it } from 'vitest';
import { franjaDeConexion, pantallaDeEntrada } from './conexion';

describe('franjaDeConexion', () => {
	it('muestra "Sin conexión" mientras no hay red', () => {
		expect(franjaDeConexion(false)).toBe('Sin conexión');
	});

	it('no muestra nada con red', () => {
		expect(franjaDeConexion(true)).toBeUndefined();
	});
});

describe('pantallaDeEntrada', () => {
	it('sin conexión pide conexión para entrar la primera vez y deshabilita el botón', () => {
		expect(pantallaDeEntrada(false)).toStrictEqual({
			mensaje: 'Necesitás conexión para entrar la primera vez',
			botonHabilitado: false
		});
	});

	it('con conexión no avisa nada y habilita el botón', () => {
		expect(pantallaDeEntrada(true)).toStrictEqual({ mensaje: undefined, botonHabilitado: true });
	});
});
