import { expect } from 'vitest';
import { noticeOnComplete } from '../../src/lib/core/notice';
import { complete } from '../../src/lib/core/completions';
import { applyChange } from '../../src/lib/core/task-document';
import { changeOnComplete } from '../../src/lib/core/current-step';
import { taskStatus } from '../../src/lib/core/task-status';
import type { Completion, Task } from '../../src/lib/core/task';
import { SCENARIO_BEFORE, createInWorld } from './create';
import { P, TITLE, dateHour, numeric, unit } from './values';
import {
	theTask,
	theTaskTitled,
	newId,
	rememberBeforeOfMyChange,
	type StepDefinition,
	type World
} from './world';

/** Arbitrary moments, far from each other, for "en cualquier momento". */
export const ANY_MOMENT = [
	new Date(2000, 0, 1, 0, 0, 0),
	new Date(2026, 6, 15, 8, 0, 0),
	new Date(2099, 11, 31, 23, 59, 59)
];

export function recordCompletion(world: World, moment: Date, task: Task = theTask(world), wasMinimal = false) {
	const completion = complete(task, world.completions, newId(world, 'completado'), moment, wasMinimal);
	world.completions = [...world.completions, completion];
	return completion;
}

/** How the new completion is built: whole through the checkbox; «Hice la mínima» is decided by the core and may not complete. */
export type Completes = (task: Task, completions: readonly Completion[], id: string, now: Date) => Completion | undefined;

const completesWhole: Completes = (task, completions, id, now) => complete(task, completions, id, now);

/** I complete from this device: it is my change and opens the notice (§5.4). If `completes` does not complete, nothing changes. */
export function completeMe(world: World, moment: Date, task: Task, completes: Completes = completesWhole): void {
	const completion = completes(task, world.completions, newId(world, 'completado'), moment);
	if (!completion) return;
	rememberBeforeOfMyChange(world);
	world.completionsPrevious = structuredClone(world.completions);
	world.momentOfNewCompletion = moment;
	world.completions = [...world.completions, completion];
	world.newCompletion = completion;
	world.notice = noticeOnComplete(task, world.newCompletion);
	// Completing, through the checkbox or «Hecho», returns the task to step 1 (§4.1, Pasos).
	world.docs = applyChange(world.docs, task.id, changeOnComplete(task));
}

function queryStatus(world: World, moments: Date[]): void {
	world.statusMoments = moments;
	world.statuses = moments.map((now) => taskStatus(theTask(world), world.completions, now));
}

function onlyStatus(world: World) {
	expect(world.statuses).toHaveLength(1);
	return world.statuses[0];
}

export const recurringRelativeSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^una tarea periódica relativa cada ${P} ${P}$`),
		run: (world, every, u) => createInWorld(world, { title: 'Tarea', every: numeric(every), unit: unit(u) })
	},
	{
		pattern: new RegExp(`^una tarea periódica relativa cada ${P} ${P} creada el ${P}$`),
		run: (world, every, u, created) =>
			createInWorld(world, { title: 'Tarea', every: numeric(every), unit: unit(u) }, dateHour(created))
	},
	{
		pattern: /^una tarea periódica relativa nunca completada$/,
		run: (world) => createInWorld(world, { title: 'Tarea', every: 1, unit: 'horas' })
	},
	{
		pattern: new RegExp(`^una tarea periódica relativa ${TITLE} cada ${P} ${P}$`),
		run: (world, title, every, u) =>
			createInWorld(world, { title, every: numeric(every), unit: unit(u) }, SCENARIO_BEFORE)
	},
	{
		pattern: new RegExp(`^una tarea periódica relativa ${TITLE} cada ${P} ${P} creada el ${P}$`),
		run: (world, title, every, u, created) =>
			createInWorld(world, { title, every: numeric(every), unit: unit(u) }, dateHour(created))
	},
	{
		pattern: new RegExp(`^una tarea periódica relativa ${TITLE} nunca completada$`),
		run: (world, title) => createInWorld(world, { title, every: 1, unit: 'horas' }, SCENARIO_BEFORE)
	},
	{
		pattern: new RegExp(`^una tarea periódica relativa ${TITLE} nunca completada creada el ${P}$`),
		run: (world, title, created) => createInWorld(world, { title, every: 1, unit: 'horas' }, dateHour(created))
	},
	{
		pattern: new RegExp(`^la tarea ${TITLE} fue completada el ${P}$`),
		run: (world, title, moment) => {
			recordCompletion(world, dateHour(moment), theTaskTitled(world, title));
		}
	},
	{
		pattern: new RegExp(`^la tarea fue completada el ${P}$`),
		run: (world, moment) => {
			recordCompletion(world, dateHour(moment));
		}
	},
	{
		pattern: new RegExp(`^completo la tarea el ${P}$`),
		run: (world, moment) => completeMe(world, dateHour(moment), theTask(world))
	},
	{
		pattern: new RegExp(`^completo la tarea ${TITLE} el ${P}$`),
		run: (world, title, moment) => completeMe(world, dateHour(moment), theTaskTitled(world, title))
	},
	{
		pattern: new RegExp(`^consulto el estado el ${P}$`),
		run: (world, now) => queryStatus(world, [dateHour(now)])
	},
	{
		pattern: /^consulto el estado en cualquier momento$/,
		run: (world) => queryStatus(world, ANY_MOMENT)
	},
	{
		pattern: /^el estado es (pendiente|en espera|atrasada)$/,
		run: (world, kind) => {
			expect(world.statuses.length).toBeGreaterThan(0);
			for (const status of world.statuses) expect(status.kind).toBe(kind);
		}
	},
	{
		pattern: new RegExp(`^el progreso es ${P}$`),
		run: (world, progress) => {
			const status = onlyStatus(world);
			if (status.kind !== 'en espera') throw new Error(`No progress: the status is ${status.kind}`);
			expect(status.progress).toBeCloseTo(numeric(progress), 9);
		}
	},
	{
		pattern: /^se registró un completado sin ocurrencia cubierta$/,
		run: (world) => {
			expect(world.newCompletion).toEqual({
				id: expect.any(String),
				taskId: theTask(world).id,
				completedAt: world.momentOfNewCompletion
			});
			expect(world.newCompletion).not.toHaveProperty('coveredOccurrence');
		}
	},
	{
		pattern: /^el nuevo completado se agrega sin modificar los anteriores$/,
		run: (world) => {
			const previous = world.completionsPrevious ?? [];
			expect(previous.length).toBeGreaterThan(0);
			expect(world.completions).toEqual([...previous, world.newCompletion]);
			expect(previous.map((c) => c.id)).not.toContain(world.newCompletion?.id);
		}
	}
];
