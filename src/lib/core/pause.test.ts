import { describe, expect, it } from 'vitest';
import { pauseAction, asJustCreated, isPaused, pause, resume } from './pause';
import type { Completion, RecurringTask, OneOffTask } from './task';

const CREATED = new Date(2026, 6, 1, 8, 0, 0);
const RESUMED = new Date(2026, 6, 15, 10, 0, 0);
const RELATIVE: RecurringTask = {
	id: 'r',
	title: 'Regar',
	kind: 'periodica',
	recurrence: { mode: 'relativo', every: 2, unit: 'dias' },
	createdAt: CREATED
};
const ONE_OFF: OneOffTask = { id: 'p', title: 'Pagar', kind: 'puntual', createdAt: CREATED };
const completion = (id: string, completedAt: Date): Completion => ({ id, taskId: 'r', completedAt });

describe('pause and resume (spec §5.8, §7)', () => {
	it('pausing writes paused', () => {
		expect(pause()).toStrictEqual({ paused: true });
	});

	it('resuming removes paused and stores resumedAt = now, in the same change', () => {
		expect(resume(RESUMED)).toStrictEqual({ paused: null, resumedAt: RESUMED });
	});
});

describe('isPaused (spec §4.1, §5.8)', () => {
	it('a recurring task with paused is paused; without the field, it is not', () => {
		expect(isPaused({ ...RELATIVE, paused: true })).toBe(true);
		expect(isPaused(RELATIVE)).toBe(false);
		expect(isPaused({ ...RELATIVE, paused: false })).toBe(false);
	});

	it('a one-off is never paused', () => {
		expect(isPaused(ONE_OFF)).toBe(false);
	});
});

describe('pauseAction (spec §6.2)', () => {
	it('when editing a recurring task it offers pause; if it is paused, resume', () => {
		expect(pauseAction(RELATIVE)).toBe('pausar');
		expect(pauseAction({ ...RELATIVE, paused: true })).toBe('reanudar');
	});

	it('a one-off cannot be paused', () => {
		expect(pauseAction(ONE_OFF)).toBeUndefined();
	});
});

describe('asJustCreated (spec §5.8)', () => {
	it('a resumed task is evaluated with createdAt = resumedAt and without the completions before resumedAt', () => {
		const task = { ...RELATIVE, resumedAt: RESUMED };
		const before = completion('c1', new Date(2026, 6, 15, 9, 59, 59));
		const atTheInstant = completion('c2', RESUMED);
		const after = completion('c3', new Date(2026, 6, 16, 8, 0, 0));

		expect(asJustCreated(task, [before, atTheInstant, after])).toStrictEqual({
			task: { ...task, createdAt: RESUMED },
			owns: [atTheInstant, after]
		});
	});

	it('one that was never resumed is evaluated as is', () => {
		const owns = [completion('c1', new Date(2026, 6, 2))];

		expect(asJustCreated(RELATIVE, owns)).toStrictEqual({ task: RELATIVE, owns });
		expect(asJustCreated(ONE_OFF, [])).toStrictEqual({ task: ONE_OFF, owns: [] });
	});
});
