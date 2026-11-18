import { describe, expect, it } from 'vitest';
import { checkboxAction, checkboxEnabled } from './checkbox';
import type { Completion, Task } from './task';

const CREATED = new Date(2026, 6, 1);
const oneOff: Task = { id: 'p', title: 'Pagar', kind: 'puntual', createdAt: CREATED };
const relative: Task = { id: 'r', title: 'Regar', kind: 'periodica', recurrence: { mode: 'relativo', every: 2, unit: 'dias' }, createdAt: CREATED };
const weekly: Task = {
	id: 's',
	title: 'Basura',
	kind: 'periodica',
	recurrence: { mode: 'calendario', weekdays: ['martes', 'jueves'] },
	createdAt: CREATED
};
const completion = (id: string, taskId: string, completedAt: Date, coveredOccurrence?: Date): Completion => ({
	id,
	taskId,
	completedAt,
	...(coveredOccurrence && { coveredOccurrence })
});

describe('checkboxAction (spec §6.1)', () => {
	it('a task that is not completed is completed', () => {
		expect(checkboxAction(oneOff, [], new Date(2026, 6, 15, 8, 0, 0))).toEqual({ kind: 'completar' });
	});

	it('a recurring task with completions but pending is completed (it does not delete the previous one)', () => {
		const previous = completion('c1', 'r', new Date(2026, 6, 10, 8, 0, 0));
		expect(checkboxAction(relative, [previous], new Date(2026, 6, 15, 8, 0, 0))).toEqual({ kind: 'completar' });
	});

	it('a completed one-off deletes its most recent completion, even if from another day', () => {
		const oldOne = completion('c1', 'p', new Date(2026, 6, 10, 9, 0, 0));
		const recent = completion('c2', 'p', new Date(2026, 6, 12, 9, 0, 0));
		expect(checkboxAction(oneOff, [recent, oldOne], new Date(2026, 6, 15, 8, 0, 0))).toEqual({ kind: 'borrar', completion: recent });
	});

	it('a recurring task completed today deletes the most recent completion', () => {
		const yesterday = completion('c1', 'r', new Date(2026, 6, 13, 9, 0, 0));
		const today = completion('c2', 'r', new Date(2026, 6, 15, 0, 0, 0));
		expect(checkboxAction(relative, [today, yesterday], new Date(2026, 6, 15, 23, 59, 59))).toEqual({ kind: 'borrar', completion: today });
	});

	it('a recurring task with a completion "from the future" (skewed clocks) deletes it', () => {
		const upcoming = completion('c1', 'r', new Date(2026, 6, 16, 9, 0, 0));
		expect(checkboxAction(relative, [upcoming], new Date(2026, 6, 15, 12, 0, 0))).toEqual({ kind: 'borrar', completion: upcoming });
	});

	it('a recurring task completed on an earlier day is completed again', () => {
		const yesterday = completion('c1', 'r', new Date(2026, 6, 14, 23, 59, 59));
		expect(checkboxAction(relative, [yesterday], new Date(2026, 6, 15, 0, 0, 0))).toEqual({ kind: 'completar' });
	});

	it('a weekly one completed on an earlier day is completed again', () => {
		const monday = completion('c1', 's', new Date(2026, 6, 13, 10, 0, 0), new Date(2026, 6, 14));
		expect(checkboxAction(weekly, [monday], new Date(2026, 6, 14, 8, 0, 0))).toEqual({ kind: 'completar' });
	});

	it('only the completions of the task count', () => {
		const ofOther = completion('c1', 'otra', new Date(2026, 6, 15, 9, 0, 0));
		expect(checkboxAction(oneOff, [ofOther], new Date(2026, 6, 15, 10, 0, 0))).toEqual({ kind: 'completar' });
	});
});

describe('checkbox with a schedule (spec §5.5, §6.1)', () => {
	const schedule = [{ from: '08:00', to: '11:00' }];
	const withSchedule = <T extends Task>(task: T): T => ({ ...task, schedule });

	it.each([new Date(2026, 6, 15, 8, 0, 0), new Date(2026, 6, 15, 10, 59, 59)])('inside the window it completes (%s)', (now) => {
		expect(checkboxAction(withSchedule(oneOff), [], now)).toEqual({ kind: 'completar' });
		expect(checkboxEnabled(withSchedule(oneOff), [], now)).toBe(true);
	});

	it.each([new Date(2026, 6, 15, 7, 59, 59), new Date(2026, 6, 15, 11, 0, 0), new Date(2026, 6, 16, 3, 0, 0)])(
		'outside the window, what it would complete does nothing and is disabled (%s)',
		(now) => {
			expect(checkboxAction(withSchedule(oneOff), [], now)).toEqual({ kind: 'ninguna' });
			expect(checkboxEnabled(withSchedule(oneOff), [], now)).toBe(false);
		}
	);

	it('a recurring task completed on an earlier day, outside the window, is not completed again', () => {
		const previous = completion('c1', 'r', new Date(2026, 6, 14, 9, 0, 0));
		const everyThreeDays = withSchedule({ ...relative, recurrence: { mode: 'relativo' as const, every: 3, unit: 'dias' as const } });
		expect(checkboxAction(everyThreeDays, [previous], new Date(2026, 6, 15, 12, 0, 0))).toEqual({ kind: 'ninguna' });
		expect(checkboxAction(everyThreeDays, [previous], new Date(2026, 6, 15, 9, 0, 0))).toEqual({ kind: 'completar' });
	});

	it('what it would delete is enabled at any hour', () => {
		const doneItem = completion('c1', 'p', new Date(2026, 6, 15, 9, 0, 0));
		expect(checkboxAction(withSchedule(oneOff), [doneItem], new Date(2026, 6, 15, 20, 0, 0))).toEqual({ kind: 'borrar', completion: doneItem });
		expect(checkboxEnabled(withSchedule(oneOff), [doneItem], new Date(2026, 6, 15, 20, 0, 0))).toBe(true);
	});

	it('without a schedule, it is always enabled', () => {
		expect(checkboxEnabled(oneOff, [], new Date(2026, 6, 16, 3, 0, 0))).toBe(true);
	});
});

