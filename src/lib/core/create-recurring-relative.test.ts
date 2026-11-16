import { describe, expect, it } from 'vitest';
import { createRecurringRelative } from './create-recurring-relative';

const NOW = new Date(2026, 6, 15, 8, 0, 0);

describe('crearPeriodicaRelativa', () => {
	it('crea una tarea periódica relativa con id, creadaEn y la recurrencia pedida', () => {
		const result = createRecurringRelative({ title: 'Regar plantas', every: 3, unit: 'dias' }, 't1', NOW);

		expect(result).toEqual({
			ok: true,
			task: {
				id: 't1',
				title: 'Regar plantas',
				kind: 'periodica',
				recurrence: { mode: 'relativo', every: 3, unit: 'dias' },
				createdAt: NOW
			}
		});
	});

	it('guarda el título sin los espacios de los extremos', () => {
		const result = createRecurringRelative({ title: '  Ventilar ', every: 4, unit: 'horas' }, 't1', NOW);

		expect(result.ok && result.task.title).toBe('Ventilar');
	});

	it.each(['', '   ', '\t\n'])('rechaza el título vacío o de solo espacios (%j)', (title) => {
		expect(createRecurringRelative({ title, every: 1, unit: 'horas' }, 't1', NOW)).toEqual({
			ok: false,
			errors: { title: 'vacio' }
		});
	});

	it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rechaza un cada que no es entero ≥ 1 (%s)', (every) => {
		expect(createRecurringRelative({ title: 'Ventilar', every, unit: 'horas' }, 't1', NOW)).toEqual({
			ok: false,
			errors: { every: 'invalido' }
		});
	});

	it('acepta el mínimo cada = 1', () => {
		expect(createRecurringRelative({ title: 'Ventilar', every: 1, unit: 'horas' }, 't1', NOW).ok).toBe(true);
	});

	it('informa los dos errores juntos', () => {
		expect(createRecurringRelative({ title: ' ', every: 0, unit: 'dias' }, 't1', NOW)).toEqual({
			ok: false,
			errors: { title: 'vacio', every: 'invalido' }
		});
	});
});
