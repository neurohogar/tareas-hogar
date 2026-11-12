import { describe, expect, it } from 'vitest';
import { crearPeriodicaRelativa } from './crear-periodica-relativa';

const AHORA = new Date(2026, 6, 15, 8, 0, 0);

describe('crearPeriodicaRelativa', () => {
	it('crea una tarea periódica relativa con id, creadaEn y la recurrencia pedida', () => {
		const resultado = crearPeriodicaRelativa({ titulo: 'Regar plantas', cada: 3, unidad: 'dias' }, 't1', AHORA);

		expect(resultado).toEqual({
			ok: true,
			tarea: {
				id: 't1',
				titulo: 'Regar plantas',
				tipo: 'periodica',
				recurrencia: { modo: 'relativo', cada: 3, unidad: 'dias' },
				creadaEn: AHORA
			}
		});
	});

	it('guarda el título sin los espacios de los extremos', () => {
		const resultado = crearPeriodicaRelativa({ titulo: '  Ventilar ', cada: 4, unidad: 'horas' }, 't1', AHORA);

		expect(resultado.ok && resultado.tarea.titulo).toBe('Ventilar');
	});

	it.each(['', '   ', '\t\n'])('rechaza el título vacío o de solo espacios (%j)', (titulo) => {
		expect(crearPeriodicaRelativa({ titulo, cada: 1, unidad: 'horas' }, 't1', AHORA)).toEqual({
			ok: false,
			errores: { titulo: 'vacio' }
		});
	});

	it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rechaza un cada que no es entero ≥ 1 (%s)', (cada) => {
		expect(crearPeriodicaRelativa({ titulo: 'Ventilar', cada, unidad: 'horas' }, 't1', AHORA)).toEqual({
			ok: false,
			errores: { cada: 'invalido' }
		});
	});

	it('acepta el mínimo cada = 1', () => {
		expect(crearPeriodicaRelativa({ titulo: 'Ventilar', cada: 1, unidad: 'horas' }, 't1', AHORA).ok).toBe(true);
	});

	it('informa los dos errores juntos', () => {
		expect(crearPeriodicaRelativa({ titulo: ' ', cada: 0, unidad: 'dias' }, 't1', AHORA)).toEqual({
			ok: false,
			errores: { titulo: 'vacio', cada: 'invalido' }
		});
	});
});
