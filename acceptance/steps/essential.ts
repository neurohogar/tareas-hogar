// The essential mark (spec §4.1, §6.2): created with the Esencial check, marked or unmarked
// in an edit, and the stored field `essential`, which is only ever `true` or absent.
import { expect } from 'vitest';
import { createOneOff } from '../../src/lib/core/create-one-off';
import { createRecurringCalendar } from '../../src/lib/core/create-recurring-calendar';
import { createRecurringRelative } from '../../src/lib/core/create-recurring-relative';
import { isEssential } from '../../src/lib/core/essential';
import { taskData } from '../../src/lib/core/task-data';
import { applyChange } from '../../src/lib/core/task-document';
import type { Task } from '../../src/lib/core/task';
import { NOW, recordCreation } from './create';
import { editMe, editsOther } from './editing';
import { daysOf, shapeOf } from './recurring-calendar';
import { P, TITLE, dateHour, numeric, unit } from './values';
import { theDoc, theTask, theTaskTitled, type StepDefinition, type World } from './world';

/** The state of the Esencial check, as written in the scenario; a malformed value fails it. */
function checked(state: string): boolean {
	if (state !== 'checked' && state !== 'unchecked') throw new Error(`Invalid Esencial state: "${state}"`);
	return state === 'checked';
}

/** A creation with the check at that state is accepted: the mark is never invalid (§4.1). */
function created(world: World, create: (id: string) => ReturnType<Parameters<typeof recordCreation>[1]>): void {
	recordCreation(world, create);
	expect(world.errors).toBeUndefined();
}

/** The task already essential before any other date in the scenario: written to what is stored, not an edit of mine. */
function markEssential(world: World, task: Task): void {
	world.docs = applyChange(world.docs, task.id, { essential: true });
	expect(isEssential(theTaskTitled(world, task.title))).toBe(true);
}

const withEssential = (state: string) => (task: Task) => ({ ...taskData(task), essential: checked(state) ? (true as const) : undefined });

export const essentialSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^I create a one-off task with title ${P} and Esencial (\\S+)$`),
		run: (world, title, state) => created(world, (id) => createOneOff({ title, essential: checked(state) }, id, NOW))
	},
	{
		pattern: new RegExp(`^I create a relative recurring task with title ${P} every ${P} ${P} and Esencial (\\S+)$`),
		run: (world, title, every, u, state) =>
			created(world, (id) => createRecurringRelative({ title, every: numeric(every), unit: unit(u), essential: checked(state) }, id, NOW))
	},
	{
		pattern: new RegExp(`^I create a weekly recurring task with title ${P} on ${P} and Esencial (\\S+)$`),
		run: (world, title, days, state) =>
			created(world, (id) => createRecurringCalendar({ title, ...daysOf(shapeOf('weekly on'), days), essential: checked(state) }, id, NOW))
	},
	{
		pattern: /^the task was marked essential$/,
		run: (world) => markEssential(world, theTask(world))
	},
	{
		pattern: new RegExp(`^the task ${TITLE} was marked essential$`),
		run: (world, title) => markEssential(world, theTaskTitled(world, title))
	},
	{
		pattern: new RegExp(`^I set Esencial to (\\S+)$`),
		run: (world, state) => {
			editMe(world, withEssential(state));
			expect(world.errors).toBeUndefined();
		}
	},
	{
		pattern: new RegExp(`^another device, without seeing that change, sets Esencial to (\\S+)$`),
		run: (world, state) => {
			editsOther(world, withEssential(state));
			expect(world.errors).toBeUndefined();
		}
	},
	{
		pattern: new RegExp(`^I mark the task essential on ${P}$`),
		run: (world, moment) => {
			editMe(world, withEssential('checked'), undefined, dateHour(moment));
			expect(world.errors).toBeUndefined();
		}
	},
	{
		pattern: /^I unmark the task as essential$/,
		run: (world) => {
			editMe(world, withEssential('unchecked'));
			expect(world.errors).toBeUndefined();
		}
	},
	{
		// §4.1: it is stored as true; unchecking removes the field, it is never stored as false.
		pattern: /^the stored essential mark is (true|absent|<[A-Za-z0-9_]+>)$/,
		run: (world, mark) => {
			if (mark === 'true') expect(theDoc(world).essential).toBe(true);
			else if (mark === 'absent') expect(theDoc(world)).not.toHaveProperty('essential');
			else throw new Error(`Invalid essential mark: "${mark}"`);
		}
	}
];
