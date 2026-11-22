// The minimal mode (spec §5.8, §6.1, §6.2, §7): its state is a single value synced between devices;
// turning it off resumes, in one batch, the tasks it had paused.
import { expect } from 'vitest';
import { pausedByMinimalMode } from '../../src/lib/core/pause';
import { minimalModeOn, resumesOnTurningOff } from '../../src/lib/core/minimal-mode';
import { whatTheActionDoes } from '../../src/lib/core/panel-action';
import { applyChange } from '../../src/lib/core/task-document';
import { P, dateHour } from './values';
import { thePanel } from './pause';
import { minimalOn, rememberBeforeOfMyChange, tasksOf, theDoc, theTask, type StepDefinition, type World } from './world';

/** The state already set, or turned on or off from this device or another: the same value. */
function setMode(world: World, active: boolean): void {
	world.minimalMode = { active };
	expect(minimalOn(world)).toBe(active);
}

function onOrOff(value: string): boolean {
	if (value !== 'on' && value !== 'off') throw new Error(`Invalid minimal mode state: "${value}"`);
	return value === 'on';
}

/** §5.8 (Turning it off): active = false and the resume of every task it brings back, in a single batch. */
function turnOff(world: World, now: Date): void {
	rememberBeforeOfMyChange(world);
	for (const { taskId, change } of resumesOnTurningOff(tasksOf(world), now)) world.docs = applyChange(world.docs, taskId, change);
	setMode(world, false);
}

export const minimalModeSteps: StepDefinition[] = [
	{
		pattern: /^the minimal mode is (\S+)$/,
		run: (world, state) => setMode(world, onOrOff(state))
	},
	{
		pattern: /^I turn the minimal mode on$/,
		run: (world) => {
			rememberBeforeOfMyChange(world);
			setMode(world, true);
		}
	},
	{
		pattern: /^another device turns the minimal mode on$/,
		run: (world) => setMode(world, true)
	},
	{
		pattern: new RegExp(`^I turn the minimal mode off on ${P}$`),
		run: (world, moment) => turnOff(world, dateHour(moment))
	},
	{
		pattern: /^the task is (not )?paused by the minimal mode$/,
		run: (world, not) => expect(pausedByMinimalMode(theTask(world), minimalOn(world))).toBe(not === undefined)
	},
	{
		pattern: new RegExp(`^the task was resumed on ${P}$`),
		run: (world, moment) => expect(theDoc(world).resumedAt).toEqual(dateHour(moment))
	},
	{
		pattern: /^the task has no resume moment$/,
		run: (world) => expect(theDoc(world)).not.toHaveProperty('resumedAt')
	},
	{
		// §6.1: the line is shown above the list exactly while the mode is on, even with the list empty.
		pattern: /^the Modo mínimo line is (.+)$/,
		run: (world, line) => {
			if (line !== 'shown' && line !== 'not shown') throw new Error(`Invalid line state: "${line}"`);
			expect(minimalModeOn(world.minimalMode) ? 'shown' : 'not shown').toBe(line);
		}
	},
	{
		pattern: new RegExp(`^the edit panel says ${P}$`),
		run: (world, text) => expect(thePanel(world).pauseText).toBe(text)
	},
	{
		pattern: /^the edit panel says no pause text$/,
		run: (world) => expect(thePanel(world).pauseText).toBeUndefined()
	},
	{
		// §6.2: Borrar tarea stays in the panel of a task that is being edited.
		pattern: /^the edit panel offers Borrar tarea$/,
		run: (world) => {
			expect(thePanel(world).changes.taskOnOpen).toBeDefined();
			expect(whatTheActionDoes('borrar tarea', false)).toBe('asksDeleteConfirmation');
		}
	}
];
