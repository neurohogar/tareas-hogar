// What the published manifest of the app declares (spec §6 and §8).
import { readFileSync } from 'node:fs';
import { expect } from 'vitest';
import { P } from './values';
import type { StepDefinition, World } from './world';

const MANIFEST_URL = new URL('../../static/manifest.webmanifest', import.meta.url);

const manifests = new WeakMap<World, Record<string, unknown>>();

function manifestOf(world: World): Record<string, unknown> {
	const manifest = manifests.get(world);
	if (!manifest) throw new Error('The scenario did not declare "el manifest que publica la app"');
	return manifest;
}

export const portraitOrientationSteps: StepDefinition[] = [
	{
		pattern: /^the manifest the app publishes$/,
		run: (world) => {
			const json = JSON.parse(readFileSync(MANIFEST_URL, 'utf8')) as Record<string, unknown>;
			manifests.set(world, json);
		}
	},
	{
		pattern: new RegExp(`^the field ${P} of the manifest is ${P}$`),
		run: (world, field, value) => {
			const manifest = manifestOf(world);
			expect(manifest[field]).toBe(value);
		}
	}
];
