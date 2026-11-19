import { expect } from 'vitest';
import { completionsOfTask } from '../../src/lib/core/completions';
import type { CreationResult } from '../../src/lib/core/creation';
import {
	createRecurringRelative,
	type RecurringRelativeData
} from '../../src/lib/core/create-recurring-relative';
import { P, numeric, unit } from './values';
import { theTask, theTaskOfKind, newId, type StepDefinition, type World } from './world';

export const TITLE_VALID = 'Regar plantas';
const EVERY_VALID = 2;

/** Creation moment when the scenario does not give one. */
export const NOW = new Date(2026, 6, 15, 8, 0, 0);

/**
 * Creation moment of the tasks with a title when the scenario does not give one:
 * the same for all of them and earlier than any other date in the scenario.
 */
export const SCENARIO_BEFORE = new Date(2000, 0, 1, 0, 0, 0);

export function recordCreation(world: World, create: (id: string) => CreationResult): void {
	const result = create(newId(world, 'tarea'));
	if (result.ok) world.docs = [...world.docs, result.task];
	else world.errors = result.errors;
}

export function createInWorld(world: World, data: RecurringRelativeData, now = NOW): void {
	recordCreation(world, (id) => createRecurringRelative(data, id, now));
}

const REASONS = {
	'empty title': { title: 'vacio' },
	'invalid interval': { every: 'invalido' },
	'missing days': { days: 'faltan' },
	'invalid month day': { days: 'diaDelMesInvalido' },
	'weekly and monthly combined': { days: 'combinados' },
	'invalid due date': { dueDate: 'invalida' },
	'invalid emoji': { emoji: 'invalido' },
	'incomplete schedule': { schedule: 'incomplete' },
	'overlapping schedules': { schedule: 'overlapping' },
	'several schedules in an hourly relative': { schedule: 'severalInHours' }
};

const KINDS = { recurring: 'periodica', 'one-off': 'puntual' };

export const createSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^I create a relative recurring task with title ${P} every ${P} ${P}$`),
		run: (world, title, every, u) => createInWorld(world, { title, every: numeric(every), unit: unit(u) })
	},
	{
		pattern: new RegExp(`^I create a relative recurring task with title ${P} and a valid interval$`),
		run: (world, title) => createInWorld(world, { title, every: EVERY_VALID, unit: 'dias' })
	},
	{
		pattern: /^I create a relative recurring task with a title of only spaces and a valid interval$/,
		run: (world) => createInWorld(world, { title: '   ', every: EVERY_VALID, unit: 'dias' })
	},
	{
		pattern: new RegExp(
			`^I create a relative recurring task with a valid title and ${P} as the interval amount$`
		),
		run: (world, every) => createInWorld(world, { title: TITLE_VALID, every: numeric(every), unit: 'dias' })
	},
	{
		pattern: new RegExp(`^a (${Object.keys(KINDS).join('|')}) task is created with title ${P}$`),
		run: (world, kind, title) => {
			const task = theTask(world);
			expect(task.kind).toBe(KINDS[kind as keyof typeof KINDS]);
			expect(task.title).toBe(title);
		}
	},
	{
		pattern: new RegExp(`^its recurrence is relative every ${P} ${P}$`),
		run: (world, every, u) => {
			expect(theTaskOfKind(world, 'periodica').recurrence).toEqual({ mode: 'relativo', every: numeric(every), unit: unit(u) });
		}
	},
	{
		pattern: /^the task has no completions$/,
		run: (world) => expect(completionsOfTask(world.completions, theTask(world).id)).toEqual([])
	},
	{
		pattern: new RegExp(`^(?:creation|editing) is rejected for (${Object.keys(REASONS).join('|')})$`),
		run: (world, reason) => expect(world.errors).toEqual(REASONS[reason as keyof typeof REASONS])
	},
	{
		pattern: /^no task is created$/,
		run: (world) => expect(world.docs).toEqual([])
	}
];
