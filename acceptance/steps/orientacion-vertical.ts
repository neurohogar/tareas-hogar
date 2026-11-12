// Qué declara el manifest publicado de la app (spec §6 y §8).
import { readFileSync } from 'node:fs';
import { expect } from 'vitest';
import { P } from './valores';
import type { StepDefinition, World } from './world';

const MANIFEST_URL = new URL('../../static/manifest.webmanifest', import.meta.url);

const manifests = new WeakMap<World, Record<string, unknown>>();

function manifestDe(world: World): Record<string, unknown> {
	const manifest = manifests.get(world);
	if (!manifest) throw new Error('El escenario no declaró "el manifest que publica la app"');
	return manifest;
}

export const orientacionVerticalSteps: StepDefinition[] = [
	{
		pattern: /^el manifest que publica la app$/,
		run: (world) => {
			const json = JSON.parse(readFileSync(MANIFEST_URL, 'utf8')) as Record<string, unknown>;
			manifests.set(world, json);
		}
	},
	{
		pattern: new RegExp(`^el campo ${P} del manifest es ${P}$`),
		run: (world, campo, valor) => {
			const manifest = manifestDe(world);
			expect(manifest[campo]).toBe(valor);
		}
	}
];
