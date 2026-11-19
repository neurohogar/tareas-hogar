// Cleanups and retries (spec §7). The cleanups share a handler: the cleanup only
// names which elements it is about. The steps declare what is left to clean and which attempts fail;
// the Thens ask what ended up clean and what is left to retry.
import { expect } from 'vitest';
import { itemsToAttempt, retriesWith, attemptResult, type AppEvent } from '../../src/lib/core/cleanups';
import type { StepDefinition, World } from './world';

const CLEANUPS = ['completados huérfanos', 'anotaciones huérfanas'];

interface Cleanup {
	original: string[];
	byClean: string[];
	fail: Set<string>;
	cleaned: string[];
}

const statuses = new WeakMap<World, Cleanup>();

function status(world: World): Cleanup {
	let current = statuses.get(world);
	if (!current) {
		current = { original: [], byClean: [], fail: new Set(), cleaned: [] };
		statuses.set(world, current);
	}
	return current;
}

/** Ids separated by ", "; "ninguno" (or "none" in the step text) is the empty list. */
function ids(value: string): string[] {
	if (value === 'ninguno' || value === 'none') return [];
	const parts = value.split(', ');
	if (parts.some((part) => part === '' || part !== part.trim())) throw new Error(`Invalid id list: "${value}"`);
	return parts;
}

/** An attempt: each element to clean is tried separately; those that failed remain to be cleaned. */
function attempt(world: World): void {
	const current = status(world);
	const result = attemptResult(itemsToAttempt(current.byClean, new Set()), [...current.fail]);
	current.cleaned.push(...result.cleaned);
	current.byClean = result.pendings;
}

function happens(world: World, incident: AppEvent): void {
	if (retriesWith(incident)) attempt(world);
}

/** The incidents as the Gherkin says them, mapped to the core's events. */
const EVENTS: Record<string, AppEvent> = { 'vuelve la conexión': 'connectionBack', 'cambian los datos': 'dataChanged' };

export const cleanupsSteps: StepDefinition[] = [
	{
		pattern: /^(.+) of (.+) are left to clean$/,
		run: (world, elements, cleanup) => {
			if (!CLEANUPS.includes(cleanup)) throw new Error(`Unknown cleanup: "${cleanup}"`);
			statuses.set(world, { original: ids(elements), byClean: ids(elements), fail: new Set(), cleaned: [] });
		}
	},
	{
		pattern: /^the attempt to clean fails: (.+)$/,
		run: (world, fail) => ids(fail).forEach((id) => status(world).fail.add(id))
	},
	{
		pattern: /^the attempt to clean stops failing: (.+)$/,
		run: (world, fail) => ids(fail).forEach((id) => status(world).fail.delete(id))
	},
	{
		pattern: /^the app attempt(?:s|ed) the cleanups$/,
		run: attempt
	},
	{
		pattern: /^this happens: (.+)$/,
		run: (world, incident) => {
			const event = EVENTS[incident];
			if (event === undefined) throw new Error(`Unknown incident: "${incident}"`);
			happens(world, event);
		}
	},
	{
		pattern: /^(.+) minutes pass with nothing else happening$/,
		run: (world, minutes) => {
			if (!/^\d+$/.test(minutes)) throw new Error(`Invalid minutes: "${minutes}"`);
			happens(world, 'timePasses');
		}
	},
	{
		pattern: /^the items left clean are (.+)$/,
		run: (world, clean) => expect(status(world).original.filter((id) => status(world).cleaned.includes(id))).toEqual(ids(clean))
	},
	{
		pattern: /^the items left to clean are (.+)$/,
		run: (world, pending) => expect(status(world).byClean).toEqual(ids(pending))
	}
];
