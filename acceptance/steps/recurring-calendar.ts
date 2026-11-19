import { expect } from 'vitest';
import {
	createRecurringCalendar,
	type RecurringCalendarData
} from '../../src/lib/core/create-recurring-calendar';
import type { Completion, CoveredOccurrence, Task } from '../../src/lib/core/task';
import { NOW, SCENARIO_BEFORE, TITLE_VALID, recordCreation } from './create';
import { P, TITLE, monthDays, weekdays, date, dateHour, occurrence } from './values';
import { theTask, theTaskOfKind, theTaskTitled, newId, type StepDefinition, type World } from './world';

export type Shape = 'weekly' | 'monthly';

/** How the days of each form are named: "on Tuesday" or "on days 10". */
const CONNECTOR: Record<Shape, string> = { weekly: 'on', monthly: 'on days' };
export const SHAPE_AND_DAYS = `(weekly|monthly) (on|on days) ${P}`;
/** "weekly recurring task Basura on martes": the title goes between the task and the connector. */
export const SHAPE_RECURRING_AND_DAYS = `(weekly|monthly) recurring (on|on days) ${P}`;
const SHAPE_TASK_AND_DAYS = `(weekly|monthly) recurring task (on|on days) ${P}`;
const SHAPE_TASK_TITLE_AND_DAYS = `(weekly|monthly) recurring task ${TITLE} (on|on days) ${P}`;

export const DAYS_VALID: Record<Shape, Pick<RecurringCalendarData, 'weekdays' | 'monthDays'>> = {
	weekly: { weekdays: ['martes'], monthDays: [] },
	monthly: { weekdays: [], monthDays: [15] }
};
export const WITHOUT_DAYS = { weekdays: [], monthDays: [] };

export function daysOf(shape: Shape, days: string): Pick<RecurringCalendarData, 'weekdays' | 'monthDays'> {
	return shape === 'weekly' ? { weekdays: weekdays(days), monthDays: [] } : { weekdays: [], monthDays: monthDays(days) };
}

/** "weekly on" or "monthly on days": the shape, validating that the connector corresponds to it. */
export function shapeOf(shapeAndConnector: string): Shape {
	const [shape] = shapeAndConnector.split(' ') as [Shape];
	if (`${shape} ${CONNECTOR[shape]}` !== shapeAndConnector) throw new Error(`Invalid shape: "${shapeAndConnector}"`);
	return shape;
}

function create(world: World, data: RecurringCalendarData, now = NOW): void {
	recordCreation(world, (id) => createRecurringCalendar(data, id, now));
}

/** Completion already saved (for example, synced), with its coveredOccurrence as is. */
function addCompletion(world: World, completedAt: Date, occurrenceCovered: CoveredOccurrence, task: Task = theTask(world)): void {
	const completion: Completion = {
		id: newId(world, 'completado'),
		taskId: task.id,
		completedAt,
		coveredOccurrence: occurrenceCovered
	};
	world.completions = [...world.completions, completion];
}

const DAY_MS = 86_400_000;

function theLastCompletion(world: World): Completion {
	const last = world.completions.at(-1);
	if (!last) throw new Error('The task has no completions');
	return last;
}

