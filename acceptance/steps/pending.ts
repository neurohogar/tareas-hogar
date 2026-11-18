import { expect } from 'vitest';
import { pendingRows } from '../../src/lib/core/pending';
import { CUALQUIER_MOMENTO } from './recurring-relative';
import { P, fechaHora, lista } from './values';
import { tareasDe, type FilaConsultada, type StepDefinition, type World } from './world';

/** Las filas de la lista, con los checks Mostrar completadas y Mostrar pausadas (§6.1). */
function filasEn(world: World, ahora: Date): FilaConsultada[] {
	const filas = pendingRows(tareasDe(world), world.completions, ahora, world.mostrarCompletadas, world.mostrarPausadas);
	return filas.map(({ task: tarea, completed: completada, status: estado, dateText: textoDeFecha, firstStepText: textoDePrimerPaso, stepButtons: botonesDePaso, minimal: minima }) => ({
		title: tarea.title,
		completed: completada,
		paused: estado.kind === 'pausada',
		dateText: textoDeFecha,
		firstStepText: textoDePrimerPaso,
		stepButtons: botonesDePaso,
		minimal: minima
	}));
}

/** En cada momento consultado, los títulos de las filas que cumplen `incluida`, de arriba hacia abajo. */
function cadaConsultaMuestra(world: World, titulos: string[], incluida = (_: FilaConsultada) => true): void {
	expect(world.consultasDePendientes.length).toBeGreaterThan(0);
	for (const filas of world.consultasDePendientes) expect(filas.filter(incluida).map(({ title: titulo }) => titulo)).toEqual(titulos);
}

export const pendientesSteps: StepDefinition[] = [
	{
		pattern: /^Mostrar completadas está encendido$/,
		run: (world) => {
			world.mostrarCompletadas = true;
		}
	},
	{
		pattern: /^Mostrar pausadas está encendido$/,
		run: (world) => {
			world.mostrarPausadas = true;
		}
	},
	{
		pattern: new RegExp(`^consulto Pendientes el ${P}$`),
		run: (world, ahora) => {
			const momento = fechaHora(ahora);
			world.momentosDelEstado = [momento];
			world.consultasDePendientes = [filasEn(world, momento)];
		}
	},
	{
		pattern: /^consulto Pendientes en cualquier momento$/,
		run: (world) => {
			world.consultasDePendientes = CUALQUIER_MOMENTO.map((ahora) => filasEn(world, ahora));
		}
	},
	{
		pattern: new RegExp(`^Pendientes muestra en orden ${P}$`),
		run: (world, orden) => cadaConsultaMuestra(world, lista(orden))
	},
	{
		pattern: new RegExp(`^Pendientes muestra como completadas ${P}$`),
		run: (world, completadas) => cadaConsultaMuestra(world, lista(completadas), ({ completed: completada }) => completada)
	},
	{
		pattern: new RegExp(`^Pendientes muestra como pausadas ${P}$`),
		run: (world, pausadas) => cadaConsultaMuestra(world, lista(pausadas), ({ paused: pausada }) => pausada)
	},
	{
		pattern: /^Pendientes no muestra ninguna tarea$/,
		run: (world) => cadaConsultaMuestra(world, [])
	}
];
