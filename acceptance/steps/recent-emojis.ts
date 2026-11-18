// Emojis recientes del selector (spec §6.2): la lista que el dispositivo recuerda.
// "los emojis recientes son ..." y "hay N emojis recientes" son a la vez Given y
// Then (el despacho no ve la palabra clave). Se distinguen por si ya hubo una
// acción en el escenario (world.huboAccionSobreRecientes): antes declaran la
// lista; después la verifican. Las acciones que dependen de una lista declarada
// fallan si falta.
import { expect } from 'vitest';
import { addRecent } from '../../src/lib/core/recent-emojis';
import { P, list, numeric } from './values';
import type { StepDefinition, World } from './world';

/** Elegir un emoji en el selector lo suma a los recientes de este dispositivo. */
export function recordChoice(world: World, emoji: string): void {
	world.recent = addRecent(world.recent ?? [], emoji);
	world.wasActionOnRecent = true;
}

function recentDeclared(world: World): string[] {
	if (world.recent === undefined) throw new Error('Falta declarar los emojis recientes antes de actuar sobre ellos.');
	return world.recent;
}

/** Emojis distintos entre sí, para llenar la lista sin nombrarlos. */
const emojisDistinct = (count: number) => Array.from({ length: count }, (_, i) => String.fromCodePoint(0x1f600 + i));

const NEW = '🧪';

function declareOVerify(world: World, expected: string[]): void {
	if (world.wasActionOnRecent) expect(world.recent).toEqual(expected);
	else world.recent = expected;
}

export const recentEmojisSteps: StepDefinition[] = [
	{
		pattern: /^que no hay emojis recientes$/,
		run: (world) => void (world.recent = [])
	},
	{
		pattern: new RegExp(`^los emojis recientes son ${P}$`),
		run: (world, recent) => declareOVerify(world, list(recent))
	},
	{
		pattern: new RegExp(`^hay ${P} emojis recientes$`),
		run: (world, count) =>
			world.wasActionOnRecent
				? expect(world.recent).toHaveLength(numeric(count))
				: void (world.recent = emojisDistinct(numeric(count)))
	},
	{
		pattern: /^elijo un emoji que no estaba entre los recientes$/,
		run: (world) => {
			world.emojiMoreOld = recentDeclared(world).at(-1);
			world.emojiChosen = NEW;
			recordChoice(world, NEW);
			// Con el panel abierto, el emoji elegido queda en el formulario (§6.2).
			const changes = world.panel?.changes;
			if (changes) changes.form = { ...changes.form, data: { ...changes.form.data, emoji: NEW } };
		}
	},
	{
		pattern: /^el primero es el que elegí$/,
		run: (world) => expect(world.recent?.[0]).toBe(world.emojiChosen)
	},
	{
		pattern: /^el emoji más viejo de antes ya no está$/,
		run: (world) => expect(world.recent).not.toContain(world.emojiMoreOld)
	}
];
