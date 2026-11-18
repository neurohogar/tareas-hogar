// Última vez del panel de edición (spec §6.2).
import { expect } from 'vitest';
import { lastTime } from '../../src/lib/core/last-time';
import { P, fechaHora } from './values';
import { laTarea, type StepDefinition } from './world';

export const ultimaVezSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^consulto la última vez el ${P}$`),
		run: (world, ahora) => {
			world.ultimaVez = lastTime(laTarea(world).id, world.completions, fechaHora(ahora));
		}
	},
	{
		pattern: new RegExp(`^la última vez muestra ${P}$`),
		run: (world, esperado) => {
			if (world.ultimaVez === undefined) throw new Error('No se consultó la última vez');
			expect(world.ultimaVez).toBe(esperado);
		}
	}
];