describe('checkbox with several windows (spec §5.5, §6.1)', () => {
	const schedule = [
		{ from: '07:00', to: '10:00' },
		{ from: '18:00', to: '21:00' }
	];

	it('completes inside any of the windows and is disabled between them', () => {
		const task = { ...oneOff, schedule };
		expect(checkboxEnabled(task, [], new Date(2026, 6, 15, 9, 0, 0))).toBe(true);
		expect(checkboxEnabled(task, [], new Date(2026, 6, 15, 12, 0, 0))).toBe(false);
		expect(checkboxEnabled(task, [], new Date(2026, 6, 15, 18, 0, 0))).toBe(true);
	});
});

describe('the checkbox of a paused or resumed task (spec §5.8)', () => {
	const NOW = new Date(2026, 6, 15, 12, 0, 0);

	it('of a paused one it is disabled, completed or not', () => {
		const ofToday = completion('c1', 'r', new Date(2026, 6, 15, 9, 0, 0));

		expect(checkboxAction({ ...relative, paused: true }, [], NOW)).toEqual({ kind: 'ninguna' });
		expect(checkboxEnabled({ ...relative, paused: true }, [ofToday], NOW)).toBe(false);
	});

	it('of a resumed one completed today before the pause it completes it, instead of deleting that completion', () => {
		const ofToday = completion('c1', 'r', new Date(2026, 6, 15, 9, 0, 0));
		const resumed = { ...relative, resumedAt: new Date(2026, 6, 15, 11, 0, 0) };

		expect(checkboxAction(resumed, [ofToday], NOW)).toEqual({ kind: 'completar' });
	});

	it('of a resumed calendar one waiting without completions since the resume it completes it', () => {
		// Wednesday: waits until Thursday; this morning's completion is from before the resume.
		const ofToday = completion('c1', 's', new Date(2026, 6, 15, 9, 0, 0), new Date(2026, 6, 14));
		const resumed = { ...weekly, resumedAt: new Date(2026, 6, 15, 11, 0, 0) };

		expect(checkboxAction(resumed, [ofToday], NOW)).toEqual({ kind: 'completar' });
	});

	it('of a resumed one completed after resuming it deletes that completion', () => {
		const after = completion('c2', 'r', new Date(2026, 6, 15, 11, 30, 0));
		const resumed = { ...relative, resumedAt: new Date(2026, 6, 15, 11, 0, 0) };

		expect(checkboxAction(resumed, [completion('c1', 'r', new Date(2026, 6, 15, 9, 0, 0)), after], NOW)).toEqual({
			kind: 'borrar',
			completion: after
		});
	});
});

describe('checkboxAction of a postponed task (spec §5.9)', () => {
	const postponed = { from: new Date(2026, 6, 15, 12, 0, 0), to: new Date(2026, 6, 15, 15, 0, 0) };
	const NOW = new Date(2026, 6, 15, 13, 0, 0);

	it('a recurring task postponed with a completion from today is completed again', () => {
		const task: Task = { ...relative, recurrence: { mode: 'relativo', every: 4, unit: 'horas' }, postponed };

		expect(checkboxAction(task, [completion('c', 'r', new Date(2026, 6, 15, 8, 0, 0))], NOW)).toStrictEqual({ kind: 'completar' });
	});

	it('outside the window of its schedule, the checkbox is disabled', () => {
		const task: Task = { ...oneOff, postponed, schedule: [{ from: '08:00', to: '11:00' }] };

		expect(checkboxEnabled(task, [], NOW)).toBe(false);
	});

	it('inside the window of its schedule, it is enabled', () => {
		const task: Task = { ...oneOff, postponed, schedule: [{ from: '08:00', to: '14:00' }] };

		expect(checkboxEnabled(task, [], NOW)).toBe(true);
	});
});
