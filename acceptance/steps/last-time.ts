// Last time of the edit panel (spec §6.2).
import { expect } from 'vitest';
import { lastTime } from '../../src/lib/core/last-time';
import { P, dateHour } from './values';
import { theTask, type StepDefinition } from './world';

export const lastTimeSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^I query the last time on ${P}$`),
		run: (world, now) => {
			world.lastTime = lastTime(theTask(world).id, world.completions, dateHour(now));
		}
	},
	{
		pattern: new RegExp(`^the last time shows ${P}$`),
		run: (world, expected) => {
			if (world.lastTime === undefined) throw new Error('The last time was not queried');
			expect(world.lastTime).toBe(expected);
		}
	}
];
