// Emojis recientes del selector (spec §6.2): la lista que el dispositivo recuerda.
// "los emojis recientes son ..." y "hay N emojis recientes" son a la vez Given y
// Then (el despacho no ve la palabra clave). Se distinguen por si ya hubo una
// acción en el escenario (world.huboAccionSobreRecientes): antes declaran la
// lista; después la verifican. Las acciones que dependen de una lista declarada
// fallan si falta.
import { expect } from 'vitest';
import { agregarReciente } from '../../src/lib/core/emojis-recientes';
import { P, lista, numero } from './valores';
import type { StepDefinition, World } from './world';

/** Elegir un emoji en el selector lo suma a los recientes de este dispositivo. */
export function registrarEleccion(world: World, emoji: string): void {
	world.recientes = agregarReciente(world.recientes ?? [], emoji);
	world.huboAccionSobreRecientes = true;
}

function recientesDeclarados(world: World): string[] {
	if (world.recientes === undefined) throw new Error('Falta declarar los emojis recientes antes de actuar sobre ellos.');
	return world.recientes;
}

/** Emojis distintos entre sí, para llenar la lista sin nombrarlos. */
const emojisDistintos = (cantidad: number) => Array.from({ length: cantidad }, (_, i) => String.fromCodePoint(0x1f600 + i));

const NUEVO = '🧪';

function declaroOVerifico(world: World, esperados: string[]): void {
	if (world.huboAccionSobreRecientes) expect(world.recientes).toEqual(esperados);
	else world.recientes = esperados;
}

export const emojisRecientesSteps: StepDefinition[] = [
	{
		pattern: /^que no hay emojis recientes$/,
		run: (world) => void (world.recientes = [])
	},
	{
		pattern: new RegExp(`^los emojis recientes son ${P}$`),
		run: (world, recientes) => declaroOVerifico(world, lista(recientes))
	},
	{
		pattern: new RegExp(`^hay ${P} emojis recientes$`),
		run: (world, cantidad) =>
			world.huboAccionSobreRecientes
				? expect(world.recientes).toHaveLength(numero(cantidad))
				: void (world.recientes = emojisDistintos(numero(cantidad)))
	},
	{
		pattern: /^elijo un emoji que no estaba entre los recientes$/,
		run: (world) => {
			world.emojiMasViejo = recientesDeclarados(world).at(-1);
			world.emojiElegido = NUEVO;
			registrarEleccion(world, NUEVO);
			// Con el panel abierto, el emoji elegido queda en el formulario (§6.2).
			const cambios = world.panel?.cambios;
			if (cambios) cambios.formulario = { ...cambios.formulario, datos: { ...cambios.formulario.datos, emoji: NUEVO } };
		}
	},
	{
		pattern: /^el primero es el que elegí$/,
		run: (world) => expect(world.recientes?.[0]).toBe(world.emojiElegido)
	},
	{
		pattern: /^el emoji más viejo de antes ya no está$/,
		run: (world) => expect(world.recientes).not.toContain(world.emojiMasViejo)
	}
];
