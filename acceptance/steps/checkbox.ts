// El checkbox de la fila de Pendientes (spec §6.1): completa la tarea o borra
// su completado más reciente, según lo que decida el core.
import { expect } from 'vitest';
import { checkboxAction, checkboxEnabled } from '../../src/lib/core/checkbox';
import { isCompleted } from '../../src/lib/core/completed';
import { taskStatus } from '../../src/lib/core/task-status';
import { pendingRows } from '../../src/lib/core/pending';
import { deleteCompletion } from './undo';
import { completeMe } from './recurring-relative';
import { P, dateHour } from './values';
import { theTask, rememberBeforeOfMyChange, type StepDefinition, type World } from './world';

function tapCheckbox(world: World, moment: Date): void {
	const task = theTask(world);
	world.checkboxTouched = true;
	// Sin una consulta antes, lo que se afirma después es del momento en que se tocó.
	if (world.statusMoments.length === 0) world.statusMoments = [moment];
	const action = checkboxAction(task, world.completions, moment);
	if (action.kind === 'ninguna') return;
	if (action.kind === 'completar') return completeMe(world, moment, task);
	rememberBeforeOfMyChange(world);
	deleteCompletion(world, action.completion);
}

/** Cada momento en que se consultó el estado o Pendientes, con lo guardado ahora. */
function inEveryMomentQueried(world: World, verify: (now: Date) => void): void {
	expect(world.statusMoments.length).toBeGreaterThan(0);
	for (const now of world.statusMoments) verify(now);
}

export const checkboxSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^toco el checkbox de la tarea el ${P}$`),
		run: (world, moment) => tapCheckbox(world, dateHour(moment))
	},
	{
		pattern: /^la tarea (no )?está completada$/,
		run: (world, no) => {
			const task = theTask(world);
			inEveryMomentQueried(world, (now) =>
				expect(isCompleted(task, world.completions, now)).toBe(no === undefined)
			);
		}
	},
	{
		pattern: /^la tarea aparece en Pendientes$/,
		run: (world) =>
			inEveryMomentQueried(world, (now) =>
				expect(pendingRows([theTask(world)], world.completions, now, world.showCompleted, world.showPaused)).toHaveLength(1)
			)
	},
	{
		pattern: /^el checkbox de la tarea está (habilitado|deshabilitado)$/,
		run: (world, as) =>
			inEveryMomentQueried(world, (now) =>
				expect(checkboxEnabled(theTask(world), world.completions, now)).toBe(as === 'habilitado')
			)
	},
	{
		// §5.8: una pausada no es pendiente, atrasada ni en espera.
		pattern: /^la tarea no tiene estado$/,
		run: (world) =>
			inEveryMomentQueried(world, (now) =>
				expect(['pendiente', 'atrasada', 'en espera']).not.toContain(taskStatus(theTask(world), world.completions, now).kind)
			)
	},
	{
		pattern: /^la tarea no aparece en Pendientes$/,
		run: (world) =>
			inEveryMomentQueried(world, (now) =>
				expect(pendingRows([theTask(world)], world.completions, now, world.showCompleted, world.showPaused)).toEqual([])
			)
	}
];
