import { describe, expect, it } from 'vitest';
import { createRecurringRelative } from './create-recurring-relative';

const NOW = new Date(2026, 6, 15, 8, 0, 0);

describe('createRecurringRelative', () => {
	it('creates a relative recurring task with id, createdAt and the requested recurrence', () => {
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

	it('saves the title without the spaces at the ends', () => {
		const result = createRecurringRelative({ title: '  Ventilar ', every: 4, unit: 'horas' }, 't1', NOW);

		expect(result.ok && result.task.title).toBe('Ventilar');
	});

	it.each(['', '   ', '\t\n'])('rejects an empty title or one of only spaces (%j)', (title) => {
		expect(createRecurringRelative({ title, every: 1, unit: 'horas' }, 't1', NOW)).toEqual({
			ok: false,
			errors: { title: 'vacio' }
		});
	});

	it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects an every that is not an integer ≥ 1 (%s)', (every) => {
		expect(createRecurringRelative({ title: 'Ventilar', every, unit: 'horas' }, 't1', NOW)).toEqual({
			ok: false,
			errors: { every: 'invalido' }
		});
	});

	it('accepts the minimum every = 1', () => {
		expect(createRecurringRelative({ title: 'Ventilar', every: 1, unit: 'horas' }, 't1', NOW).ok).toBe(true);
	});

	it('reports the two errors together', () => {
		expect(createRecurringRelative({ title: ' ', every: 0, unit: 'dias' }, 't1', NOW)).toEqual({
			ok: false,
			errors: { title: 'vacio', every: 'invalido' }
		});
	});
});
