import { expect } from 'vitest';
import { effortText } from '../../src/lib/core/effort';
import { filterByLabel, activeFilter } from '../../src/lib/core/label-filter';
import { pendingRows } from '../../src/lib/core/pending';
import { filterQuickOnly, emptyListText } from '../../src/lib/core/quick-only';
import { CUALQUIER_MOMENTO } from './periodica-relativa';
import { P, fechaHora, lista } from './valores';
import { tareasDe, type FilaConsultada, type StepDefinition, type World } from './world';

/** Las filas de la lista, con el filtro por etiqueta elegido, Solo rápidas y los checks Mostrar completadas y Mostrar pausadas (§6.1). */
function filasEn(world: World, ahora: Date): FilaConsultada[] {
	const filas = pendingRows(tareasDe(world), world.completions, ahora, world.mostrarCompletadas, world.mostrarPausadas);
	const porEtiqueta = filterByLabel(filas, activeFilter(world.filtro, world.labels));
	return filterQuickOnly(porEtiqueta, world.soloRapidas === true).map(({ task: tarea, completed: completada, status: estado, dateText: textoDeFecha, firstStepText: textoDePrimerPaso, stepButtons: botonesDePaso, minimal: minima }) => ({
		title: tarea.title,
		completed: completada,
		paused: estado.kind === 'pausada',
		effort: effortText(tarea.effort),
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

/** En cada momento consultado, la lista tiene una sola fila y muestra ese texto de esfuerzo. */
function laFilaMuestraElEsfuerzo(world: World, texto: string | undefined): void {
	expect(world.consultasDePendientes.length).toBeGreaterThan(0);
	for (const filas of world.consultasDePendientes) expect(filas.map(({ effort: esfuerzo }) => esfuerzo)).toEqual([texto]);
}

const ESTADOS_DEL_BOTON: Record<string, boolean> = { encendido: true, apagado: false };

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
		pattern: new RegExp(`^Solo rápidas está ${P}$`),
		run: (world, estado) => {
			if (!Object.hasOwn(ESTADOS_DEL_BOTON, estado)) throw new Error(`Estado inválido: "${estado}"`);
			world.soloRapidas = ESTADOS_DEL_BOTON[estado];
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
	},
	{
		// El texto de lista vacía: solo se ve si la lista no tiene filas.
		pattern: new RegExp(`^Pendientes muestra el texto ${P}$`),
		run: (world, texto) => {
			cadaConsultaMuestra(world, []);
			expect(emptyListText(activeFilter(world.filtro, world.labels), world.soloRapidas === true)).toBe(texto);
		}
	},
	{
		pattern: new RegExp(`^la fila de la tarea muestra el esfuerzo ${P}$`),
		run: (world, texto) => laFilaMuestraElEsfuerzo(world, texto)
	},
	{
		pattern: /^la fila de la tarea no muestra esfuerzo$/,
		run: (world) => laFilaMuestraElEsfuerzo(world, undefined)
	}
];
