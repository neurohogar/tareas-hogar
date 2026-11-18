import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { addDays } from './days';
import { oneOffStatus } from './one-off-status';
import type { Completion } from './task';

/** A local day between 1970 and ~2100 (at 00:00), like a stored due date. */
const day = fc.integer({ min: 0, max: 47_000 }).map((n) => new Date(1970, 0, 1 + n));
/** Any instant in the same range, to the millisecond. */
const instant = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
const completions = fc
	.array(instant, { minLength: 1, maxLength: 5 })
	.map((moments) => moments.map((completedAt, i): Completion => ({ id: `c${i}`, taskId: 't', completedAt })));

describe('oneOffStatus (properties, spec §5.1)', () => {
	it('without completions or due date, it is always pending', () => {
		fc.assert(
			fc.property(instant, (now) => {
				expect(oneOffStatus(undefined, [], now)).toEqual({ kind: 'pendiente' });
			})
		);
	});

	it('without completions, it goes from pending to overdue exactly when the day after the due date starts', () => {
		fc.assert(
			fc.property(day, instant, (dueDate, now) => {
				const overdueFrom = addDays(dueDate, 1).getTime();
				const expected = now.getTime() >= overdueFrom ? 'atrasada' : 'pendiente';
				expect(oneOffStatus(dueDate, [], now)).toEqual({ kind: expected });
			})
		);
	});

	it('the edge is exact: the last millisecond of the due day is pending and the first of the next, overdue', () => {
		fc.assert(
			fc.property(day, (dueDate) => {
				const following = addDays(dueDate, 1).getTime();
				expect(oneOffStatus(dueDate, [], new Date(following - 1))).toEqual({ kind: 'pendiente' });
				expect(oneOffStatus(dueDate, [], new Date(following))).toEqual({ kind: 'atrasada' });
			})
		);
	});

	it('with any completion it is completed, with or without a due date and at any moment', () => {
		fc.assert(
			fc.property(fc.option(day, { nil: undefined }), completions, instant, (dueDate, doneOnes, now) => {
				expect(oneOffStatus(dueDate, doneOnes, now)).toEqual({ kind: 'completada' });
			})
		);
	});
});
