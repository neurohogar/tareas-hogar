// Historial (spec §6.3).
import { expect } from 'vitest';
import { complete } from '../../src/lib/core/completions';
import { history, type HistoryGroup } from '../../src/lib/core/history';
import { P, TITLE, dateHour } from './values';
import { theTaskTitled, tasksOf, type StepDefinition, type World } from './world';

/** "Hoy: Pagar 10:00, Regar 08:05; Ayer: Basura 21:30": grupos con "; ", entradas con ", ". */
function inText(groups: HistoryGroup[]): string {
	return groups
		.map(({ header: heading, entries }) => `${heading}: ${entries.map(({ task, timeText: hourText }) => `${task.title} ${hourText}`).join(', ')}`)
		.join('; ');
}

function theHistoryQueried(world: World): HistoryGroup[] {
	if (!world.history) throw new Error('No se consultó el Historial');
	return world.history;
}

export const historySteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^la tarea ${TITLE} fue completada el ${P} con id ${P}$`),
		run: (world, title, moment, id) => {
			const task = theTaskTitled(world, title);
			world.completions = [...world.completions, complete(task, world.completions, id, dateHour(moment))];
		}
	},
	{
		pattern: new RegExp(`^consulto el Historial el ${P}$`),
		run: (world, now) => {
			world.history = history(tasksOf(world), world.completions, dateHour(now));
		}
	},
	{
		pattern: new RegExp(`^el Historial muestra ${P}$`),
		run: (world, expected) => expect(inText(theHistoryQueried(world))).toBe(expected)
	},
	{
		pattern: /^el Historial está vacío$/,
		run: (world) => expect(theHistoryQueried(world)).toEqual([])
	}
];
