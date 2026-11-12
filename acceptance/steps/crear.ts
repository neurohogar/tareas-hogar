import { expect } from 'vitest';
import { completadosDeTarea } from '../../src/lib/core/completados';
import type { ResultadoDeCreacion } from '../../src/lib/core/creacion';
import {
	crearPeriodicaRelativa,
	type DatosPeriodicaRelativa
} from '../../src/lib/core/crear-periodica-relativa';
import { P, numero, unidad } from './valores';
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

export function registrarCreacion(world: World, crear: (id: string) => ResultadoDeCreacion): void {
	const resultado = crear(nuevoId(world, 'tarea'));
	if (resultado.ok) world.documentos = [...world.documentos, resultado.tarea];
	else world.errores = resultado.errores;
}

export function crearEnWorld(world: World, datos: DatosPeriodicaRelativa, ahora = AHORA): void {
	registrarCreacion(world, (id) => crearPeriodicaRelativa(datos, id, ahora));
}

const MOTIVOS = {
	'título vacío': { titulo: 'vacio' },
	'intervalo inválido': { cada: 'invalido' },
	'falta de días': { dias: 'faltan' },
	'día del mes inválido': { dias: 'diaDelMesInvalido' },
	'semanal y mensual combinados': { dias: 'combinados' },
	'fecha límite inválida': { fechaLimite: 'invalida' },
	'emoji inválido': { emoji: 'invalido' },
	'nombre de etiqueta vacío': { etiquetas: 'vacio' },
	'nombre de etiqueta demasiado largo': { etiquetas: 'largo' },
	'horario incompleto': { horario: 'incompleto' },
	'horarios superpuestos': { horario: 'superpuestos' },
	'varios horarios en una relativa en horas': { horario: 'variasEnHoras' }
};

const TIPOS = { periódica: 'periodica', puntual: 'puntual' };

export const crearSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^creo una tarea periódica relativa con título ${P} cada ${P} ${P}$`),
		run: (world, titulo, cada, u) => crearEnWorld(world, { titulo, cada: numero(cada), unidad: unidad(u) })
	},
	{
		pattern: new RegExp(`^creo una tarea periódica relativa con título ${P} y un intervalo válido$`),
		run: (world, titulo) => crearEnWorld(world, { titulo, cada: CADA_VALIDO, unidad: 'dias' })
	},
	{
		pattern: /^creo una tarea periódica relativa con un título de solo espacios y un intervalo válido$/,
		run: (world) => crearEnWorld(world, { titulo: '   ', cada: CADA_VALIDO, unidad: 'dias' })
	},
	{
		pattern: new RegExp(
			`^creo una tarea periódica relativa con un título válido y ${P} como cantidad del intervalo$`
		),
		run: (world, cada) => crearEnWorld(world, { titulo: TITULO_VALIDO, cada: numero(cada), unidad: 'dias' })
	},
	{
		pattern: new RegExp(`^se crea una tarea (${Object.keys(TIPOS).join('|')}) con título ${P}$`),
		run: (world, tipo, titulo) => {
			const tarea = laTarea(world);
			expect(tarea.tipo).toBe(TIPOS[tipo as keyof typeof TIPOS]);
			expect(tarea.titulo).toBe(titulo);
		}
	},
	{
		pattern: new RegExp(`^su recurrencia es relativa cada ${P} ${P}$`),
		run: (world, cada, u) => {
			expect(laTareaDeTipo(world, 'periodica').recurrencia).toEqual({ modo: 'relativo', cada: numero(cada), unidad: unidad(u) });
		}
	},
	{
		pattern: /^la tarea no tiene completados$/,
		run: (world) => expect(completadosDeTarea(world.completados, laTarea(world).id)).toEqual([])
	},
	{
		pattern: new RegExp(`^la (?:creación|edición) se rechaza por (${Object.keys(MOTIVOS).join('|')})$`),
		run: (world, motivo) => expect(world.errores).toEqual(MOTIVOS[motivo as keyof typeof MOTIVOS])
	},
	{
		pattern: /^no se crea ninguna tarea$/,
		run: (world) => expect(world.documentos).toEqual([])
	}
];
