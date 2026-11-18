import { expect } from 'vitest';
import { createOneOff, type OneOffData } from '../../src/lib/core/create-one-off';
import type { Task } from '../../src/lib/core/task';
import { NOW, SCENARIO_BEFORE, TITLE_VALID, recordCreation } from './create';
import { recordCompletion } from './recurring-relative';
import { P, TITLE, date, dateHour } from './values';
import { theDoc, theTask, theTaskOfKind, theTaskTitled, type StepDefinition, type World } from './world';

/** Any due date: the scenario says it does not influence the result. */
const DUE_DATE = '2026-07-20';

/** Moments of already recorded completions: the scenario says they do not influence the result. */
const COMPLETIONS_MOMENTS = [new Date(2026, 6, 10, 9, 0, 0), new Date(2026, 6, 25, 18, 30, 0)];
const COMPLETIONS_COUNT = { 'un completado': 1, 'dos completados': 2 };
const COUNT = `(${Object.keys(COMPLETIONS_COUNT).join('|')})`;

function recordCompletions(world: World, task: Task, count: string): void {
	const howMany = COMPLETIONS_COUNT[count as keyof typeof COMPLETIONS_COUNT];
	for (const moment of COMPLETIONS_MOMENTS.slice(0, howMany)) recordCompletion(world, moment, task);
}

/** The due date arrives as raw text: validating it belongs to the domain. */
function create(world: World, data: OneOffData, now = NOW): void {
	recordCreation(world, (id) => createOneOff(data, id, now));
}

const theOneOff = (world: World) => theTaskOfKind(world, 'puntual');

export const oneOffSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y fecha límite ${P}$`),
		run: (world, title, dueDate) => create(world, { title, dueDate })
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y sin fecha límite$`),
		run: (world, title) => create(world, { title })
	},
	{
		pattern: /^creo una tarea puntual con un título de solo espacios y sin fecha límite$/,
		run: (world) => create(world, { title: '   ' })
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con un título válido y fecha límite ${P}$`),
		run: (world, dueDate) => create(world, { title: TITLE_VALID, dueDate })
	},
	{
		pattern: new RegExp(`^creo el ${P} una tarea puntual con un título válido y fecha límite ${P}$`),
		run: (world, created, dueDate) => create(world, { title: TITLE_VALID, dueDate }, dateHour(created))
	},
	{
		pattern: /^una tarea puntual sin fecha límite$/,
		run: (world) => create(world, { title: 'Tarea' })
	},
	{
		pattern: new RegExp(`^una tarea puntual sin fecha límite creada el ${P}$`),
		run: (world, created) => create(world, { title: 'Tarea' }, dateHour(created))
	},
	{
		pattern: new RegExp(`^una tarea puntual con fecha límite ${P}$`),
		run: (world, dueDate) => create(world, { title: 'Tarea', dueDate })
	},
	{
		pattern: new RegExp(`^una tarea puntual con fecha límite ${P} creada el ${P}$`),
		run: (world, dueDate, created) => create(world, { title: 'Tarea', dueDate }, dateHour(created))
	},
	{
		pattern: new RegExp(`^una tarea puntual ${TITLE} con fecha límite ${P}$`),
		run: (world, title, dueDate) => create(world, { title, dueDate }, SCENARIO_BEFORE)
	},
	{
		pattern: new RegExp(`^una tarea puntual ${TITLE} con fecha límite ${P} creada el ${P}$`),
		run: (world, title, dueDate, created) => create(world, { title, dueDate }, dateHour(created))
	},
	{
		pattern: new RegExp(`^una tarea puntual ${TITLE} sin fecha límite$`),
		run: (world, title) => create(world, { title }, SCENARIO_BEFORE)
	},
	{
		pattern: new RegExp(`^una tarea puntual ${TITLE} sin fecha límite creada el ${P}$`),
		run: (world, title, created) => create(world, { title }, dateHour(created))
	},
	{
		pattern: /^una tarea puntual con una fecha límite cualquiera$/,
		run: (world) => create(world, { title: 'Tarea', dueDate: DUE_DATE })
	},
	{
		pattern: /^se crea una tarea puntual$/,
		run: (world) => theOneOff(world)
	},
	{
		pattern: new RegExp(`^su fecha límite es ${P}$`),
		run: (world, dueDate) => expect(theOneOff(world).dueDate).toEqual(date(dueDate))
	},
	{
		pattern: /^la tarea no tiene fecha límite$/,
		run: (world) => expect(theDoc(world)).not.toHaveProperty('dueDate')
	},
	{
		// Before tapping the checkbox it declares the completions; afterwards, it asserts how many remain.
		pattern: new RegExp(`^la tarea tiene ${COUNT}$`),
		run: (world, count) => {
			if (!world.checkboxTouched) return recordCompletions(world, theTask(world), count);
			expect(world.completions.filter(({ taskId }) => taskId === theTask(world).id)).toHaveLength(COMPLETIONS_COUNT[count as keyof typeof COMPLETIONS_COUNT]);
		}
	},
	{
		pattern: new RegExp(`^la tarea ${TITLE} tiene ${COUNT}$`),
		run: (world, title, count) => recordCompletions(world, theTaskTitled(world, title), count)
	},
	{
		pattern: new RegExp(`^el completado registrado es del ${P}$`),
		run: (world, completed) => expect(world.newCompletion?.completedAt).toEqual(dateHour(completed))
	}
];
