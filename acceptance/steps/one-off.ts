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
const COMPLETIONS_COUNT = { 'a completion': 1, 'two completions': 2 };
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
		pattern: new RegExp(`^I create a one-off task with title ${P} and due date ${P}$`),
		run: (world, title, dueDate) => create(world, { title, dueDate })
	},
	{
		pattern: new RegExp(`^I create a one-off task with title ${P} and no due date$`),
		run: (world, title) => create(world, { title })
	},
	{
		pattern: /^I create a one-off task with a title of only spaces and no due date$/,
		run: (world) => create(world, { title: '   ' })
	},
	{
		pattern: new RegExp(`^I create a one-off task with a valid title and due date ${P}$`),
		run: (world, dueDate) => create(world, { title: TITLE_VALID, dueDate })
	},
	{
		pattern: new RegExp(`^I create on ${P} a one-off task with a valid title and due date ${P}$`),
		run: (world, created, dueDate) => create(world, { title: TITLE_VALID, dueDate }, dateHour(created))
	},
	{
		pattern: /^a one-off task without a due date$/,
		run: (world) => create(world, { title: 'Tarea' })
	},
	{
		pattern: new RegExp(`^a one-off task without a due date created on ${P}$`),
		run: (world, created) => create(world, { title: 'Tarea' }, dateHour(created))
	},
	{
		pattern: new RegExp(`^a one-off task with due date ${P}$`),
		run: (world, dueDate) => create(world, { title: 'Tarea', dueDate })
	},
	{
		pattern: new RegExp(`^a one-off task with due date ${P} created on ${P}$`),
		run: (world, dueDate, created) => create(world, { title: 'Tarea', dueDate }, dateHour(created))
	},
	{
		pattern: new RegExp(`^a one-off task ${TITLE} with due date ${P}$`),
		run: (world, title, dueDate) => create(world, { title, dueDate }, SCENARIO_BEFORE)
	},
	{
		pattern: new RegExp(`^a one-off task ${TITLE} with due date ${P} created on ${P}$`),
		run: (world, title, dueDate, created) => create(world, { title, dueDate }, dateHour(created))
	},
	{
		pattern: new RegExp(`^a one-off task ${TITLE} without a due date$`),
		run: (world, title) => create(world, { title }, SCENARIO_BEFORE)
	},
	{
		pattern: new RegExp(`^a one-off task ${TITLE} without a due date created on ${P}$`),
		run: (world, title, created) => create(world, { title }, dateHour(created))
	},
	{
		pattern: /^a one-off task with any due date$/,
		run: (world) => create(world, { title: 'Tarea', dueDate: DUE_DATE })
	},
	{
		pattern: /^a one-off task is created$/,
		run: (world) => theOneOff(world)
	},
	{
		pattern: new RegExp(`^its due date is ${P}$`),
		run: (world, dueDate) => expect(theOneOff(world).dueDate).toEqual(date(dueDate))
	},
	{
		pattern: /^the task has no due date$/,
		run: (world) => expect(theDoc(world)).not.toHaveProperty('dueDate')
	},
	{
		// Before tapping the checkbox it declares the completions; afterwards, it asserts how many remain.
		pattern: new RegExp(`^the task has ${COUNT}$`),
		run: (world, count) => {
			if (!world.checkboxTouched) return recordCompletions(world, theTask(world), count);
			expect(world.completions.filter(({ taskId }) => taskId === theTask(world).id)).toHaveLength(COMPLETIONS_COUNT[count as keyof typeof COMPLETIONS_COUNT]);
		}
	},
	{
		pattern: new RegExp(`^the task ${TITLE} has ${COUNT}$`),
		run: (world, title, count) => recordCompletions(world, theTaskTitled(world, title), count)
	},
	{
		pattern: new RegExp(`^the recorded completion is from ${P}$`),
		run: (world, completed) => expect(world.newCompletion?.completedAt).toEqual(dateHour(completed))
	}
];
