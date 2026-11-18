// Deshacer un completado (spec §5.4): desde el Historial, desde el aviso y
// desde otro dispositivo.
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

/** El completado con ese completadoEn, aunque ya se haya borrado. */
function theCompletionOf(world: World, moment: string): Completion {
	const instant = dateHour(moment).getTime();
	const ofMoment = thatWasSaved(world).completions.filter(({ completedAt }) => completedAt.getTime() === instant);
	if (ofMoment.length !== 1) throw new Error(`Se esperaba un completado del ${moment}, hay ${ofMoment.length}`);
	return ofMoment[0];
}

/**
 * Como deleteDoc: borrar un completado que ya no existe no hace nada. Si era el más reciente de una
 * tarea de dos pasos o más, la tarea vuelve al paso en que iba al completarla (§4.1, Pasos: Deshacer).
 */
export function deleteCompletion(world: World, completion: Completion | undefined): void {
	if (!completion) return;
	const task = tasksOf(world).find(({ id }) => id === completion.taskId);
	if (task) world.docs = applyChange(world.docs, task.id, changeOnDeleteCompletion(task, world.completions, completion));
	deleteSaved(world, [], [completion.id]);
}

function theNoticeQueried(world: World) {
	if (!world.noticeQueried) throw new Error('No se consultó el aviso');
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
			// El paso en que iba la tarea (§4.4) lo afirman los pasos de los pasos; acá, ningún otro campo.
			const { stepAtCompletion: stepOnComplete, wasMinimal, ...rest } = notice?.completion ?? {};
			expect(rest).toStrictEqual({ id: expect.any(String), taskId: task.id, completedAt: dateHour(moment) });
			if (stepOnComplete !== undefined) expect(stepOnComplete).toBeGreaterThanOrEqual(1);
			// Que fue la mínima (§4.4) lo afirman los pasos de la mínima; solo se escribe en true.
			if (wasMinimal !== undefined) expect(wasMinimal).toBe(true);
			expect(world.completions).toContainEqual(notice?.completion);
		}
	},
	{
		pattern: /^no hay aviso$/,
		run: (world) => expect(theNoticeQueried(world)).toBeUndefined()
	}
];
