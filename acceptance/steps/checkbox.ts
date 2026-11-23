// The checkbox of a Pendientes row (spec §6.1): completes the task or deletes
// its most recent completion, as the core decides.
import { expect } from 'vitest';
import { checkboxAction, checkboxEnabled } from '../../src/lib/core/checkbox';
import { isCompleted } from '../../src/lib/core/completed';
import { taskStatus } from '../../src/lib/core/task-status';
import { pendingRows } from '../../src/lib/core/pending';
import { deleteCompletion } from './undo';
import { completeMe } from './recurring-relative';
import { P, dateHour } from './values';
import { minimalOn, theTask, rememberBeforeOfMyChange, type StepDefinition, type World } from './world';

function tapCheckbox(world: World, moment: Date): void {
	const task = theTask(world);
	world.checkboxTouched = true;
	// Without a prior query, what is asserted afterwards belongs to the moment of the tap.
	if (world.statusMoments.length === 0) world.statusMoments = [moment];
	const action = checkboxAction(task, world.completions, moment, minimalOn(world));
	if (action.kind === 'none') return;
	if (action.kind === 'complete') return completeMe(world, moment, task);
	rememberBeforeOfMyChange(world);
	deleteCompletion(world, action.completion);
}

/** Each moment the status or Pendientes was queried, with what is stored now. */
function inEveryMomentQueried(world: World, verify: (now: Date) => void): void {
	expect(world.statusMoments.length).toBeGreaterThan(0);
	for (const now of world.statusMoments) verify(now);
}

export const checkboxSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^I tap the task checkbox on ${P}$`),
		run: (world, moment) => tapCheckbox(world, dateHour(moment))
	},
	{
		pattern: /^the task is (not )?completed$/,
		run: (world, no) => {
			const task = theTask(world);
			inEveryMomentQueried(world, (now) =>
				expect(isCompleted(task, world.completions, now)).toBe(no === undefined)
			);
		}
	},
	{
		pattern: /^the task appears in Pendientes$/,
		run: (world) =>
			inEveryMomentQueried(world, (now) =>
				expect(pendingRows([theTask(world)], world.completions, now, world.showCompleted, world.showPaused, minimalOn(world))).toHaveLength(1)
			)
	},
	{
		pattern: /^the task checkbox is (enabled|disabled)$/,
		run: (world, as) =>
			inEveryMomentQueried(world, (now) =>
				expect(checkboxEnabled(theTask(world), world.completions, now, minimalOn(world))).toBe(as === 'enabled')
			)
	},
	{
		// §5.8: a paused task is not pending, overdue or waiting.
		pattern: /^the task has no status$/,
		run: (world) =>
			inEveryMomentQueried(world, (now) =>
				expect(['pendiente', 'atrasada', 'en espera']).not.toContain(taskStatus(theTask(world), world.completions, now, minimalOn(world)).kind)
			)
	},
	{
		pattern: /^the task does not appear in Pendientes$/,
		run: (world) =>
			inEveryMomentQueried(world, (now) =>
				expect(pendingRows([theTask(world)], world.completions, now, world.showCompleted, world.showPaused, minimalOn(world))).toEqual([])
			)
	}
];
