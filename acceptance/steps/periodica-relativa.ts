import { expect } from 'vitest';
import { noticeOnComplete } from '../../src/lib/core/notice';
import { complete } from '../../src/lib/core/completions';
import { applyChange } from '../../src/lib/core/task-document';
import { changeOnComplete } from '../../src/lib/core/current-step';
import { taskStatus } from '../../src/lib/core/task-status';
import type { Completion, Task } from '../../src/lib/core/task';
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

export function registrarCompletado(world: World, momento: Date, tarea: Task = laTarea(world), fueMinima = false) {
	const completado = complete(tarea, world.completions, nuevoId(world, 'completado'), momento, fueMinima);
	world.completions = [...world.completions, completado];
	return completado;
}

/** Cómo se arma el completado nuevo: entero por el checkbox; «Hice la mínima» lo decide el core y puede no completar. */
export type Completa = (tarea: Task, completados: readonly Completion[], id: string, ahora: Date) => Completion | undefined;

const completaEntero: Completa = (tarea, completados, id, ahora) => complete(tarea, completados, id, ahora);

/** Completo desde este dispositivo: es mi cambio y abre el aviso (§5.4). Si `completa` no completa, no cambia nada. */
export function completoYo(world: World, momento: Date, tarea: Task, completa: Completa = completaEntero): void {
	const completado = completa(tarea, world.completions, nuevoId(world, 'completado'), momento);
	if (!completado) return;
	recordarAntesDeMiCambio(world);
	world.completadosAnteriores = structuredClone(world.completions);
	world.momentoDelNuevoCompletado = momento;
	world.completions = [...world.completions, completado];
	world.nuevoCompletado = completado;
	world.notice = noticeOnComplete(tarea, world.nuevoCompletado);
	// Completar, por el checkbox o por «Hecho», vuelve la tarea al paso 1 (§4.1, Pasos).
	world.documentos = applyChange(world.documentos, tarea.id, changeOnComplete(tarea));
}

function consultarEstado(world: World, momentos: Date[]): void {
	world.momentosDelEstado = momentos;
	world.estados = momentos.map((ahora) => taskStatus(laTarea(world), world.completions, ahora));
}

function unicoEstado(world: World) {
	expect(world.estados).toHaveLength(1);
	return world.estados[0];
}

export const periodicaRelativaSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^una tarea periódica relativa cada ${P} ${P}$`),
		run: (world, cada, u) => crearEnWorld(world, { title: 'Tarea', every: numero(cada), unit: unidad(u) })
	},
	{
		pattern: new RegExp(`^una tarea periódica relativa cada ${P} ${P} creada el ${P}$`),
		run: (world, cada, u, creada) =>
			crearEnWorld(world, { title: 'Tarea', every: numero(cada), unit: unidad(u) }, fechaHora(creada))
	},
	{
		pattern: /^una tarea periódica relativa nunca completada$/,
		run: (world) => crearEnWorld(world, { title: 'Tarea', every: 1, unit: 'horas' })
	},
	{
		pattern: new RegExp(`^una tarea periódica relativa ${TITULO} cada ${P} ${P}$`),
		run: (world, titulo, cada, u) =>
			crearEnWorld(world, { title: titulo, every: numero(cada), unit: unidad(u) }, ANTES_DEL_ESCENARIO)
	},
	{
		pattern: new RegExp(`^una tarea periódica relativa ${TITULO} cada ${P} ${P} creada el ${P}$`),
		run: (world, titulo, cada, u, creada) =>
			crearEnWorld(world, { title: titulo, every: numero(cada), unit: unidad(u) }, fechaHora(creada))
	},
	{
		pattern: new RegExp(`^una tarea periódica relativa ${TITULO} nunca completada$`),
		run: (world, titulo) => crearEnWorld(world, { title: titulo, every: 1, unit: 'horas' }, ANTES_DEL_ESCENARIO)
	},
	{
		pattern: new RegExp(`^una tarea periódica relativa ${TITULO} nunca completada creada el ${P}$`),
		run: (world, titulo, creada) => crearEnWorld(world, { title: titulo, every: 1, unit: 'horas' }, fechaHora(creada))
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
			for (const estado of world.estados) expect(estado.kind).toBe(tipo);
		}
	},
	{
		pattern: new RegExp(`^el progreso es ${P}$`),
		run: (world, progreso) => {
			const estado = unicoEstado(world);
			if (estado.kind !== 'en espera') throw new Error(`Sin progreso: el estado es ${estado.kind}`);
			expect(estado.progress).toBeCloseTo(numero(progreso), 9);
		}
	},
	{
		pattern: /^se registró un completado sin ocurrencia cubierta$/,
		run: (world) => {
			expect(world.nuevoCompletado).toEqual({
				id: expect.any(String),
				taskId: laTarea(world).id,
				completedAt: world.momentoDelNuevoCompletado
			});
			expect(world.nuevoCompletado).not.toHaveProperty('coveredOccurrence');
		}
	},
	{
		pattern: /^el nuevo completado se agrega sin modificar los anteriores$/,
		run: (world) => {
			const anteriores = world.completadosAnteriores ?? [];
			expect(anteriores.length).toBeGreaterThan(0);
			expect(world.completions).toEqual([...anteriores, world.nuevoCompletado]);
			expect(anteriores.map((c) => c.id)).not.toContain(world.nuevoCompletado?.id);
		}
	}
];
