// El texto de fecha de la fila de Pendientes («Tocaba …», «Vuelve …», spec §6.1) y el
// regreso del aviso de completar (§5.4).
import { expect } from 'vitest';
import { regresoDelAviso } from '../../src/lib/core/aviso';
import { P, TITULO } from './valores';
import { laTarea, type World, type StepDefinition } from './world';

/** El regreso que dice el aviso consultado, que tiene que verse y nombrar la tarea. */
function regresoDelCompletado(world: World): string | undefined {
	if (!world.avisoConsultado) throw new Error('No se consultó el aviso');
	const { aviso, ahora } = world.avisoConsultado;
	expect(aviso?.nombre).toBe(laTarea(world).titulo);
	return aviso && regresoDelAviso(aviso, ahora);
}

/** En cada momento consultado, la lista tiene una sola fila y su texto de fecha es `texto`. */
function laFilaMuestraElTexto(world: World, texto: string | undefined): void {
	expect(world.consultasDePendientes.length).toBeGreaterThan(0);
	for (const filas of world.consultasDePendientes) {
		expect(filas).toHaveLength(1);
		expect(filas[0].textoDeFecha).toBe(texto);
	}
}

export const textoDeFilaSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^la fila de la tarea muestra el texto ${P}$`),
		run: (world, texto) => laFilaMuestraElTexto(world, texto)
	},
	{
		pattern: new RegExp(`^la fila de ${TITULO} muestra el texto ${P}$`),
		run: (world, titulo, texto) => {
			expect(world.consultasDePendientes.length).toBeGreaterThan(0);
			for (const filas of world.consultasDePendientes) {
				const delTitulo = filas.filter((fila) => fila.titulo === titulo);
				expect(delTitulo).toHaveLength(1);
				expect(delTitulo[0].textoDeFecha).toBe(texto);
			}
		}
	},
	{
		pattern: /^la fila de la tarea no muestra texto de fecha$/,
		run: (world) => laFilaMuestraElTexto(world, undefined)
	},
	{
		pattern: new RegExp(`^el aviso del completado muestra el regreso ${P}$`),
		run: (world, regreso) => expect(regresoDelCompletado(world)).toBe(regreso)
	},
	{
		pattern: /^el aviso del completado no muestra regreso$/,
		run: (world) => expect(regresoDelCompletado(world)).toBeUndefined()
	}
];
