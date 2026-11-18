import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createRecurringRelative } from './create-recurring-relative';

const NOW = new Date(2026, 6, 15, 8, 0, 0);
const unit = fc.constantFrom('horas' as const, 'dias' as const);
const spaces = fc.stringMatching(/^[ \t\n]*$/);
const titleWithText = fc.string({ minLength: 1 }).filter((t) => t.trim() !== '');
const validEvery = fc.integer({ min: 1, max: 1_000_000 });
const anyEvery = fc.oneof(fc.double(), fc.integer({ min: -1_000, max: 1_000 }));

describe('createRecurringRelative (properties)', () => {
	it('accepts exactly the data with a title with text and an integer every ≥ 1', () => {
		fc.assert(
			fc.property(fc.string(), anyEvery, unit, (title, every, u) => {
				const valid = title.trim() !== '' && Number.isInteger(every) && every >= 1;
				expect(createRecurringRelative({ title, every, unit: u }, 'id', NOW).ok).toBe(valid);
			})
		);
	});

	it('each error corresponds to an invalid field and vice versa', () => {
		fc.assert(
			fc.property(fc.string(), anyEvery, unit, (title, every, u) => {
				const result = createRecurringRelative({ title, every, unit: u }, 'id', NOW);
				if (result.ok) return;
				expect(result.errors.title === 'vacio').toBe(title.trim() === '');
				expect(result.errors.every === 'invalido').toBe(!(Number.isInteger(every) && every >= 1));
			})
		);
	});

	it('saves the trimmed title, the requested recurrence, the id and the creation moment', () => {
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

	it('is idempotent: recreating with the data of a created task gives the same task', () => {
		fc.assert(
			fc.property(titleWithText, validEvery, unit, (title, every, u) => {
				const first = createRecurringRelative({ title, every, unit: u }, 'id', NOW);
				if (!first.ok) throw new Error('it should have been created');
				const { title: savedValue, recurrence } = first.task;
				if (recurrence.mode !== 'relativo') throw new Error('it should have been relative');
				const second = createRecurringRelative({ title: savedValue, every: recurrence.every, unit: recurrence.unit }, 'id', NOW);
				expect(second).toEqual(first);
			})
		);
	});
});
