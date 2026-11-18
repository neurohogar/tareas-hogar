// Pausar y reanudar una periódica (spec §5.8, §6.2, §7): el botón del panel de
// edición actúa en el momento, sin Guardar.
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

/** Toco el botón de pausa del panel: tiene que ofrecer esa acción (§6.2). */
function tapButton(world: World, action: 'pausar' | 'reanudar', change: TaskChange, title?: string): void {
	const task = theChosen(world, title);
	expect(pauseAction(task)).toBe(action);
	rememberBeforeOfMyChange(world);
	saveChange(world, task, change);
}

const BUTTONS: Record<string, 'pausar' | 'reanudar'> = { Pausar: 'pausar', Reanudar: 'reanudar' };

function button(text: string): 'pausar' | 'reanudar' {
	const action = BUTTONS[text];
	if (!action) throw new Error(`Botón de pausa inválido: "${text}"`);
	return action;
}

export function thePanel(world: World): NonNullable<World['panel']> {
	if (!world.panel) throw new Error('El panel de edición no está abierto');
	return world.panel;
}

export const pauseSteps: StepDefinition[] = [
	{
		pattern: /^pauso la tarea$/,
		run: (world) => tapButton(world, 'pausar', pause())
	},
	{
		pattern: new RegExp(`^pauso la tarea ${TITLE}$`),
		run: (world, title) => tapButton(world, 'pausar', pause(), title)
	},
	{
		pattern: /^la tarea fue pausada$/,
		run: (world) => saveChange(world, theTask(world), pause())
	},
	{
		pattern: new RegExp(`^la tarea ${TITLE} fue pausada$`),
		run: (world, title) => saveChange(world, theTaskTitled(world, title), pause())
	},
	{
		pattern: new RegExp(`^${OTHER} pausa la tarea$`),
		run: (world) => saveChange(world, theTask(thatSawOther(world)), pause())
	},
	{
		pattern: new RegExp(`^reanudo la tarea el ${P}$`),
		run: (world, moment) => tapButton(world, 'reanudar', resume(dateHour(moment)))
	},
	{
		pattern: new RegExp(`^reanudo la tarea ${TITLE} el ${P}$`),
		run: (world, title, moment) => tapButton(world, 'reanudar', resume(dateHour(moment)), title)
	},
	{
		// §4.1: sin el campo, no está pausada.
		pattern: /^la tarea está pausada$/,
		run: (world) => expect(theDoc(world).paused).toBe(true)
	},
	{
		pattern: /^la tarea no está pausada$/,
		run: (world) => expect(theDoc(world)).not.toHaveProperty('paused')
	},
	{
		pattern: /^abro la tarea en el panel de edición$/,
		run: (world) => {
			const task = theTask(world);
			world.panel = { pause: pauseAction(task), changes: changesOnEdit(task) };
		}
	},
	{
		pattern: new RegExp(`^el panel de edición ofrece ${P}$`),
		run: (world, action) => expect(thePanel(world).pause).toBe(button(action))
	},
	{
		pattern: /^el panel de edición no ofrece pausar$/,
		run: (world) => expect(thePanel(world).pause).toBeUndefined()
	}
];
