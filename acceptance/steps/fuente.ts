// Qué fuente dibuja cada carácter (spec §6, "Qué se dibuja con qué").
import { expect } from 'vitest';
import { textFonts } from '../../src/lib/core/character-font';
import { P } from './valores';
import type { StepDefinition } from './world';

export const fuenteSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^el texto ${P}$`),
		run: (world, texto) => {
			world.text = texto;
		}
	},
	{
		pattern: new RegExp(`^el texto se dibuja con ${P}$`),
		run: (world, fuente) => expect(new Set(textFonts(world.text ?? ''))).toEqual(new Set([fuente]))
	}
];
