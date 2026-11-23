// Undo a completion (spec §5.4): from the History, from the notice and
// from another device.
import { expect } from 'vitest';
import { visibleNotice, completionToUndo, rescheduleToUndo, type Notice } from '../../src/lib/core/notice';
import { applyChange } from '../../src/lib/core/task-document';
import { changeOnDeleteCompletion } from '../../src/lib/core/current-step';
import type { Completion } from '../../src/lib/core/task';
import { P, TITLE, dateHour } from './values';
import {
	OTHER,
	deleteSaved,
	theTaskTitled,
	thatWasSaved,
	rememberBeforeOfMyChange,
	tasksOf,
	type StepDefinition,
	type World
} from './world';

/** The completion with that completedAt, even if it has been deleted. */
function theCompletionOf(world: World, moment: string): Completion {
	const instant = dateHour(moment).getTime();
	const ofMoment = thatWasSaved(world).completions.filter(({ completedAt }) => completedAt.getTime() === instant);
	if (ofMoment.length !== 1) throw new Error(`Expected one completion of ${moment}, found ${ofMoment.length}`);
	return ofMoment[0];
}

/**
 * Like deleteDoc: deleting a completion that no longer exists does nothing. If it was the most recent of a
 * task with two or more steps, the task returns to the step it was on when completed (§4.1, Pasos: Deshacer).
 */
export function deleteCompletion(world: World, completion: Completion | undefined): void {
	if (!completion) return;
	const task = tasksOf(world).find(({ id }) => id === completion.taskId);
	if (task) world.docs = applyChange(world.docs, task.id, changeOnDeleteCompletion(task, world.completions, completion));
	deleteSaved(world, [], [completion.id]);
}

export function theNoticeQueried(world: World) {
	if (!world.noticeQueried) throw new Error('The notice was not queried');
	return world.noticeQueried.notice;
}

/** The queried notice, which has to be a completion one (§5.4) if there is one: a rescheduling notice (§5.11) is not. */
export function queriedCompletionNotice(world: World): Notice | undefined {
	const notice = theNoticeQueried(world);
	if (notice && !('completion' in notice)) throw new Error('The notice is the one of a rescheduling, not of a completion');
	return notice;
}

/** Deshacer on the notice (§5.4, §5.11): the rescheduling it offers, or else the completion; the notice closes. */
function undoNotice(world: World, now: Date): void {
	const resumes = rescheduleToUndo(world.notice, now, tasksOf(world));
	for (const { taskId, change } of resumes ?? []) world.docs = applyChange(world.docs, taskId, change);
	if (!resumes) deleteCompletion(world, completionToUndo(world.notice, now));
	world.notice = undefined;
}

export const undoSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^I delete the completion from ${P}$`),
		run: (world, moment) => {
			rememberBeforeOfMyChange(world);
			deleteCompletion(world, theCompletionOf(world, moment));
		}
	},
	{
		pattern: new RegExp(`^${OTHER} deletes the completion from ${P}$`),
		run: (world, moment) => deleteCompletion(world, theCompletionOf(world, moment))
	},
	{
		pattern: new RegExp(`^I tap Deshacer in the notice on ${P}$`),
		run: (world, moment) => {
			rememberBeforeOfMyChange(world);
			undoNotice(world, dateHour(moment));
		}
	},
	{
		pattern: new RegExp(`^I query the notice on ${P}$`),
		run: (world, now) => {
			const moment = dateHour(now);
			world.noticeQueried = { notice: visibleNotice(world.notice, moment), now: moment };
		}
	},
	{
		pattern: new RegExp(`^the notice offers to undo the completion of ${TITLE} from ${P}$`),
		run: (world, title, moment) => {
			const task = theTaskTitled(world, title);
			const notice = queriedCompletionNotice(world);
			expect(notice?.name).toBe(title);
			// The step the task was on (§4.4) is asserted by the steps steps; here, no other field.
			const { stepAtCompletion: stepOnComplete, wasMinimal, ...rest } = notice?.completion ?? {};
			expect(rest).toStrictEqual({ id: expect.any(String), taskId: task.id, completedAt: dateHour(moment) });
			if (stepOnComplete !== undefined) expect(stepOnComplete).toBeGreaterThanOrEqual(1);
			// That it was the minimal one (§4.4) is asserted by the minimal-version steps; it is only ever written as true.
			if (wasMinimal !== undefined) expect(wasMinimal).toBe(true);
			expect(world.completions).toContainEqual(notice?.completion);
		}
	},
	{
		pattern: /^there is no notice$/,
		run: (world) => expect(theNoticeQueried(world)).toBeUndefined()
	}
];
