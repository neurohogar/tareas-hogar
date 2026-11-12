import { expect } from 'vitest';
import { textoDeEsfuerzo } from '../../src/lib/core/esfuerzo';
import { filtrarPorEtiqueta, filtroVigente } from '../../src/lib/core/filtro-por-etiqueta';
import { filasDePendientes } from '../../src/lib/core/pendientes';
import { filtrarSoloRapidas, textoDeListaVacia } from '../../src/lib/core/solo-rapidas';
import { CUALQUIER_MOMENTO } from './periodica-relativa';
import { P, fechaHora, lista } from './valores';
import { tareasDe, type FilaConsultada, type StepDefinition, type World } from './world';

/** Las filas de la lista, con el filtro por etiqueta elegido, Solo rápidas y los checks Mostrar completadas y Mostrar pausadas (§6.1). */
function filasEn(world: World, ahora: Date): FilaConsultada[] {
	const filas = filasDePendientes(tareasDe(world), world.completados, ahora, world.mostrarCompletadas, world.mostrarPausadas);
	const porEtiqueta = filtrarPorEtiqueta(filas, filtroVigente(world.filtro, world.etiquetas));
	return filtrarSoloRapidas(porEtiqueta, world.soloRapidas === true).map(({ tarea, completada, estado }) => ({
		titulo: tarea.titulo,
		completada,
		pausada: estado.tipo === 'pausada',
		esfuerzo: textoDeEsfuerzo(tarea.esfuerzo)
	}));
}

/** En cada momento consultado, los títulos de las filas que cumplen `incluida`, de arriba hacia abajo. */
function cadaConsultaMuestra(world: World, titulos: string[], incluida = (_: FilaConsultada) => true): void {
	expect(world.consultasDePendientes.length).toBeGreaterThan(0);
	for (const filas of world.consultasDePendientes) expect(filas.filter(incluida).map(({ titulo }) => titulo)).toEqual(titulos);
}

/** En cada momento consultado, la lista tiene una sola fila y muestra ese texto de esfuerzo. */
function laFilaMuestraElEsfuerzo(world: World, texto: string | undefined): void {
	expect(world.consultasDePendientes.length).toBeGreaterThan(0);
	for (const filas of world.consultasDePendientes) expect(filas.map(({ esfuerzo }) => esfuerzo)).toEqual([texto]);
}

const ESTADOS_DEL_BOTON: Record<string, boolean> = { encendido: true, apagado: false };

export const pendientesSteps: StepDefinition[] = [
	{
		pattern: /^Mostrar completadas está encendido$/,
		run: (world) => {
			world.mostrarCompletadas = true;
		}
	},
	{
		pattern: /^Mostrar pausadas está encendido$/,
		run: (world) => {
			world.mostrarPausadas = true;
		}
	},
	{
		pattern: new RegExp(`^Solo rápidas está ${P}$`),
		run: (world, estado) => {
			if (!Object.hasOwn(ESTADOS_DEL_BOTON, estado)) throw new Error(`Estado inválido: "${estado}"`);
			world.soloRapidas = ESTADOS_DEL_BOTON[estado];
		}
	},
	{
		pattern: new RegExp(`^consulto Pendientes el ${P}$`),
		run: (world, ahora) => {
			const momento = fechaHora(ahora);
			world.momentosDelEstado = [momento];
			world.consultasDePendientes = [filasEn(world, momento)];
		}
	},
	{
		pattern: /^consulto Pendientes en cualquier momento$/,
		run: (world) => {
			world.consultasDePendientes = CUALQUIER_MOMENTO.map((ahora) => filasEn(world, ahora));
		}
	},
	{
		pattern: new RegExp(`^Pendientes muestra en orden ${P}$`),
		run: (world, orden) => cadaConsultaMuestra(world, lista(orden))
	},
	{
		pattern: new RegExp(`^Pendientes muestra como completadas ${P}$`),
		run: (world, completadas) => cadaConsultaMuestra(world, lista(completadas), ({ completada }) => completada)
	},
	{
		pattern: new RegExp(`^Pendientes muestra como pausadas ${P}$`),
		run: (world, pausadas) => cadaConsultaMuestra(world, lista(pausadas), ({ pausada }) => pausada)
	},
	{
		pattern: /^Pendientes no muestra ninguna tarea$/,
		run: (world) => cadaConsultaMuestra(world, [])
	},
	{
		// El texto de lista vacía: solo se ve si la lista no tiene filas.
		pattern: new RegExp(`^Pendientes muestra el texto ${P}$`),
		run: (world, texto) => {
			cadaConsultaMuestra(world, []);
			expect(textoDeListaVacia(filtroVigente(world.filtro, world.etiquetas), world.soloRapidas === true)).toBe(texto);
		}
	},
	{
		pattern: new RegExp(`^la fila de la tarea muestra el esfuerzo ${P}$`),
		run: (world, texto) => laFilaMuestraElEsfuerzo(world, texto)
	},
	{
		pattern: /^la fila de la tarea no muestra esfuerzo$/,
		run: (world) => laFilaMuestraElEsfuerzo(world, undefined)
	}
];
