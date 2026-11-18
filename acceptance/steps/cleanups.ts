// Limpiezas y reintentos (spec §7). Las limpiezas comparten handler: la limpieza solo
// nombra de qué elementos se trata. Los pasos declaran qué hay por limpiar y qué intentos fallan;
// los Then preguntan qué quedó limpio y qué quedó por reintentar.
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

/** Ids separados por ", "; "ninguno" es la lista vacía. */
function ids(value: string): string[] {
	if (value === 'ninguno') return [];
	const parts = value.split(', ');
	if (parts.some((part) => part === '' || part !== part.trim())) throw new Error(`Lista de ids inválida: "${value}"`);
	return parts;
}

/** Un intento: se intenta cada elemento por limpiar por separado; los que fallaron siguen por limpiar. */
function attempt(world: World): void {
	const current = status(world);
	const result = attemptResult(itemsToAttempt(current.byClean, new Set()), [...current.fail]);
	current.cleaned.push(...result.cleaned);
	current.byClean = result.pendings;
}

function happens(world: World, incident: AppEvent): void {
	if (retriesWith(incident)) attempt(world);
}

const EVENTS: AppEvent[] = ['vuelve la conexión', 'cambian los datos'];

export const cleanupsSteps: StepDefinition[] = [
	{
		pattern: /^hay por limpiar (.+) de (.+)$/,
		run: (world, elements, cleanup) => {
			if (!CLEANUPS.includes(cleanup)) throw new Error(`Limpieza desconocida: "${cleanup}"`);
			statuses.set(world, { original: ids(elements), byClean: ids(elements), fail: new Set(), cleaned: [] });
		}
	},
	{
		pattern: /^falla el intento de limpiar (.+)$/,
		run: (world, fail) => ids(fail).forEach((id) => status(world).fail.add(id))
	},
	{
		pattern: /^deja de fallar el intento de limpiar (.+)$/,
		run: (world, fail) => ids(fail).forEach((id) => status(world).fail.delete(id))
	},
	{
		pattern: /^la app intent(?:a|ó) las limpiezas$/,
		run: attempt
	},
	{
		pattern: /^sucede que (.+)$/,
		run: (world, incident) => {
			if (!EVENTS.includes(incident as AppEvent)) throw new Error(`Suceso desconocido: "${incident}"`);
			happens(world, incident as AppEvent);
		}
	},
	{
		pattern: /^pasan (.+) minutos sin que suceda nada más$/,
		run: (world, minutes) => {
			if (!/^\d+$/.test(minutes)) throw new Error(`Minutos inválidos: "${minutes}"`);
			happens(world, 'pasa el tiempo');
		}
	},
	{
		pattern: /^quedan limpios (.+)$/,
		run: (world, clean) => expect(status(world).original.filter((id) => status(world).cleaned.includes(id))).toEqual(ids(clean))
	},
	{
		pattern: /^quedan por limpiar (.+)$/,
		run: (world, pending) => expect(status(world).byClean).toEqual(ids(pending))
	}
];
