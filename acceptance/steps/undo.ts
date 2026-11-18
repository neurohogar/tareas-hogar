// Undo a completion (spec §5.4): from the History, from the notice and
// from another device.
import { expect } from 'vitest';
import { visibleNotice, completionToUndo } from '../../src/lib/core/notice';
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

function theNoticeQueried(world: World) {
	if (!world.noticeQueried) throw new Error('The notice was not queried');
	return world.noticeQueried.notice;
}

export const undoSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^borro el completado del ${P}$`),
		run: (world, moment) => {
			rememberBeforeOfMyChange(world);
			deleteCompletion(world, theCompletionOf(world, moment));
		}
	},
	{
		pattern: new RegExp(`^${OTHER} borra el completado del ${P}$`),
		run: (world, moment) => deleteCompletion(world, theCompletionOf(world, moment))
	},
	{
		pattern: new RegExp(`^toco Deshacer en el aviso el ${P}$`),
		run: (world, moment) => {
			rememberBeforeOfMyChange(world);
			deleteCompletion(world, completionToUndo(world.notice, dateHour(moment)));
			world.notice = undefined;
		}
	},
	{
		pattern: new RegExp(`^consulto el aviso el ${P}$`),
		run: (world, now) => {
			const moment = dateHour(now);
			world.noticeQueried = { notice: visibleNotice(world.notice, moment), now: moment };
		}
	},
	{
		pattern: new RegExp(`^el aviso ofrece deshacer el completado de ${TITLE} del ${P}$`),
		run: (world, title, moment) => {
			const task = theTaskTitled(world, title);
			const notice = theNoticeQueried(world);
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
		pattern: /^no hay aviso$/,
		run: (world) => expect(theNoticeQueried(world)).toBeUndefined()
	}
];
