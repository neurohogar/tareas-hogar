import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createRecurringRelative } from './create-recurring-relative';

const NOW = new Date(2026, 6, 15, 8, 0, 0);
const unit = fc.constantFrom('horas' as const, 'dias' as const);
const spaces = fc.stringMatching(/^[ \t\n]*$/);
const titleWithText = fc.string({ minLength: 1 }).filter((t) => t.trim() !== '');
const validEvery = fc.integer({ min: 1, max: 1_000_000 });
const anyEvery = fc.oneof(fc.double(), fc.integer({ min: -1_000, max: 1_000 }));

describe('crearPeriodicaRelativa (propiedades)', () => {
	it('acepta exactamente los datos con título con texto y cada entero ≥ 1', () => {
		fc.assert(
			fc.property(fc.string(), anyEvery, unit, (title, every, u) => {
				const valid = title.trim() !== '' && Number.isInteger(every) && every >= 1;
				expect(createRecurringRelative({ title, every, unit: u }, 'id', NOW).ok).toBe(valid);
			})
		);
	});

	it('cada error corresponde a un campo inválido y viceversa', () => {
		fc.assert(
			fc.property(fc.string(), anyEvery, unit, (title, every, u) => {
				const result = createRecurringRelative({ title, every, unit: u }, 'id', NOW);
				if (result.ok) return;
				expect(result.errors.title === 'vacio').toBe(title.trim() === '');
				expect(result.errors.every === 'invalido').toBe(!(Number.isInteger(every) && every >= 1));
			})
		);
	});

	it('guarda el título recortado, la recurrencia pedida, el id y el momento de creación', () => {
		fc.assert(
			fc.property(spaces, titleWithText, spaces, validEvery, unit, fc.uuid(), (before, title, after, every, u, id) => {
				const result = createRecurringRelative({ title: before + title + after, every, unit: u }, id, NOW);
				expect(result).toEqual({
					ok: true,
					task: {
						id,
						title: title.trim(),
						kind: 'periodica',
						recurrence: { mode: 'relativo', every, unit: u },
						createdAt: NOW
					}
				});
			})
		);
	});

	it('es idempotente: recrear con los datos de una tarea creada da la misma tarea', () => {
		fc.assert(
			fc.property(titleWithText, validEvery, unit, (title, every, u) => {
				const first = createRecurringRelative({ title, every, unit: u }, 'id', NOW);
				if (!first.ok) throw new Error('debía crearse');
				const { title: savedValue, recurrence } = first.task;
				if (recurrence.mode !== 'relativo') throw new Error('debía ser relativa');
				const second = createRecurringRelative({ title: savedValue, every: recurrence.every, unit: recurrence.unit }, 'id', NOW);
				expect(second).toEqual(first);
			})
		);
	});
});
