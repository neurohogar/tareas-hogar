// History (spec §6.3).
import { expect } from 'vitest';
import { complete } from '../../src/lib/core/completions';
import { history, type HistoryGroup } from '../../src/lib/core/history';
import { P, TITLE, dateHour } from './values';
import { theTaskTitled, tasksOf, type StepDefinition, type World } from './world';

/** "Hoy: Pagar 10:00, Regar 08:05; Ayer: Basura 21:30": groups joined with "; ", entries with ", ". */
function inText(groups: HistoryGroup[]): string {
	return groups
		.map(({ header: heading, entries }) => `${heading}: ${entries.map(({ task, timeText: hourText }) => `${task.title} ${hourText}`).join(', ')}`)
		.join('; ');
}

function theHistoryQueried(world: World): HistoryGroup[] {
	if (!world.history) throw new Error('The History was not queried');
	return world.history;
}

export const historySteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^the task ${TITLE} was completed on ${P} with id ${P}$`),
		run: (world, title, moment, id) => {
			const task = theTaskTitled(world, title);
			world.completions = [...world.completions, complete(task, world.completions, id, dateHour(moment))];
		}
	},
	{
		pattern: new RegExp(`^I query the Historial on ${P}$`),
		run: (world, now) => {
			world.history = history(tasksOf(world), world.completions, dateHour(now));
		}
	},
	{
		pattern: new RegExp(`^the Historial shows ${P}$`),
		run: (world, expected) => expect(inText(theHistoryQueried(world))).toBe(expected)
	},
	{
		pattern: /^the Historial is empty$/,
		run: (world) => expect(theHistoryQueried(world)).toEqual([])
	}
];
