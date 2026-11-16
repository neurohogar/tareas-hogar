import { describe, expect, it } from 'vitest';
import { createOneOff } from './create-one-off';

const NOW = new Date(2026, 6, 15, 8, 0, 0);

describe('crearPuntual', () => {
	it('crea una tarea puntual con id, creadaEn y la fecha límite como el inicio de ese día local', () => {
		expect(createOneOff({ title: 'Pagar la luz', dueDate: '2026-07-20' }, 't1', NOW)).toStrictEqual({
			ok: true,
			task: { id: 't1', title: 'Pagar la luz', kind: 'puntual', dueDate: new Date(2026, 6, 20), createdAt: NOW }
		});
	});

	it('sin fecha límite, la tarea no tiene el campo', () => {
		expect(createOneOff({ title: 'Cambiar foco' }, 't1', NOW)).toStrictEqual({
			ok: true,
			task: { id: 't1', title: 'Cambiar foco', kind: 'puntual', createdAt: NOW }
		});
	});

	it('acepta una fecha límite anterior al día de creación', () => {
		const result = createOneOff({ title: 'Renovar DNI', dueDate: '2026-07-10' }, 't1', NOW);

		expect(result.ok && result.task).toMatchObject({ dueDate: new Date(2026, 6, 10) });
	});

	it('guarda el título sin los espacios de los extremos', () => {
		const result = createOneOff({ title: '  Pagar la luz ' }, 't1', NOW);

		expect(result.ok && result.task.title).toBe('Pagar la luz');
	});

	it.each(['', '   '])('rechaza el título vacío o de solo espacios (%j)', (title) => {
		expect(createOneOff({ title }, 't1', NOW)).toEqual({ ok: false, errors: { title: 'vacio' } });
	});

	it.each(['2026-02-29', '2026-04-31', '2026-13-01', ''])('rechaza una fecha límite que no existe (%j)', (dueDate) => {
		expect(createOneOff({ title: 'Pagar la luz', dueDate }, 't1', NOW)).toEqual({
			ok: false,
			errors: { dueDate: 'invalida' }
		});
	});

	it('junta los dos motivos de rechazo', () => {
		expect(createOneOff({ title: ' ', dueDate: '2026-02-30' }, 't1', NOW)).toEqual({
			ok: false,
			errors: { title: 'vacio', dueDate: 'invalida' }
		});
	});
});

describe('crearPuntual con emoji y nota', () => {
	it('guarda el emoji y la nota recortada', () => {
		const result = createOneOff({ title: 'Regar', emoji: ' 🌱 ', note: '  Usar guantes\n\nVentilar \n' }, 't1', NOW);

		expect(result).toStrictEqual({
			ok: true,
			task: { id: 't1', title: 'Regar', emoji: '🌱', note: 'Usar guantes\n\nVentilar', kind: 'puntual', createdAt: NOW }
		});
	});

	it('un emoji o una nota vacíos o de solo espacios no se guardan', () => {
		const result = createOneOff({ title: 'Regar', emoji: '  ', note: ' \n ' }, 't1', NOW);

		expect(result).toStrictEqual({ ok: true, task: { id: 't1', title: 'Regar', kind: 'puntual', createdAt: NOW } });
	});

	it('un emoji inválido rechaza la creación entera, junto con los otros errores', () => {
		expect(createOneOff({ title: 'Regar', emoji: '🌱🔥' }, 't1', NOW)).toStrictEqual({ ok: false, errors: { emoji: 'invalido' } });
		expect(createOneOff({ title: ' ', emoji: 'a', dueDate: '2026-02-30' }, 't1', NOW)).toStrictEqual({
			ok: false,
			errors: { title: 'vacio', emoji: 'invalido', dueDate: 'invalida' }
		});
	});
});