export const recurringCalendarSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^I create a (weekly|monthly) recurring task with title ${P} (on|on days) ${P}$`),
		run: (world, shape, title, connector, days) => {
			const theShape = shapeOf(`${shape} ${connector}`);
			create(world, { title, ...daysOf(theShape, days) });
		}
	},
	{
		pattern: new RegExp(`^I create a (weekly|monthly) recurring task with title ${P} and valid days$`),
		run: (world, shape, title) => create(world, { title, ...DAYS_VALID[shape as Shape] })
	},
	{
		pattern: /^I create a (weekly|monthly) recurring task with a title of only spaces and valid days$/,
		run: (world, shape) => create(world, { title: '   ', ...DAYS_VALID[shape as Shape] })
	},
	{
		pattern: /^I create a (weekly|monthly) recurring task with a valid title and without days$/,
		run: (world) => create(world, { title: TITLE_VALID, ...WITHOUT_DAYS })
	},
	{
		pattern: new RegExp(`^I create a monthly recurring task with a valid title on days ${P}$`),
		run: (world, days) => create(world, { title: TITLE_VALID, ...daysOf('monthly', days) })
	},
	{
		pattern:
			/^I create a calendar recurring task with a valid title and weekdays and month days at once$/,
		run: (world) =>
			create(world, {
				title: TITLE_VALID,
				weekdays: DAYS_VALID.weekly.weekdays,
				monthDays: DAYS_VALID.monthly.monthDays
			})
	},
	{
		pattern: new RegExp(`^its recurrence is ${SHAPE_AND_DAYS}$`),
		run: (world, shapeWord, connector, days) => {
			const shape = shapeOf(`${shapeWord} ${connector}`);
			const { weekdays: week, monthDays: month } = daysOf(shape, days);
			const expected = shape === 'weekly' ? { weekdays: week } : { monthDays: month };
			expect(theTaskOfKind(world, 'periodica').recurrence).toStrictEqual({ mode: 'calendario', ...expected });
		}
	},
	{
		pattern: new RegExp(`^a ${SHAPE_TASK_AND_DAYS} created on ${P}$`),
		run: (world, shape, connector, days, created) =>
			create(world, { title: 'Tarea', ...daysOf(shapeOf(`${shape} ${connector}`), days) }, dateHour(created))
	},
	{
		pattern: new RegExp(`^a ${SHAPE_TASK_AND_DAYS}$`),
		run: (world, shape, connector, days) => create(world, { title: 'Tarea', ...daysOf(shapeOf(`${shape} ${connector}`), days) })
	},
	{
		pattern: new RegExp(`^a ${SHAPE_TASK_TITLE_AND_DAYS}$`),
		run: (world, shape, title, connector, days) =>
			create(world, { title, ...daysOf(shapeOf(`${shape} ${connector}`), days) }, SCENARIO_BEFORE)
	},
	{
		pattern: new RegExp(`^a ${SHAPE_TASK_TITLE_AND_DAYS} created on ${P}$`),
		run: (world, shape, title, connector, days, created) =>
			create(world, { title, ...daysOf(shapeOf(`${shape} ${connector}`), days) }, dateHour(created))
	},
	{
		pattern: new RegExp(`^the task ${TITLE} has a completion that covers ${P}$`),
		run: (world, title, covered) =>
			addCompletion(world, date(covered), date(covered), theTaskTitled(world, title))
	},
	{
		pattern: new RegExp(`^the task ${TITLE} has a completion from ${P} that covers ${P}$`),
		run: (world, title, completed, covered) =>
			addCompletion(world, dateHour(completed), occurrence(covered), theTaskTitled(world, title))
	},
	{
		pattern: new RegExp(`^the task has a completion from ${P} that covers ${P}$`),
		run: (world, completed, covered) => addCompletion(world, dateHour(completed), occurrence(covered))
	},
	{
		// The moment does not influence the result: the start of the covered day is used.
		pattern: new RegExp(`^the task has a completion that covers ${P}$`),
		run: (world, covered) => addCompletion(world, date(covered), date(covered))
	},
	{
		pattern: /^the task has another older completion that covers the same occurrence$/,
		run: (world) => {
			const last = theLastCompletion(world);
			if (!last.coveredOccurrence) throw new Error('The last completion does not cover any occurrence');
			addCompletion(world, new Date(last.completedAt.getTime() - DAY_MS), last.coveredOccurrence);
		}
	},
	{
		pattern: new RegExp(`^a completion was recorded that covers ${P}$`),
		run: (world, covered) => {
			const { wasMinimal, ...rest } = world.newCompletion ?? {};
			expect(rest).toStrictEqual({
				id: expect.any(String),
				taskId: theTask(world).id,
				completedAt: world.momentOfNewCompletion,
				coveredOccurrence: occurrence(covered)
			});
			// That it was the minimal one (§4.4) is asserted by the minimal-version steps; it is only ever written as true.
			if (wasMinimal !== undefined) expect(wasMinimal).toBe(true);
		}
	}
];
