// Pausar y reanudar una periódica (spec §5.8, §6.2, §7): el botón del panel de
// edición actúa en el momento, sin Guardar.
import { expect } from 'vitest';
import { aplicarCambio, type CambioDeTarea } from '../../src/lib/core/documento-de-tarea';
import { accionDePausa, pausar, reanudar } from '../../src/lib/core/pausa';
import type { Tarea } from '../../src/lib/core/tarea';
import { P, TITULO, fechaHora } from './valores';
import { OTRO, cambiosAlEditar, elDocumento, laTarea, laTareaTitulada, loQueVioElOtro, recordarAntesDeMiCambio, type StepDefinition, type World } from './world';

const laElegida = (world: World, titulo?: string) => (titulo === undefined ? laTarea(world) : laTareaTitulada(world, titulo));

export function guardarCambio(world: World, tarea: Tarea, cambio: CambioDeTarea): void {
	world.documentos = aplicarCambio(world.documentos, tarea.id, cambio);
}

/** Toco el botón de pausa del panel: tiene que ofrecer esa acción (§6.2). */
function tocoElBoton(world: World, accion: 'pausar' | 'reanudar', cambio: CambioDeTarea, titulo?: string): void {
	const tarea = laElegida(world, titulo);
	expect(accionDePausa(tarea)).toBe(accion);
	recordarAntesDeMiCambio(world);
	guardarCambio(world, tarea, cambio);
}

const BOTONES: Record<string, 'pausar' | 'reanudar'> = { Pausar: 'pausar', Reanudar: 'reanudar' };

function boton(texto: string): 'pausar' | 'reanudar' {
	const accion = BOTONES[texto];
	if (!accion) throw new Error(`Botón de pausa inválido: "${texto}"`);
	return accion;
}

export function elPanel(world: World): NonNullable<World['panel']> {
	if (!world.panel) throw new Error('El panel de edición no está abierto');
	return world.panel;
}

export const pausarSteps: StepDefinition[] = [
	{
		pattern: /^pauso la tarea$/,
		run: (world) => tocoElBoton(world, 'pausar', pausar())
	},
	{
		pattern: new RegExp(`^pauso la tarea ${TITULO}$`),
		run: (world, titulo) => tocoElBoton(world, 'pausar', pausar(), titulo)
	},
	{
		pattern: /^la tarea fue pausada$/,
		run: (world) => guardarCambio(world, laTarea(world), pausar())
	},
	{
		pattern: new RegExp(`^la tarea ${TITULO} fue pausada$`),
		run: (world, titulo) => guardarCambio(world, laTareaTitulada(world, titulo), pausar())
	},
	{
		pattern: new RegExp(`^${OTRO} pausa la tarea$`),
		run: (world) => guardarCambio(world, laTarea(loQueVioElOtro(world)), pausar())
	},
	{
		pattern: new RegExp(`^reanudo la tarea el ${P}$`),
		run: (world, momento) => tocoElBoton(world, 'reanudar', reanudar(fechaHora(momento)))
	},
	{
		pattern: new RegExp(`^reanudo la tarea ${TITULO} el ${P}$`),
		run: (world, titulo, momento) => tocoElBoton(world, 'reanudar', reanudar(fechaHora(momento)), titulo)
	},
	{
		// §4.1: sin el campo, no está pausada.
		pattern: /^la tarea está pausada$/,
		run: (world) => expect(elDocumento(world).pausada).toBe(true)
	},
	{
		pattern: /^la tarea no está pausada$/,
		run: (world) => expect(elDocumento(world)).not.toHaveProperty('pausada')
	},
	{
		pattern: /^abro la tarea en el panel de edición$/,
		run: (world) => {
			const tarea = laTarea(world);
			world.panel = { pausa: accionDePausa(tarea), cambios: cambiosAlEditar(world, tarea) };
		}
	},
	{
		pattern: new RegExp(`^el panel de edición ofrece ${P}$`),
		run: (world, accion) => expect(elPanel(world).pausa).toBe(boton(accion))
	},
	{
		pattern: /^el panel de edición no ofrece pausar$/,
		run: (world) => expect(elPanel(world).pausa).toBeUndefined()
	}
];
