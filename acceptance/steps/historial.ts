// Historial (spec §6.3).
import { expect } from 'vitest';
import { completar } from '../../src/lib/core/completados';
import { historial, type GrupoDelHistorial } from '../../src/lib/core/historial';
import { P, TITULO, fechaHora } from './valores';
import { laTareaTitulada, tareasDe, type StepDefinition, type World } from './world';

/** "Hoy: Pagar 10:00, Regar 08:05; Ayer: Basura 21:30": grupos con "; ", entradas con ", ". */
function enTexto(grupos: GrupoDelHistorial[]): string {
	return grupos
		.map(({ encabezado, entradas }) => `${encabezado}: ${entradas.map(({ tarea, hora }) => `${tarea.titulo} ${hora}`).join(', ')}`)
		.join('; ');
}

function elHistorialConsultado(world: World): GrupoDelHistorial[] {
	if (!world.historial) throw new Error('No se consultó el Historial');
	return world.historial;
}

export const historialSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^la tarea ${TITULO} fue completada el ${P} con id ${P}$`),
		run: (world, titulo, momento, id) => {
			const tarea = laTareaTitulada(world, titulo);
			world.completados = [...world.completados, completar(tarea, world.completados, id, fechaHora(momento))];
		}
	},
	{
		pattern: new RegExp(`^consulto el Historial el ${P}$`),
		run: (world, ahora) => {
			world.historial = historial(tareasDe(world), world.completados, fechaHora(ahora));
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
