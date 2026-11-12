import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { crearPeriodicaRelativa } from './crear-periodica-relativa';

const AHORA = new Date(2026, 6, 15, 8, 0, 0);
const unidad = fc.constantFrom('horas' as const, 'dias' as const);
const espacios = fc.stringMatching(/^[ \t\n]*$/);
const tituloConTexto = fc.string({ minLength: 1 }).filter((t) => t.trim() !== '');
const cadaValido = fc.integer({ min: 1, max: 1_000_000 });
const cualquierCada = fc.oneof(fc.double(), fc.integer({ min: -1_000, max: 1_000 }));

describe('crearPeriodicaRelativa (propiedades)', () => {
	it('acepta exactamente los datos con título con texto y cada entero ≥ 1', () => {
		fc.assert(
			fc.property(fc.string(), cualquierCada, unidad, (titulo, cada, u) => {
				const valido = titulo.trim() !== '' && Number.isInteger(cada) && cada >= 1;
				expect(crearPeriodicaRelativa({ titulo, cada, unidad: u }, 'id', AHORA).ok).toBe(valido);
			})
		);
	});

	it('cada error corresponde a un campo inválido y viceversa', () => {
		fc.assert(
			fc.property(fc.string(), cualquierCada, unidad, (titulo, cada, u) => {
				const resultado = crearPeriodicaRelativa({ titulo, cada, unidad: u }, 'id', AHORA);
				if (resultado.ok) return;
				expect(resultado.errores.titulo === 'vacio').toBe(titulo.trim() === '');
				expect(resultado.errores.cada === 'invalido').toBe(!(Number.isInteger(cada) && cada >= 1));
			})
		);
	});

	it('guarda el título recortado, la recurrencia pedida, el id y el momento de creación', () => {
		fc.assert(
			fc.property(espacios, tituloConTexto, espacios, cadaValido, unidad, fc.uuid(), (antes, titulo, despues, cada, u, id) => {
				const resultado = crearPeriodicaRelativa({ titulo: antes + titulo + despues, cada, unidad: u }, id, AHORA);
				expect(resultado).toEqual({
					ok: true,
					tarea: {
						id,
						titulo: titulo.trim(),
						tipo: 'periodica',
						recurrencia: { modo: 'relativo', cada, unidad: u },
						creadaEn: AHORA
					}
				});
			})
		);
	});

	it('es idempotente: recrear con los datos de una tarea creada da la misma tarea', () => {
		fc.assert(
			fc.property(tituloConTexto, cadaValido, unidad, (titulo, cada, u) => {
				const primera = crearPeriodicaRelativa({ titulo, cada, unidad: u }, 'id', AHORA);
				if (!primera.ok) throw new Error('debía crearse');
				const { titulo: guardado, recurrencia } = primera.tarea;
				if (recurrencia.modo !== 'relativo') throw new Error('debía ser relativa');
				const segunda = crearPeriodicaRelativa({ titulo: guardado, cada: recurrencia.cada, unidad: recurrencia.unidad }, 'id', AHORA);
				expect(segunda).toEqual(primera);
			})
		);
	});
});
