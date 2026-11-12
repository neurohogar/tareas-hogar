import { expect } from 'vitest';
import { crearPuntual, type DatosPuntual } from '../../src/lib/core/crear-puntual';
import type { Tarea } from '../../src/lib/core/tarea';
import { AHORA, ANTES_DEL_ESCENARIO, TITULO_VALIDO, registrarCreacion } from './crear';
import { registrarCompletado } from './periodica-relativa';
import { P, TITULO, fecha, fechaHora } from './valores';
import { elDocumento, laTarea, laTareaDeTipo, laTareaTitulada, type StepDefinition, type World } from './world';

/** Una fecha límite cualquiera: el escenario dice que no influye en el resultado. */
const UNA_FECHA_LIMITE = '2026-07-20';

/** Momentos de completados ya registrados: el escenario dice que no influyen en el resultado. */
const MOMENTOS_DE_COMPLETADOS = [new Date(2026, 6, 10, 9, 0, 0), new Date(2026, 6, 25, 18, 30, 0)];
const CANTIDAD_DE_COMPLETADOS = { 'un completado': 1, 'dos completados': 2 };
const CANTIDAD = `(${Object.keys(CANTIDAD_DE_COMPLETADOS).join('|')})`;

function registrarCompletados(world: World, tarea: Tarea, cantidad: string): void {
	const cuantos = CANTIDAD_DE_COMPLETADOS[cantidad as keyof typeof CANTIDAD_DE_COMPLETADOS];
	for (const momento of MOMENTOS_DE_COMPLETADOS.slice(0, cuantos)) registrarCompletado(world, momento, tarea);
}

/** La fecha límite llega como texto crudo: validarla es del dominio. */
function crear(world: World, datos: DatosPuntual, ahora = AHORA): void {
	registrarCreacion(world, (id) => crearPuntual(datos, id, ahora));
}

const laPuntual = (world: World) => laTareaDeTipo(world, 'puntual');

export const puntualSteps: StepDefinition[] = [
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y fecha límite ${P}$`),
		run: (world, titulo, fechaLimite) => crear(world, { titulo, fechaLimite })
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y sin fecha límite$`),
		run: (world, titulo) => crear(world, { titulo })
	},
	{
		pattern: /^creo una tarea puntual con un título de solo espacios y sin fecha límite$/,
		run: (world) => crear(world, { titulo: '   ' })
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con un título válido y fecha límite ${P}$`),
		run: (world, fechaLimite) => crear(world, { titulo: TITULO_VALIDO, fechaLimite })
	},
	{
		pattern: new RegExp(`^creo el ${P} una tarea puntual con un título válido y fecha límite ${P}$`),
		run: (world, creada, fechaLimite) => crear(world, { titulo: TITULO_VALIDO, fechaLimite }, fechaHora(creada))
	},
	{
		pattern: /^una tarea puntual sin fecha límite$/,
		run: (world) => crear(world, { titulo: 'Tarea' })
	},
	{
		pattern: new RegExp(`^una tarea puntual sin fecha límite creada el ${P}$`),
		run: (world, creada) => crear(world, { titulo: 'Tarea' }, fechaHora(creada))
	},
	{
		pattern: new RegExp(`^una tarea puntual con fecha límite ${P}$`),
		run: (world, fechaLimite) => crear(world, { titulo: 'Tarea', fechaLimite })
	},
	{
		pattern: new RegExp(`^una tarea puntual con fecha límite ${P} creada el ${P}$`),
		run: (world, fechaLimite, creada) => crear(world, { titulo: 'Tarea', fechaLimite }, fechaHora(creada))
	},
	{
		pattern: new RegExp(`^una tarea puntual ${TITULO} con fecha límite ${P}$`),
		run: (world, titulo, fechaLimite) => crear(world, { titulo, fechaLimite }, ANTES_DEL_ESCENARIO)
	},
	{
		pattern: new RegExp(`^una tarea puntual ${TITULO} con fecha límite ${P} creada el ${P}$`),
		run: (world, titulo, fechaLimite, creada) => crear(world, { titulo, fechaLimite }, fechaHora(creada))
	},
	{
		pattern: new RegExp(`^una tarea puntual ${TITULO} sin fecha límite$`),
		run: (world, titulo) => crear(world, { titulo }, ANTES_DEL_ESCENARIO)
	},
	{
		pattern: new RegExp(`^una tarea puntual ${TITULO} sin fecha límite creada el ${P}$`),
		run: (world, titulo, creada) => crear(world, { titulo }, fechaHora(creada))
	},
	{
		pattern: /^una tarea puntual con una fecha límite cualquiera$/,
		run: (world) => crear(world, { titulo: 'Tarea', fechaLimite: UNA_FECHA_LIMITE })
	},
	{
		pattern: /^se crea una tarea puntual$/,
		run: (world) => laPuntual(world)
	},
	{
		pattern: new RegExp(`^su fecha límite es ${P}$`),
		run: (world, fechaLimite) => expect(laPuntual(world).fechaLimite).toEqual(fecha(fechaLimite))
	},
	{
		pattern: /^la tarea no tiene fecha límite$/,
		run: (world) => expect(elDocumento(world)).not.toHaveProperty('fechaLimite')
	},
	{
		// Antes de tocar el checkbox declara los completados; después, afirma cuántos quedaron.
		pattern: new RegExp(`^la tarea tiene ${CANTIDAD}$`),
		run: (world, cantidad) => {
			if (!world.checkboxTocado) return registrarCompletados(world, laTarea(world), cantidad);
			expect(world.completados.filter(({ tareaId }) => tareaId === laTarea(world).id)).toHaveLength(CANTIDAD_DE_COMPLETADOS[cantidad as keyof typeof CANTIDAD_DE_COMPLETADOS]);
		}
	},
	{
		pattern: new RegExp(`^la tarea ${TITULO} tiene ${CANTIDAD}$`),
		run: (world, titulo, cantidad) => registrarCompletados(world, laTareaTitulada(world, titulo), cantidad)
	},
	{
		pattern: new RegExp(`^el completado registrado es del ${P}$`),
		run: (world, completada) => expect(world.nuevoCompletado?.completadoEn).toEqual(fechaHora(completada))
	}
];
