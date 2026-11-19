// Pause and resume a recurring task (spec §5.8, §6.2, §7): the button of the edit
// panel acts immediately, without Guardar.
import { expect } from 'vitest';
import { applyChange, type TaskChange } from '../../src/lib/core/task-document';
import { pauseAction, pause, resume } from '../../src/lib/core/pause';
import type { Task } from '../../src/lib/core/task';
import { P, TITLE, dateHour } from './values';
import { OTHER, changesOnEdit, theDoc, theTask, theTaskTitled, thatSawOther, rememberBeforeOfMyChange, type StepDefinition, type World } from './world';

const theChosen = (world: World, title?: string) => (title === undefined ? theTask(world) : theTaskTitled(world, title));

export function saveChange(world: World, task: Task, change: TaskChange): void {
	world.docs = applyChange(world.docs, task.id, change);
}

/** I tap the pause button of the panel: it has to offer that action (§6.2). */
function tapButton(world: World, action: 'pausar' | 'reanudar', change: TaskChange, title?: string): void {
	const task = theChosen(world, title);
	expect(pauseAction(task)).toBe(action);
	rememberBeforeOfMyChange(world);
	saveChange(world, task, change);
}

const BUTTONS: Record<string, 'pausar' | 'reanudar'> = { Pausar: 'pausar', Reanudar: 'reanudar' };

function button(text: string): 'pausar' | 'reanudar' {
	const action = BUTTONS[text];
	if (!action) throw new Error(`Invalid pause button: "${text}"`);
	return action;
}

export function thePanel(world: World): NonNullable<World['panel']> {
	if (!world.panel) throw new Error('The edit panel is not open');
	return world.panel;
}

export const pauseSteps: StepDefinition[] = [
	{
		pattern: /^I pause the task$/,
		run: (world) => tapButton(world, 'pausar', pause())
	},
	{
		pattern: new RegExp(`^I pause the task ${TITLE}$`),
		run: (world, title) => tapButton(world, 'pausar', pause(), title)
	},
	{
		pattern: /^the task was paused$/,
		run: (world) => saveChange(world, theTask(world), pause())
	},
	{
		pattern: new RegExp(`^the task ${TITLE} was paused$`),
		run: (world, title) => saveChange(world, theTaskTitled(world, title), pause())
	},
	{
		pattern: new RegExp(`^${OTHER} pauses the task$`),
		run: (world) => saveChange(world, theTask(thatSawOther(world)), pause())
	},
	{
		pattern: new RegExp(`^I resume the task on ${P}$`),
		run: (world, moment) => tapButton(world, 'reanudar', resume(dateHour(moment)))
	},
	{
		pattern: new RegExp(`^I resume the task ${TITLE} on ${P}$`),
		run: (world, title, moment) => tapButton(world, 'reanudar', resume(dateHour(moment)), title)
	},
	{
		// §4.1: without the field, it is not paused.
		pattern: /^the task is paused$/,
		run: (world) => expect(theDoc(world).paused).toBe(true)
	},
	{
		pattern: /^the task is not paused$/,
		run: (world) => expect(theDoc(world)).not.toHaveProperty('paused')
	},
	{
		pattern: /^I open the task in the edit panel$/,
		run: (world) => {
			const task = theTask(world);
			world.panel = { pause: pauseAction(task), changes: changesOnEdit(task) };
		}
	},
	{
		pattern: new RegExp(`^the edit panel offers ${P}$`),
		run: (world, action) => expect(thePanel(world).pause).toBe(button(action))
	},
	{
		pattern: /^the edit panel does not offer pause$/,
		run: (world) => expect(thePanel(world).pause).toBeUndefined()
	}
];
