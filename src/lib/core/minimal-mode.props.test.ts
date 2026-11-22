import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { isPaused, pauseAction, pauseText, pausedByMinimalMode } from './pause';
import { isEssential, essentialField } from './essential';
import { minimalModeOn, resumesOnTurningOff } from './minimal-mode';
import { pendingRows } from './pending';
import { taskStatus } from './task-status';
import { dataOnCreate } from './task-data';
import type { Task } from './task';

const instant = fc.integer({ min: 0, max: 4_102_444_800_000 }).map((ms) => new Date(ms));
const task = fc
	.record({
		id: fc.uuid(),
		recurring: fc.boolean(),
		essential: fc.boolean(),
		paused: fc.boolean(),
		createdAt: instant
	})
	.map(({ id, recurring, essential, paused, createdAt }): Task => {
		const common = { id, title: 'T', createdAt, ...essentialField(essential) };
		return recurring
			? { ...common, kind: 'periodica', recurrence: { mode: 'relativo', every: 1, unit: 'dias' }, ...(paused && { paused }) }
			: ({ ...common, kind: 'puntual' } as Task);
	});
const tasks = fc.array(task, { maxLength: 10 }).map((list) => list.map((t, i) => ({ ...t, id: `t${i}` }) as Task));

describe('minimal mode: properties (spec §5.8)', () => {
	it('with the mode off, nothing changes: the paused rule is the manual one', () => {
		fc.assert(
			fc.property(task, (t) => {
				expect(isPaused(t, false)).toBe(isPaused(t));
				expect(pausedByMinimalMode(t, false)).toBe(false);
			})
		);
	});

	it('an essential task or a one-off is never paused by the mode', () => {
		fc.assert(
			fc.property(task, (t) => {
				if (isEssential(t) || t.kind === 'puntual') expect(pausedByMinimalMode(t, true)).toBe(false);
				else expect(pausedByMinimalMode(t, true)).toBe(true);
			})
		);
	});

	it('the status is paused exactly when isPaused says so', () => {
		fc.assert(
			fc.property(task, instant, fc.boolean(), (t, now, mode) => {
				expect(taskStatus(t, [], now, mode).kind === 'pausada').toBe(isPaused(t, mode));
			})
		);
	});

	it('the button and the text are consistent with the cause of the pause', () => {
		fc.assert(
			fc.property(task, fc.boolean(), (t, mode) => {
				if (t.kind === 'puntual') expect(pauseAction(t, mode)).toBeUndefined();
				if (t.kind === 'periodica' && pausedByMinimalMode(t, mode) && t.paused !== true) {
					expect(pauseAction(t, mode)).toBeUndefined();
					expect(pauseText(t, mode)).toBe('Pausada por el modo mínimo');
				}
				if (t.kind === 'periodica' && t.paused === true) {
					expect(pauseAction(t, mode)).toBe('reanudar');
					expect(pauseText(t, mode)).toBe('Pausada');
				}
			})
		);
	});

	it('the Pending list with the mode on holds only essential tasks, a subset of the list with it off', () => {
		fc.assert(
			fc.property(tasks, instant, fc.boolean(), fc.boolean(), (list, now, completed, paused) => {
				const on = pendingRows(list, [], now, completed, paused, true).map((row) => row.task);
				const off = pendingRows(list, [], now, completed, paused, false).map((row) => row.task.id);
				expect(on.every(isEssential)).toBe(true);
				expect(on.every((t) => off.includes(t.id))).toBe(true);
			})
		);
	});

	it('turning it off resumes exactly the recurring non-essential tasks not paused by hand, once each', () => {
		fc.assert(
			fc.property(tasks, instant, (list, now) => {
				const resumes = resumesOnTurningOff(list, now);
				const expected = list.filter((t) => t.kind === 'periodica' && !isEssential(t) && t.paused !== true).map((t) => t.id);
				expect(resumes.map((r) => r.taskId)).toStrictEqual(expected);
				for (const { change } of resumes) expect(change).toStrictEqual({ resumedAt: now });
			})
		);
	});

	it('a task resumed on turning off is no longer paused with the mode off', () => {
		fc.assert(
			fc.property(tasks, instant, (list, now) => {
				const resumed = new Set(resumesOnTurningOff(list, now).map((r) => r.taskId));
				for (const t of list) if (resumed.has(t.id)) expect(isPaused(t, false)).toBe(false);
			})
		);
	});

	it('the mode is on only with a document that says active = true', () => {
		fc.assert(
			fc.property(fc.option(fc.record({ active: fc.boolean() }), { nil: undefined }), (doc) => {
				expect(minimalModeOn(doc)).toBe(doc?.active === true);
			})
		);
	});

	it('essentialField: a field only for true; a new task starts essential only with the mode on', () => {
		fc.assert(
			fc.property(fc.option(fc.boolean(), { nil: undefined }), fc.boolean(), (value, mode) => {
				expect('essential' in essentialField(value)).toBe(value === true);
				expect(dataOnCreate(mode).essential === true).toBe(mode);
			})
		);
	});
});
