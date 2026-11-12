import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { franjaDeConexion, pantallaDeEntrada } from './conexion';

describe('conexión: propiedades', () => {
	it('la franja y el mensaje de entrada aparecen exactamente cuando no hay red', () => {
		fc.assert(
			fc.property(fc.boolean(), (enLinea) => {
				const entrada = pantallaDeEntrada(enLinea);
				expect(franjaDeConexion(enLinea) === undefined).toBe(enLinea);
				expect(entrada.mensaje === undefined).toBe(enLinea);
				expect(entrada.botonHabilitado).toBe(enLinea);
			})
		);
	});
});
