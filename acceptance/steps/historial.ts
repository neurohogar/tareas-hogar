// Historial (spec §6.3).
import { expect } from 'vitest';
import { complete } from '../../src/lib/core/completions';
import { history, type HistoryGroup } from '../../src/lib/core/history';
import { P, TITULO, fechaHora } from './valores';
import { laTareaTitulada, tareasDe, type StepDefinition, type World } from './world';

/** "Hoy: Pagar 10:00, Regar 08:05; Ayer: Basura 21:30": grupos con "; ", entradas con ", ". */
function enTexto(grupos: HistoryGroup[]): string {
	return grupos
		.map(({ header: encabezado, entries: entradas }) => `${encabezado}: ${entradas.map(({ task: tarea, timeText: textoDeHora }) => `${tarea.title} ${textoDeHora}`).join(', ')}`)
		.join('; ');
}

function elHistorialConsultado(world: World): HistoryGroup[] {
	if (!world.historial) throw new Error('No se consultó el Historial');
	return world.historial;
}

export const historialSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^la tarea ${TITULO} fue completada el ${P} con id ${P}$`),
		run: (world, titulo, momento, id) => {
			const tarea = laTareaTitulada(world, titulo);
			world.completions = [...world.completions, complete(tarea, world.completions, id, fechaHora(momento))];
		}
	},
	{
		pattern: new RegExp(`^consulto el Historial el ${P}$`),
		run: (world, ahora) => {
			world.historial = history(tareasDe(world), world.completions, fechaHora(ahora));
		}
	},
	{
		pattern: new RegExp(`^el Historial muestra ${P}$`),
		run: (world, esperado) => expect(enTexto(elHistorialConsultado(world))).toBe(esperado)
	},
	{
		pattern: /^el Historial está vacío$/,
		run: (world) => expect(elHistorialConsultado(world)).toEqual([])
	}
];
