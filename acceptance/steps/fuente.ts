// Qué fuente dibuja cada carácter (spec §6, "Qué se dibuja con qué").
import { expect } from 'vitest';
import { fuentesDelTexto } from '../../src/lib/core/fuente-de-caracter';
import { P } from './valores';
import type { StepDefinition } from './world';

export const fuenteSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^el texto ${P}$`),
		run: (world, texto) => {
			world.texto = texto;
		}
	},
	{
		pattern: new RegExp(`^el texto se dibuja con ${P}$`),
		run: (world, fuente) => expect(new Set(fuentesDelTexto(world.texto ?? ''))).toEqual(new Set([fuente]))
	}
];
