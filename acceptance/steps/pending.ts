import { expect } from 'vitest';
import { pendingRows } from '../../src/lib/core/pending';
import { ANY_MOMENT } from './recurring-relative';
import { P, dateHour, list } from './values';
import { tasksOf, type RowQueried, type StepDefinition, type World } from './world';

/** Las filas de la lista, con los checks Mostrar completadas y Mostrar pausadas (§6.1). */
function rowsIn(world: World, now: Date): RowQueried[] {
	const rows = pendingRows(tasksOf(world), world.completions, now, world.showCompleted, world.showPaused);
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

/** En cada momento consultado, los títulos de las filas que cumplen `incluida`, de arriba hacia abajo. */
function everyQueryShows(world: World, titles: string[], included = (_: RowQueried) => true): void {
	expect(world.pendingQueries.length).toBeGreaterThan(0);
	for (const rows of world.pendingQueries) expect(rows.filter(included).map(({ title }) => title)).toEqual(titles);
}

export const pendingSteps: StepDefinition[] = [
	{
		pattern: /^Mostrar completadas está encendido$/,
		run: (world) => {
			world.showCompleted = true;
		}
	},
	{
		pattern: /^Mostrar pausadas está encendido$/,
		run: (world) => {
			world.showPaused = true;
		}
	},
	{
		pattern: new RegExp(`^consulto Pendientes el ${P}$`),
		run: (world, now) => {
			const moment = dateHour(now);
			world.statusMoments = [moment];
			world.pendingQueries = [rowsIn(world, moment)];
		}
	},
	{
		pattern: /^consulto Pendientes en cualquier momento$/,
		run: (world) => {
			world.pendingQueries = ANY_MOMENT.map((now) => rowsIn(world, now));
		}
	},
	{
		pattern: new RegExp(`^Pendientes muestra en orden ${P}$`),
		run: (world, order) => everyQueryShows(world, list(order))
	},
	{
		pattern: new RegExp(`^Pendientes muestra como completadas ${P}$`),
		run: (world, completedList) => everyQueryShows(world, list(completedList), ({ completed }) => completed)
	},
	{
		pattern: new RegExp(`^Pendientes muestra como pausadas ${P}$`),
		run: (world, paused) => everyQueryShows(world, list(paused), ({ paused }) => paused)
	},
	{
		pattern: /^Pendientes no muestra ninguna tarea$/,
		run: (world) => everyQueryShows(world, [])
	}
];
