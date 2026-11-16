// El checkbox de la fila de Pendientes (spec §6.1): completa la tarea o borra
// su completado más reciente, según lo que decida el core.
import { expect } from 'vitest';
import { checkboxAction, checkboxEnabled } from '../../src/lib/core/checkbox';
import { isCompleted } from '../../src/lib/core/completed';
import { taskStatus } from '../../src/lib/core/task-status';
import { pendingRows } from '../../src/lib/core/pending';
import { borrarCompletado } from './deshacer';
import { completoYo } from './periodica-relativa';
import { P, fechaHora } from './valores';
import { laTarea, recordarAntesDeMiCambio, type StepDefinition, type World } from './world';

function tocarCheckbox(world: World, momento: Date): void {
	const tarea = laTarea(world);
	world.checkboxTocado = true;
	// Sin una consulta antes, lo que se afirma después es del momento en que se tocó.
	if (world.momentosDelEstado.length === 0) world.momentosDelEstado = [momento];
	const accion = checkboxAction(tarea, world.completions, momento);
	if (accion.kind === 'ninguna') return;
	if (accion.kind === 'completar') return completoYo(world, momento, tarea);
	recordarAntesDeMiCambio(world);
	borrarCompletado(world, accion.completion);
}

/** Cada momento en que se consultó el estado o Pendientes, con lo guardado ahora. */
function enCadaMomentoConsultado(world: World, verificar: (ahora: Date) => void): void {
	expect(world.momentosDelEstado.length).toBeGreaterThan(0);
	for (const ahora of world.momentosDelEstado) verificar(ahora);
}

export const checkboxSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^toco el checkbox de la tarea el ${P}$`),
		run: (world, momento) => tocarCheckbox(world, fechaHora(momento))
	},
	{
		pattern: /^la tarea (no )?está completada$/,
		run: (world, no) => {
			const tarea = laTarea(world);
			enCadaMomentoConsultado(world, (ahora) =>
				expect(isCompleted(tarea, world.completions, ahora)).toBe(no === undefined)
			);
		}
	},
	{
		pattern: /^la tarea aparece en Pendientes$/,
		run: (world) =>
			enCadaMomentoConsultado(world, (ahora) =>
				expect(pendingRows([laTarea(world)], world.completions, ahora, world.mostrarCompletadas, world.mostrarPausadas)).toHaveLength(1)
			)
	},
	{
		pattern: /^el checkbox de la tarea está (habilitado|deshabilitado)$/,
		run: (world, como) =>
			enCadaMomentoConsultado(world, (ahora) =>
				expect(checkboxEnabled(laTarea(world), world.completions, ahora)).toBe(como === 'habilitado')
			)
	},
	{
		// §5.8: una pausada no es pendiente, atrasada ni en espera.
		pattern: /^la tarea no tiene estado$/,
		run: (world) =>
			enCadaMomentoConsultado(world, (ahora) =>
				expect(['pendiente', 'atrasada', 'en espera']).not.toContain(taskStatus(laTarea(world), world.completions, ahora).kind)
			)
	},
	{
		pattern: /^la tarea no aparece en Pendientes$/,
		run: (world) =>
			enCadaMomentoConsultado(world, (ahora) =>
				expect(pendingRows([laTarea(world)], world.completions, ahora, world.mostrarCompletadas, world.mostrarPausadas)).toEqual([])
			)
	}
];
