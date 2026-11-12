// Última vez del panel de edición (spec §6.2).
import { expect } from 'vitest';
import { ultimaVez } from '../../src/lib/core/ultima-vez';
import { P, fechaHora } from './valores';
import { laTarea, type StepDefinition } from './world';

export const ultimaVezSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^consulto la última vez el ${P}$`),
		run: (world, ahora) => {
			world.ultimaVez = ultimaVez(laTarea(world).id, world.completados, fechaHora(ahora));
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
