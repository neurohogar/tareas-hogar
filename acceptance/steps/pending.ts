import { expect } from 'vitest';
import { pendingRows } from '../../src/lib/core/pending';
import { ANY_MOMENT } from './recurring-relative';
import { P, dateHour, list } from './values';
import { minimalOn, tasksOf, type RowQueried, type StepDefinition, type World } from './world';

/** The rows of the list, with the Mostrar completadas and Mostrar pausadas items of the menu (§6.1); a completed one-off task is never a row. */
function rowsIn(world: World, now: Date): RowQueried[] {
	const rows = pendingRows(tasksOf(world), world.completions, now, world.showCompleted, world.showPaused, minimalOn(world));
	return rows.map(({ task, completed, status, dateText, firstStepText: textOfFirstStep, stepButtons, minimal }) => ({
		title: task.title,
		completed,
		paused: status.kind === 'pausada',
		dateText,
		firstStepText: textOfFirstStep,
		stepButtons,
		minimal
	}));
}

/** At each queried moment, the titles of the rows that satisfy `included`, from top to bottom. */
function everyQueryShows(world: World, titles: string[], included = (_: RowQueried) => true): void {
	expect(world.pendingQueries.length).toBeGreaterThan(0);
	for (const rows of world.pendingQueries) expect(rows.filter(included).map(({ title }) => title)).toEqual(titles);
}

export const pendingSteps: StepDefinition[] = [
	{
		pattern: /^Mostrar completadas is on$/,
		run: (world) => {
			world.showCompleted = true;
		}
	},
	{
		pattern: /^Mostrar pausadas is on$/,
		run: (world) => {
			world.showPaused = true;
		}
	},
	{
		pattern: new RegExp(`^I query Pendientes on ${P}$`),
		run: (world, now) => {
			const moment = dateHour(now);
			world.statusMoments = [moment];
			world.pendingQueries = [rowsIn(world, moment)];
		}
	},
	{
		pattern: /^I query Pendientes at any moment$/,
		run: (world) => {
			world.pendingQueries = ANY_MOMENT.map((now) => rowsIn(world, now));
		}
	},
	{
		pattern: new RegExp(`^Pendientes shows in order ${P}$`),
		run: (world, order) => everyQueryShows(world, list(order))
	},
	{
		pattern: new RegExp(`^Pendientes shows as completed ${P}$`),
		run: (world, completedList) => everyQueryShows(world, list(completedList), ({ completed }) => completed)
	},
	{
		pattern: new RegExp(`^Pendientes shows as paused ${P}$`),
		run: (world, paused) => everyQueryShows(world, list(paused), ({ paused }) => paused)
	},
	{
		pattern: /^Pendientes shows no task$/,
		run: (world) => everyQueryShows(world, [])
	}
];
