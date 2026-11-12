import { expect } from 'vitest';
import { avisoAlCompletar } from '../../src/lib/core/aviso';
import { completar } from '../../src/lib/core/completados';
import { estadoDeTarea } from '../../src/lib/core/estado-de-tarea';
import type { Tarea } from '../../src/lib/core/tarea';
import { ANTES_DEL_ESCENARIO, crearEnWorld } from './crear';
import { P, TITULO, fechaHora, numero, unidad } from './valores';
import {
	laTarea,
	laTareaTitulada,
	nuevoId,
	recordarAntesDeMiCambio,
	type StepDefinition,
	type World
} from './world';

/** Momentos arbitrarios, lejanos entre sí, para "en cualquier momento". */
export const CUALQUIER_MOMENTO = [
	new Date(2000, 0, 1, 0, 0, 0),
	new Date(2026, 6, 15, 8, 0, 0),
	new Date(2099, 11, 31, 23, 59, 59)
];

export function registrarCompletado(world: World, momento: Date, tarea: Tarea = laTarea(world)) {
	const completado = completar(tarea, world.completados, nuevoId(world, 'completado'), momento);
	world.completados = [...world.completados, completado];
	return completado;
}

/** Completo desde este dispositivo: es mi cambio y abre el aviso (§5.4). */
export function completoYo(world: World, momento: Date, tarea: Tarea): void {
	recordarAntesDeMiCambio(world);
	world.completadosAnteriores = structuredClone(world.completados);
	world.momentoDelNuevoCompletado = momento;
	world.nuevoCompletado = registrarCompletado(world, momento, tarea);
	world.aviso = avisoAlCompletar(tarea, world.nuevoCompletado);
}

function consultarEstado(world: World, momentos: Date[]): void {
	world.momentosDelEstado = momentos;
	world.estados = momentos.map((ahora) => estadoDeTarea(laTarea(world), world.completados, ahora));
}

function unicoEstado(world: World) {
	expect(world.estados).toHaveLength(1);
	return world.estados[0];
}

export const periodicaRelativaSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^una tarea periódica relativa cada ${P} ${P}$`),
		run: (world, cada, u) => crearEnWorld(world, { titulo: 'Tarea', cada: numero(cada), unidad: unidad(u) })
	},
	{
		pattern: new RegExp(`^una tarea periódica relativa cada ${P} ${P} creada el ${P}$`),
		run: (world, cada, u, creada) =>
			crearEnWorld(world, { titulo: 'Tarea', cada: numero(cada), unidad: unidad(u) }, fechaHora(creada))
	},
	{
		pattern: /^una tarea periódica relativa nunca completada$/,
		run: (world) => crearEnWorld(world, { titulo: 'Tarea', cada: 1, unidad: 'horas' })
	},
	{
		pattern: new RegExp(`^una tarea periódica relativa ${TITULO} cada ${P} ${P}$`),
		run: (world, titulo, cada, u) =>
			crearEnWorld(world, { titulo, cada: numero(cada), unidad: unidad(u) }, ANTES_DEL_ESCENARIO)
	},
	{
		pattern: new RegExp(`^una tarea periódica relativa ${TITULO} cada ${P} ${P} creada el ${P}$`),
		run: (world, titulo, cada, u, creada) =>
			crearEnWorld(world, { titulo, cada: numero(cada), unidad: unidad(u) }, fechaHora(creada))
	},
	{
		pattern: new RegExp(`^una tarea periódica relativa ${TITULO} nunca completada$`),
		run: (world, titulo) => crearEnWorld(world, { titulo, cada: 1, unidad: 'horas' }, ANTES_DEL_ESCENARIO)
	},
	{
		pattern: new RegExp(`^una tarea periódica relativa ${TITULO} nunca completada creada el ${P}$`),
		run: (world, titulo, creada) => crearEnWorld(world, { titulo, cada: 1, unidad: 'horas' }, fechaHora(creada))
	},
	{
		pattern: new RegExp(`^la tarea ${TITULO} fue completada el ${P}$`),
		run: (world, titulo, momento) => {
			registrarCompletado(world, fechaHora(momento), laTareaTitulada(world, titulo));
		}
	},
	{
		pattern: new RegExp(`^la tarea fue completada el ${P}$`),
		run: (world, momento) => {
			registrarCompletado(world, fechaHora(momento));
		}
	},
	{
		pattern: new RegExp(`^completo la tarea el ${P}$`),
		run: (world, momento) => completoYo(world, fechaHora(momento), laTarea(world))
	},
	{
		pattern: new RegExp(`^completo la tarea ${TITULO} el ${P}$`),
		run: (world, titulo, momento) => completoYo(world, fechaHora(momento), laTareaTitulada(world, titulo))
	},
	{
		pattern: new RegExp(`^consulto el estado el ${P}$`),
		run: (world, ahora) => consultarEstado(world, [fechaHora(ahora)])
	},
	{
		pattern: /^consulto el estado en cualquier momento$/,
		run: (world) => consultarEstado(world, CUALQUIER_MOMENTO)
	},
	{
		pattern: /^el estado es (pendiente|en espera|atrasada)$/,
		run: (world, tipo) => {
			expect(world.estados.length).toBeGreaterThan(0);
			for (const estado of world.estados) expect(estado.tipo).toBe(tipo);
		}
	},
	{
		pattern: new RegExp(`^el progreso es ${P}$`),
		run: (world, progreso) => {
			const estado = unicoEstado(world);
			if (estado.tipo !== 'en espera') throw new Error(`Sin progreso: el estado es ${estado.tipo}`);
			expect(estado.progreso).toBeCloseTo(numero(progreso), 9);
		}
	},
	{
		pattern: /^se registró un completado sin ocurrencia cubierta$/,
		run: (world) => {
			expect(world.nuevoCompletado).toEqual({
				id: expect.any(String),
				tareaId: laTarea(world).id,
				completadoEn: world.momentoDelNuevoCompletado
			});
			expect(world.nuevoCompletado).not.toHaveProperty('ocurrenciaCubierta');
		}
	},
	{
		pattern: /^el nuevo completado se agrega sin modificar los anteriores$/,
		run: (world) => {
			const anteriores = world.completadosAnteriores ?? [];
			expect(anteriores.length).toBeGreaterThan(0);
			expect(world.completados).toEqual([...anteriores, world.nuevoCompletado]);
			expect(anteriores.map((c) => c.id)).not.toContain(world.nuevoCompletado?.id);
		}
	}
];
