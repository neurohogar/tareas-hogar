import { describe, expect, it } from 'vitest';
import { createOneOff } from './create-one-off';

const NOW = new Date(2026, 6, 15, 8, 0, 0);

describe('createOneOff', () => {
	it('creates a one-off task with id, createdAt and the due date as the start of that local day', () => {
		expect(createOneOff({ title: 'Pagar la luz', dueDate: '2026-07-20' }, 't1', NOW)).toStrictEqual({
			ok: true,
			task: { id: 't1', title: 'Pagar la luz', kind: 'puntual', dueDate: new Date(2026, 6, 20), createdAt: NOW }
		});
	});

	it('without a due date, the task does not have the field', () => {
		expect(createOneOff({ title: 'Cambiar foco' }, 't1', NOW)).toStrictEqual({
			ok: true,
			task: { id: 't1', title: 'Cambiar foco', kind: 'puntual', createdAt: NOW }
		});
	});

	it('accepts a due date earlier than the creation day', () => {
		const result = createOneOff({ title: 'Renovar DNI', dueDate: '2026-07-10' }, 't1', NOW);

		expect(result.ok && result.task).toMatchObject({ dueDate: new Date(2026, 6, 10) });
	});

	it('saves the title without the spaces at the ends', () => {
		const result = createOneOff({ title: '  Pagar la luz ' }, 't1', NOW);

		expect(result.ok && result.task.title).toBe('Pagar la luz');
	});

	it.each(['', '   '])('rejects an empty title or one of only spaces (%j)', (title) => {
		expect(createOneOff({ title }, 't1', NOW)).toEqual({ ok: false, errors: { title: 'vacio' } });
	});

	it.each(['2026-02-29', '2026-04-31', '2026-13-01', ''])('rejects a due date that does not exist (%j)', (dueDate) => {
		expect(createOneOff({ title: 'Pagar la luz', dueDate }, 't1', NOW)).toEqual({
			ok: false,
			errors: { dueDate: 'invalida' }
		});
	});

	it('combines the two reasons for rejection', () => {
		expect(createOneOff({ title: ' ', dueDate: '2026-02-30' }, 't1', NOW)).toEqual({
			ok: false,
			errors: { title: 'vacio', dueDate: 'invalida' }
		});
	});
});

describe('createOneOff with emoji and note', () => {
	it('saves the emoji and the trimmed note', () => {
		const result = createOneOff({ title: 'Regar', emoji: ' 🌱 ', note: '  Usar guantes\n\nVentilar \n' }, 't1', NOW);

		expect(result).toStrictEqual({
			ok: true,
			task: { id: 't1', title: 'Regar', emoji: '🌱', note: 'Usar guantes\n\nVentilar', kind: 'puntual', createdAt: NOW }
		});
	});

	it('an empty emoji or note, or one of only spaces, is not saved', () => {
		const result = createOneOff({ title: 'Regar', emoji: '  ', note: ' \n ' }, 't1', NOW);

		expect(result).toStrictEqual({ ok: true, task: { id: 't1', title: 'Regar', kind: 'puntual', createdAt: NOW } });
	});

	it('an invalid emoji rejects the whole creation, together with the other errors', () => {
		expect(createOneOff({ title: 'Regar', emoji: '🌱🔥' }, 't1', NOW)).toStrictEqual({ ok: false, errors: { emoji: 'invalido' } });
		expect(createOneOff({ title: ' ', emoji: 'a', dueDate: '2026-02-30' }, 't1', NOW)).toStrictEqual({
			ok: false,
			errors: { title: 'vacio', emoji: 'invalido', dueDate: 'invalida' }
		});
	});
});
