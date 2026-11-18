// Limpiezas y reintentos (spec §7). Las limpiezas comparten handler: la limpieza solo
// nombra de qué elementos se trata. Los pasos declaran qué hay por limpiar y qué intentos fallan;
// los Then preguntan qué quedó limpio y qué quedó por reintentar.
import { expect } from 'vitest';
import { itemsToAttempt, retriesWith, attemptResult, type AppEvent } from '../../src/lib/core/cleanups';
import type { StepDefinition, World } from './world';

const LIMPIEZAS = ['completados huérfanos', 'anotaciones huérfanas'];

interface Limpieza {
	original: string[];
	porLimpiar: string[];
	fallan: Set<string>;
	cleaned: string[];
}

const estados = new WeakMap<World, Limpieza>();

function estado(world: World): Limpieza {
	let actual = estados.get(world);
	if (!actual) {
		actual = { original: [], porLimpiar: [], fallan: new Set(), cleaned: [] };
		estados.set(world, actual);
	}
	return actual;
}

/** Ids separados por ", "; "ninguno" es la lista vacía. */
function ids(valor: string): string[] {
	if (valor === 'ninguno') return [];
	const partes = valor.split(', ');
	if (partes.some((parte) => parte === '' || parte !== parte.trim())) throw new Error(`Lista de ids inválida: "${valor}"`);
	return partes;
}

/** Un intento: se intenta cada elemento por limpiar por separado; los que fallaron siguen por limpiar. */
function intentar(world: World): void {
	const actual = estado(world);
	const resultado = attemptResult(itemsToAttempt(actual.porLimpiar, new Set()), [...actual.fallan]);
	actual.cleaned.push(...resultado.cleaned);
	actual.porLimpiar = resultado.pendings;
}

function sucede(world: World, suceso: AppEvent): void {
	if (retriesWith(suceso)) intentar(world);
}

const SUCESOS: AppEvent[] = ['vuelve la conexión', 'cambian los datos'];

export const limpiezasSteps: StepDefinition[] = [
	{
		pattern: /^hay por limpiar (.+) de (.+)$/,
		run: (world, elementos, limpieza) => {
			if (!LIMPIEZAS.includes(limpieza)) throw new Error(`Limpieza desconocida: "${limpieza}"`);
			estados.set(world, { original: ids(elementos), porLimpiar: ids(elementos), fallan: new Set(), cleaned: [] });
		}
	},
	{
		pattern: /^falla el intento de limpiar (.+)$/,
		run: (world, fallan) => ids(fallan).forEach((id) => estado(world).fallan.add(id))
	},
	{
		pattern: /^deja de fallar el intento de limpiar (.+)$/,
		run: (world, fallan) => ids(fallan).forEach((id) => estado(world).fallan.delete(id))
	},
	{
		pattern: /^la app intent(?:a|ó) las limpiezas$/,
		run: intentar
	},
	{
		pattern: /^sucede que (.+)$/,
		run: (world, suceso) => {
			if (!SUCESOS.includes(suceso as AppEvent)) throw new Error(`Suceso desconocido: "${suceso}"`);
			sucede(world, suceso as AppEvent);
		}
	},
	{
		pattern: /^pasan (.+) minutos sin que suceda nada más$/,
		run: (world, minutos) => {
			if (!/^\d+$/.test(minutos)) throw new Error(`Minutos inválidos: "${minutos}"`);
			sucede(world, 'pasa el tiempo');
		}
	},
	{
		pattern: /^quedan limpios (.+)$/,
		run: (world, limpios) => expect(estado(world).original.filter((id) => estado(world).cleaned.includes(id))).toEqual(ids(limpios))
	},
	{
		pattern: /^quedan por limpiar (.+)$/,
		run: (world, pendientes) => expect(estado(world).porLimpiar).toEqual(ids(pendientes))
	}
];
