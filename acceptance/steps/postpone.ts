// Postpone and remove postponement (spec §5.9, §6.2, §7): the button of the edit
// panel acts immediately, without Guardar.
import { expect } from 'vitest';
import { pauseAction } from '../../src/lib/core/pause';
import { postponeAction, postponementText } from '../../src/lib/core/postponement-in-panel';
import { POSTPONE_OPTIONS, postpone, removePostpone, type PostponeOption } from '../../src/lib/core/postponement';
import type { Task } from '../../src/lib/core/task';
import { thePanel, saveChange } from './pause';
import { P, TITLE, dateHour } from './values';
import { OTHER, changesOnEdit, theDoc, theTask, theTaskTitled, thatSawOther, rememberBeforeOfMyChange, type Saved, type StepDefinition, type World } from './world';

function option(text: string): PostponeOption {
	const chosen = POSTPONE_OPTIONS.find(({ option }) => option === text);
	if (!chosen) throw new Error(`Invalid postpone option: "${text}"`);
	return chosen.option;
}

const BUTTONS: Record<string, 'posponer' | 'quitar' | undefined> = { Posponer: 'posponer', 'Quitar posponer': 'quitar', ninguno: undefined };

function button(text: string): 'posponer' | 'quitar' | undefined {
	if (!(text in BUTTONS)) throw new Error(`Invalid postpone button: "${text}"`);
	return BUTTONS[text];
}

/** I tap Posponer in the panel and pick the option: the panel, with what the person postponing sees, has to offer it (§6.2). */
function postponeViewing(world: World, view: Saved, task: Task, chosen: string, moment: string): void {
	const now = dateHour(moment);
	expect(postponeAction(task, view.completions, now)).toBe('posponer');
	saveChange(world, task, postpone(option(chosen), now));
}

function postponeMe(world: World, task: Task, chosen: string, moment: string): void {
	const view = { ...world };
	rememberBeforeOfMyChange(world);
	postponeViewing(world, view, task, chosen, moment);
}

export const postponeSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^pospongo la tarea con la opción ${P} el ${P}$`),
		run: (world, chosen, moment) => postponeMe(world, theTask(world), chosen, moment)
	},
	{
		pattern: new RegExp(`^la tarea fue pospuesta con la opción ${P} el ${P}$`),
		run: (world, chosen, moment) => postponeViewing(world, world, theTask(world), chosen, moment)
	},
	{
		pattern: new RegExp(`^la tarea ${TITLE} fue pospuesta con la opción ${P} el ${P}$`),
		run: (world, title, chosen, moment) => postponeViewing(world, world, theTaskTitled(world, title), chosen, moment)
	},
	{
		pattern: new RegExp(`^${OTHER} pospone la tarea con la opción ${P} el ${P}$`),
		run: (world, chosen, moment) => {
			const view = thatSawOther(world);
			postponeViewing(world, view, theTask(view), chosen, moment);
		}
	},
	{
		// The step does not give the moment: Quitar posponer acts on the saved postponement (§6.2).
		pattern: /^quito la posposición$/,
		run: (world) => {
			expect(theDoc(world).postponed).toBeDefined();
			rememberBeforeOfMyChange(world);
			saveChange(world, theTask(world), removePostpone());
		}
	},
	{
		pattern: new RegExp(`^la tarea está pospuesta desde ${P} hasta ${P}$`),
		run: (world, from, to) => expect(theDoc(world).postponed).toEqual({ from: dateHour(from), to: dateHour(to) })
	},
	{
		// §4.1: without the field, it is not postponed.
		pattern: /^la tarea no está pospuesta$/,
		run: (world) => expect(theDoc(world)).not.toHaveProperty('postponed')
	},
	{
		pattern: new RegExp(`^abro la tarea en el panel de edición el ${P}$`),
		run: (world, moment) => {
			const task = theTask(world);
			const now = dateHour(moment);
			// A task is not opened before having been postponed: the scenario would be impossible.
			if (task.postponed && now < task.postponed.from) throw new Error(`The panel opens on ${moment}, before the task was postponed`);
			world.panel = {
				pause: pauseAction(task),
				postponement: { button: postponeAction(task, world.completions, now), text: postponementText(task, now) },
				changes: changesOnEdit(task, now)
			};
		}
	},
	{
		pattern: new RegExp(`^el botón de posponer del panel es ${P}$`),
		run: (world, text) => expect(thePostponement(world).button).toBe(button(text))
	},
	{
		pattern: new RegExp(`^el panel de edición muestra ${P}$`),
		run: (world, text) => expect(thePostponement(world).text).toBe(text)
	},
	{
		pattern: /^el panel de edición no dice que está pospuesta$/,
		run: (world) => expect(thePostponement(world).text).toBeUndefined()
	}
];

/** What the panel says about the postponement: it was opened at a given moment. */
function thePostponement(world: World) {
	const { postponement } = thePanel(world);
	if (!postponement) throw new Error('The edit panel was opened without a moment');
	return postponement;
}
