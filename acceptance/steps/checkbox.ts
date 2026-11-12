// El checkbox de la fila de Pendientes (spec §6.1): completa la tarea o borra
// su completado más reciente, según lo que decida el core.
import { expect } from 'vitest';
import { accionDelCheckbox, checkboxHabilitado } from '../../src/lib/core/checkbox';
import { estaCompletada } from '../../src/lib/core/completada';
import { estadoDeTarea } from '../../src/lib/core/estado-de-tarea';
import { filasDePendientes } from '../../src/lib/core/pendientes';
import { completoYo } from './periodica-relativa';
import { P, fechaHora } from './valores';
import { borrarGuardado, laTarea, recordarAntesDeMiCambio, type StepDefinition, type World } from './world';

function tocarCheckbox(world: World, momento: Date): void {
	const tarea = laTarea(world);
	world.checkboxTocado = true;
	// Sin una consulta antes, lo que se afirma después es del momento en que se tocó.
	if (world.momentosDelEstado.length === 0) world.momentosDelEstado = [momento];
	const accion = accionDelCheckbox(tarea, world.completados, momento);
	if (accion.tipo === 'ninguna') return;
	if (accion.tipo === 'completar') return completoYo(world, momento, tarea);
	recordarAntesDeMiCambio(world);
	borrarGuardado(world, [], [accion.completado.id]);
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
				expect(estaCompletada(tarea, world.completados, ahora)).toBe(no === undefined)
			);
		}
	},
	{
		pattern: /^la tarea aparece en Pendientes$/,
		run: (world) =>
			enCadaMomentoConsultado(world, (ahora) =>
				expect(filasDePendientes([laTarea(world)], world.completados, ahora, world.mostrarCompletadas, world.mostrarPausadas)).toHaveLength(1)
			)
	},
	{
		pattern: /^el checkbox de la tarea está (habilitado|deshabilitado)$/,
		run: (world, como) =>
			enCadaMomentoConsultado(world, (ahora) =>
				expect(checkboxHabilitado(laTarea(world), world.completados, ahora)).toBe(como === 'habilitado')
			)
	},
	{
		// §5.8: una pausada no es pendiente, atrasada ni en espera.
		pattern: /^la tarea no tiene estado$/,
		run: (world) =>
			enCadaMomentoConsultado(world, (ahora) =>
				expect(['pendiente', 'atrasada', 'en espera']).not.toContain(estadoDeTarea(laTarea(world), world.completados, ahora).tipo)
			)
	},
	{
		pattern: /^la tarea no aparece en Pendientes$/,
		run: (world) =>
			enCadaMomentoConsultado(world, (ahora) =>
				expect(filasDePendientes([laTarea(world)], world.completados, ahora, world.mostrarCompletadas, world.mostrarPausadas)).toEqual([])
			)
	}
];
