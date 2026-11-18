// Qué fuente dibuja cada carácter (spec §6, "Qué se dibuja con qué").
import { expect } from 'vitest';
import { textFonts } from '../../src/lib/core/character-font';
import { P } from './values';
import type { StepDefinition } from './world';

export const fontSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^el texto ${P}$`),
		run: (world, text) => {
			world.text = text;
		}
	},
	{
		pattern: new RegExp(`^el texto se dibuja con ${P}$`),
		run: (world, font) => expect(new Set(textFonts(world.text ?? ''))).toEqual(new Set([font]))
	}
];
