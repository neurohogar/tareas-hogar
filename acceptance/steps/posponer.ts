// Posponer y quitar posponer (spec §5.9, §6.2, §7): el botón del panel de
// edición actúa en el momento, sin Guardar.
import { expect } from 'vitest';
import { pauseAction } from '../../src/lib/core/pause';
import { postponeAction, postponementText } from '../../src/lib/core/postponement-in-panel';
import { POSTPONE_OPTIONS, postpone, removePostpone, type PostponeOption } from '../../src/lib/core/postponement';
import type { Task } from '../../src/lib/core/task';
import { elPanel, guardarCambio } from './pausar';
import { P, TITULO, fechaHora } from './valores';
import { OTRO, cambiosAlEditar, elDocumento, laTarea, laTareaTitulada, loQueVioElOtro, recordarAntesDeMiCambio, type Guardado, type StepDefinition, type World } from './world';

function opcion(texto: string): PostponeOption {
	const elegida = POSTPONE_OPTIONS.find(({ option: opcion }) => opcion === texto);
	if (!elegida) throw new Error(`Opción de posponer inválida: "${texto}"`);
	return elegida.option;
}

const BOTONES: Record<string, 'posponer' | 'quitar' | undefined> = { Posponer: 'posponer', 'Quitar posponer': 'quitar', ninguno: undefined };

function boton(texto: string): 'posponer' | 'quitar' | undefined {
	if (!(texto in BOTONES)) throw new Error(`Botón de posponer inválido: "${texto}"`);
	return BOTONES[texto];
}

/** Toco Posponer en el panel y elijo la opción: el panel, con lo que ve quien pospone, tiene que ofrecerlo (§6.2). */
function posponerViendo(world: World, vista: Guardado, tarea: Task, elegida: string, momento: string): void {
	const ahora = fechaHora(momento);
	expect(postponeAction(tarea, vista.completions, ahora)).toBe('posponer');
	guardarCambio(world, tarea, postpone(opcion(elegida), ahora));
}

function pospongoYo(world: World, tarea: Task, elegida: string, momento: string): void {
	const vista = { ...world };
	recordarAntesDeMiCambio(world);
	posponerViendo(world, vista, tarea, elegida, momento);
}

export const posponerSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^pospongo la tarea con la opción ${P} el ${P}$`),
		run: (world, elegida, momento) => pospongoYo(world, laTarea(world), elegida, momento)
	},
	{
		pattern: new RegExp(`^la tarea fue pospuesta con la opción ${P} el ${P}$`),
		run: (world, elegida, momento) => posponerViendo(world, world, laTarea(world), elegida, momento)
	},
	{
		pattern: new RegExp(`^la tarea ${TITULO} fue pospuesta con la opción ${P} el ${P}$`),
		run: (world, titulo, elegida, momento) => posponerViendo(world, world, laTareaTitulada(world, titulo), elegida, momento)
	},
	{
		pattern: new RegExp(`^${OTRO} pospone la tarea con la opción ${P} el ${P}$`),
		run: (world, elegida, momento) => {
			const vista = loQueVioElOtro(world);
			posponerViendo(world, vista, laTarea(vista), elegida, momento);
		}
	},
	{
		// El paso no da el momento: Quitar posponer actúa sobre la posposición guardada (§6.2).
		pattern: /^quito la posposición$/,
		run: (world) => {
			expect(elDocumento(world).postponed).toBeDefined();
			recordarAntesDeMiCambio(world);
			guardarCambio(world, laTarea(world), removePostpone());
		}
	},
	{
		pattern: new RegExp(`^la tarea está pospuesta desde ${P} hasta ${P}$`),
		run: (world, desde, hasta) => expect(elDocumento(world).postponed).toEqual({ from: fechaHora(desde), to: fechaHora(hasta) })
	},
	{
		// §4.1: sin el campo, no está pospuesta.
		pattern: /^la tarea no está pospuesta$/,
		run: (world) => expect(elDocumento(world)).not.toHaveProperty('postponed')
	},
	{
		pattern: new RegExp(`^abro la tarea en el panel de edición el ${P}$`),
		run: (world, momento) => {
			const tarea = laTarea(world);
			const ahora = fechaHora(momento);
			// Una tarea no se abre antes de haber sido pospuesta: el escenario sería imposible.
			if (tarea.postponed && ahora < tarea.postponed.from) throw new Error(`El panel se abre el ${momento}, antes de que la tarea fuera pospuesta`);
			world.panel = {
				pausa: pauseAction(tarea),
				posposicion: { boton: postponeAction(tarea, world.completions, ahora), text: postponementText(tarea, ahora) },
				cambios: cambiosAlEditar(tarea, ahora)
			};
		}
	},
	{
		pattern: new RegExp(`^el botón de posponer del panel es ${P}$`),
		run: (world, texto) => expect(laPosposicion(world).boton).toBe(boton(texto))
	},
	{
		pattern: new RegExp(`^el panel de edición muestra ${P}$`),
		run: (world, texto) => expect(laPosposicion(world).text).toBe(texto)
	},
	{
		pattern: /^el panel de edición no dice que está pospuesta$/,
		run: (world) => expect(laPosposicion(world).text).toBeUndefined()
	}
];

/** Lo que el panel dice de la posposición: se abrió en un momento dado. */
function laPosposicion(world: World) {
	const { posposicion } = elPanel(world);
	if (!posposicion) throw new Error('El panel de edición se abrió sin un momento');
	return posposicion;
}
