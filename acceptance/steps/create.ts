import { expect } from 'vitest';
import { completionsOfTask } from '../../src/lib/core/completions';
import type { CreationResult } from '../../src/lib/core/creation';
import {
	createRecurringRelative,
	type RecurringRelativeData
} from '../../src/lib/core/create-recurring-relative';
import { P, numeric, unit } from './values';
import { theTask, theTaskOfKind, newId, type StepDefinition, type World } from './world';

export const TITLE_VALID = 'Regar plantas';
const EVERY_VALID = 2;

/** Creation moment when the scenario does not give one. */
export const NOW = new Date(2026, 6, 15, 8, 0, 0);

/**
 * Creation moment of the tasks with a title when the scenario does not give one:
 * the same for all of them and earlier than any other date in the scenario.
 */
export const SCENARIO_BEFORE = new Date(2000, 0, 1, 0, 0, 0);

export function recordCreation(world: World, create: (id: string) => CreationResult): void {
	const result = create(newId(world, 'tarea'));
	if (result.ok) world.docs = [...world.docs, result.task];
	else world.errors = result.errors;
}

export function createInWorld(world: World, data: RecurringRelativeData, now = NOW): void {
	recordCreation(world, (id) => createRecurringRelative(data, id, now));
}

const REASONS = {
	'título vacío': { title: 'vacio' },
	'intervalo inválido': { every: 'invalido' },
	'falta de días': { days: 'faltan' },
	'día del mes inválido': { days: 'diaDelMesInvalido' },
	'semanal y mensual combinados': { days: 'combinados' },
	'fecha límite inválida': { dueDate: 'invalida' },
	'emoji inválido': { emoji: 'invalido' },
	'horario incompleto': { schedule: 'incompleto' },
	'horarios superpuestos': { schedule: 'superpuestos' },
	'varios horarios en una relativa en horas': { schedule: 'variasEnHoras' }
};

const KINDS = { periódica: 'periodica', puntual: 'puntual' };

export const createSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^creo una tarea periódica relativa con título ${P} cada ${P} ${P}$`),
		run: (world, title, every, u) => createInWorld(world, { title, every: numeric(every), unit: unit(u) })
	},
	{
		pattern: new RegExp(`^creo una tarea periódica relativa con título ${P} y un intervalo válido$`),
		run: (world, title) => createInWorld(world, { title, every: EVERY_VALID, unit: 'dias' })
	},
	{
		pattern: /^creo una tarea periódica relativa con un título de solo espacios y un intervalo válido$/,
		run: (world) => createInWorld(world, { title: '   ', every: EVERY_VALID, unit: 'dias' })
	},
	{
		pattern: new RegExp(
			`^creo una tarea periódica relativa con un título válido y ${P} como cantidad del intervalo$`
		),
		run: (world, every) => createInWorld(world, { title: TITLE_VALID, every: numeric(every), unit: 'dias' })
	},
	{
		pattern: new RegExp(`^se crea una tarea (${Object.keys(KINDS).join('|')}) con título ${P}$`),
		run: (world, kind, title) => {
			const task = theTask(world);
			expect(task.kind).toBe(KINDS[kind as keyof typeof KINDS]);
			expect(task.title).toBe(title);
		}
	},
	{
		pattern: new RegExp(`^su recurrencia es relativa cada ${P} ${P}$`),
		run: (world, every, u) => {
			expect(theTaskOfKind(world, 'periodica').recurrence).toEqual({ mode: 'relativo', every: numeric(every), unit: unit(u) });
		}
	},
	{
		pattern: /^la tarea no tiene completados$/,
		run: (world) => expect(completionsOfTask(world.completions, theTask(world).id)).toEqual([])
	},
	{
		pattern: new RegExp(`^la (?:creación|edición) se rechaza por (${Object.keys(REASONS).join('|')})$`),
		run: (world, reason) => expect(world.errors).toEqual(REASONS[reason as keyof typeof REASONS])
	},
	{
		pattern: /^no se crea ninguna tarea$/,
		run: (world) => expect(world.docs).toEqual([])
	}
];
