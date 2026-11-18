import { expect } from 'vitest';
import { completionsOfTask } from '../../src/lib/core/completions';
import type { CreationResult } from '../../src/lib/core/creation';
import {
	createRecurringRelative,
	type RecurringRelativeData
} from '../../src/lib/core/create-recurring-relative';
import { P, numero, unidad } from './values';
import { laTarea, laTareaDeTipo, nuevoId, type StepDefinition, type World } from './world';

export const TITULO_VALIDO = 'Regar plantas';
const CADA_VALIDO = 2;

/** Momento de creación cuando el escenario no lo da. */
export const AHORA = new Date(2026, 6, 15, 8, 0, 0);

/**
 * Momento de creación de las tareas con título cuando el escenario no lo da:
 * el mismo para todas y anterior a cualquier otra fecha del escenario.
 */
export const ANTES_DEL_ESCENARIO = new Date(2000, 0, 1, 0, 0, 0);

export function registrarCreacion(world: World, crear: (id: string) => CreationResult): void {
	const resultado = crear(nuevoId(world, 'tarea'));
	if (resultado.ok) world.documentos = [...world.documentos, resultado.task];
	else world.errors = resultado.errors;
}

export function crearEnWorld(world: World, datos: RecurringRelativeData, ahora = AHORA): void {
	registrarCreacion(world, (id) => createRecurringRelative(datos, id, ahora));
}

const MOTIVOS = {
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

const TIPOS = { periódica: 'periodica', puntual: 'puntual' };

export const crearSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^creo una tarea periódica relativa con título ${P} cada ${P} ${P}$`),
		run: (world, titulo, cada, u) => crearEnWorld(world, { title: titulo, every: numero(cada), unit: unidad(u) })
	},
	{
		pattern: new RegExp(`^creo una tarea periódica relativa con título ${P} y un intervalo válido$`),
		run: (world, titulo) => crearEnWorld(world, { title: titulo, every: CADA_VALIDO, unit: 'dias' })
	},
	{
		pattern: /^creo una tarea periódica relativa con un título de solo espacios y un intervalo válido$/,
		run: (world) => crearEnWorld(world, { title: '   ', every: CADA_VALIDO, unit: 'dias' })
	},
	{
		pattern: new RegExp(
			`^creo una tarea periódica relativa con un título válido y ${P} como cantidad del intervalo$`
		),
		run: (world, cada) => crearEnWorld(world, { title: TITULO_VALIDO, every: numero(cada), unit: 'dias' })
	},
	{
		pattern: new RegExp(`^se crea una tarea (${Object.keys(TIPOS).join('|')}) con título ${P}$`),
		run: (world, tipo, titulo) => {
			const tarea = laTarea(world);
			expect(tarea.kind).toBe(TIPOS[tipo as keyof typeof TIPOS]);
			expect(tarea.title).toBe(titulo);
		}
	},
	{
		pattern: new RegExp(`^su recurrencia es relativa cada ${P} ${P}$`),
		run: (world, cada, u) => {
			expect(laTareaDeTipo(world, 'periodica').recurrence).toEqual({ mode: 'relativo', every: numero(cada), unit: unidad(u) });
		}
	},
	{
		pattern: /^la tarea no tiene completados$/,
		run: (world) => expect(completionsOfTask(world.completions, laTarea(world).id)).toEqual([])
	},
	{
		pattern: new RegExp(`^la (?:creación|edición) se rechaza por (${Object.keys(MOTIVOS).join('|')})$`),
		run: (world, motivo) => expect(world.errors).toEqual(MOTIVOS[motivo as keyof typeof MOTIVOS])
	},
	{
		pattern: /^no se crea ninguna tarea$/,
		run: (world) => expect(world.documentos).toEqual([])
	}
];
