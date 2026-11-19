// Recent emojis of the picker (spec §6.2): the list the device remembers.
// "los emojis recientes son ..." and "hay N emojis recientes" are both Given and
// Then (the dispatcher does not see the keyword). They are told apart by whether there was already an
// action in the scenario (world.wasActionOnRecent): before it they declare the
// list; afterwards they verify it. The actions that depend on a declared list
// fail if it is missing.
import { expect } from 'vitest';
import { addRecent } from '../../src/lib/core/recent-emojis';
import { P, list, numeric } from './values';
import type { StepDefinition, World } from './world';

/** Choosing an emoji in the picker adds it to this device's recents. */
export function recordChoice(world: World, emoji: string): void {
	world.recent = addRecent(world.recent ?? [], emoji);
	world.wasActionOnRecent = true;
}

function recentDeclared(world: World): string[] {
	if (world.recent === undefined) throw new Error('The recent emojis must be declared before acting on them.');
	return world.recent;
}

/** Emojis distinct from each other, to fill the list without naming them. */
const emojisDistinct = (count: number) => Array.from({ length: count }, (_, i) => String.fromCodePoint(0x1f600 + i));

const NEW = '🧪';

function declareOVerify(world: World, expected: string[]): void {
	if (world.wasActionOnRecent) expect(world.recent).toEqual(expected);
	else world.recent = expected;
}

export const recentEmojisSteps: StepDefinition[] = [
	{
		pattern: /^there are no recent emojis$/,
		run: (world) => void (world.recent = [])
	},
	{
		pattern: new RegExp(`^the recent emojis are ${P}$`),
		run: (world, recent) => declareOVerify(world, list(recent))
	},
	{
		pattern: new RegExp(`^there are ${P} recent emojis$`),
		run: (world, count) =>
			world.wasActionOnRecent
				? expect(world.recent).toHaveLength(numeric(count))
				: void (world.recent = emojisDistinct(numeric(count)))
	},
	{
		pattern: /^I choose an emoji that was not among the recent ones$/,
		run: (world) => {
			world.emojiMoreOld = recentDeclared(world).at(-1);
			world.emojiChosen = NEW;
			recordChoice(world, NEW);
			// With the panel open, the chosen emoji stays in the form (§6.2).
			const changes = world.panel?.changes;
			if (changes) changes.form = { ...changes.form, data: { ...changes.form.data, emoji: NEW } };
		}
	},
	{
		pattern: /^the first one is the one I chose$/,
		run: (world) => expect(world.recent?.[0]).toBe(world.emojiChosen)
	},
	{
		pattern: /^the oldest emoji from before is gone$/,
		run: (world) => expect(world.recent).not.toContain(world.emojiMoreOld)
	}
];
