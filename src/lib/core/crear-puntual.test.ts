import { describe, expect, it } from 'vitest';
import { crearPuntual } from './crear-puntual';

const AHORA = new Date(2026, 6, 15, 8, 0, 0);

describe('crearPuntual', () => {
	it('crea una tarea puntual con id, creadaEn y la fecha límite como el inicio de ese día local', () => {
		expect(crearPuntual({ titulo: 'Pagar la luz', fechaLimite: '2026-07-20' }, 't1', AHORA)).toStrictEqual({
			ok: true,
			tarea: { id: 't1', titulo: 'Pagar la luz', tipo: 'puntual', fechaLimite: new Date(2026, 6, 20), creadaEn: AHORA }
		});
	});

	it('sin fecha límite, la tarea no tiene el campo', () => {
		expect(crearPuntual({ titulo: 'Cambiar foco' }, 't1', AHORA)).toStrictEqual({
			ok: true,
			tarea: { id: 't1', titulo: 'Cambiar foco', tipo: 'puntual', creadaEn: AHORA }
		});
	});

	it('acepta una fecha límite anterior al día de creación', () => {
		const resultado = crearPuntual({ titulo: 'Renovar DNI', fechaLimite: '2026-07-10' }, 't1', AHORA);

		expect(resultado.ok && resultado.tarea).toMatchObject({ fechaLimite: new Date(2026, 6, 10) });
	});

	it('guarda el título sin los espacios de los extremos', () => {
		const resultado = crearPuntual({ titulo: '  Pagar la luz ' }, 't1', AHORA);

		expect(resultado.ok && resultado.tarea.titulo).toBe('Pagar la luz');
	});

	it.each(['', '   '])('rechaza el título vacío o de solo espacios (%j)', (titulo) => {
		expect(crearPuntual({ titulo }, 't1', AHORA)).toEqual({ ok: false, errores: { titulo: 'vacio' } });
	});

	it.each(['2026-02-29', '2026-04-31', '2026-13-01', ''])('rechaza una fecha límite que no existe (%j)', (fechaLimite) => {
		expect(crearPuntual({ titulo: 'Pagar la luz', fechaLimite }, 't1', AHORA)).toEqual({
			ok: false,
			errores: { fechaLimite: 'invalida' }
		});
	});

	it('junta los dos motivos de rechazo', () => {
		expect(crearPuntual({ titulo: ' ', fechaLimite: '2026-02-30' }, 't1', AHORA)).toEqual({
			ok: false,
			errores: { titulo: 'vacio', fechaLimite: 'invalida' }
		});
	});
});

describe('crearPuntual con emoji y nota', () => {
	it('guarda el emoji y la nota recortada', () => {
		const resultado = crearPuntual({ titulo: 'Regar', emoji: ' 🌱 ', nota: '  Usar guantes\n\nVentilar \n' }, 't1', AHORA);

		expect(resultado).toStrictEqual({
			ok: true,
			tarea: { id: 't1', titulo: 'Regar', emoji: '🌱', nota: 'Usar guantes\n\nVentilar', tipo: 'puntual', creadaEn: AHORA }
		});
	});

	it('un emoji o una nota vacíos o de solo espacios no se guardan', () => {
		const resultado = crearPuntual({ titulo: 'Regar', emoji: '  ', nota: ' \n ' }, 't1', AHORA);

		expect(resultado).toStrictEqual({ ok: true, tarea: { id: 't1', titulo: 'Regar', tipo: 'puntual', creadaEn: AHORA } });
	});

	it('un emoji inválido rechaza la creación entera, junto con los otros errores', () => {
		expect(crearPuntual({ titulo: 'Regar', emoji: '🌱🔥' }, 't1', AHORA)).toStrictEqual({ ok: false, errores: { emoji: 'invalido' } });
		expect(crearPuntual({ titulo: ' ', emoji: 'a', fechaLimite: '2026-02-30' }, 't1', AHORA)).toStrictEqual({
			ok: false,
			errores: { titulo: 'vacio', emoji: 'invalido', fechaLimite: 'invalida' }
		});
	});
});
