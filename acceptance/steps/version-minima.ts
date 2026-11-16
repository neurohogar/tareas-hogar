// Versión mínima de la tarea (spec §4.1, §4.4, §5.4, §6.1, §6.2, §6.3, §7): un campo opcional de una línea que
// la fila muestra en pendiente y atrasada con el botón «Hice la mínima», que completa como el checkbox y deja
// `fueMinima` en el completado. Nunca inválida: vacío o solo espacios es sin versión mínima.
import { expect } from 'vitest';
import { textoDelAviso } from '../../src/lib/core/aviso';
import { completadoMasReciente, completadosDeTarea } from '../../src/lib/core/completados';
import { crearPeriodicaCalendario } from '../../src/lib/core/crear-periodica-calendario';
import { crearPuntual, type DatosPuntual } from '../../src/lib/core/crear-puntual';
import { datosDeTarea } from '../../src/lib/core/datos-de-tarea';
import { aplicarCambio } from '../../src/lib/core/documento-de-tarea';
import { cambioAlCompletar } from '../../src/lib/core/paso-actual';
import type { Tarea } from '../../src/lib/core/tarea';
import { hacerLaMinima } from '../../src/lib/core/version-minima';
import { AHORA, crearEnWorld, registrarCreacion } from './crear';
import { editaElOtro, editoYo } from './edicion';
import { diasDe, formaDe } from './periodica-calendario';
import { completoYo, registrarCompletado } from './periodica-relativa';
import { P, TITULO, fechaHora, numero } from './valores';
import { OTRO, elDocumento, laTarea, laTareaTitulada, loQueVioElOtro, nuevoId, type StepDefinition, type World } from './world';

const SOLO_ESPACIOS = '   ';

/** Una versión mínima escrita con espacios de más al inicio y al final. */
const conMargenes = (texto: string) => `  ${texto}  `;

/** Los datos de la tarea con la versión mínima escrita; el resto como estaba. */
const conVersionMinima = (versionMinima: string) => (tarea: Tarea) => ({ ...datosDeTarea(tarea), versionMinima });

/** Un guardado con versión mínima es aceptado: nunca rechaza (§4.1). */
function sinRechazo(world: World): void {
	expect(world.errores).toBeUndefined();
}

function crearPuntualConMinima(world: World, datos: DatosPuntual): void {
	registrarCreacion(world, (id) => crearPuntual(datos, id, AHORA));
	sinRechazo(world);
}

/** Deja la tarea ya guardada con esa versión mínima, sin pasar por editar (no es un cambio "de mi lado"). */
function guardadaConMinima(world: World, tarea: Tarea, versionMinima: string): void {
	expect(versionMinima.trim()).not.toBe('');
	world.documentos = world.documentos.map((documento) => (documento.id === tarea.id ? { ...documento, versionMinima } : documento));
}

/** Cada forma de cambio de la versión mínima: "<sujeto> la versión mínima a ...". */
const CAMBIOS: { texto: string; valor: (...valores: string[]) => string }[] = [
	{ texto: P, valor: (minima) => minima },
	{ texto: `${P} con espacios al inicio y al final`, valor: (minima) => conMargenes(minima) },
	{ texto: 'una de solo espacios', valor: () => SOLO_ESPACIOS },
	{ texto: `una de ${P} caracteres`, valor: (largo) => 'x'.repeat(numero(largo)) }
];

const EDITORES = [
	{ sujeto: 'edito', editar: editoYo },
	{ sujeto: `${OTRO} edita`, editar: editaElOtro }
];

const pasosDeEditar: StepDefinition[] = EDITORES.flatMap(({ sujeto, editar }) =>
	CAMBIOS.map(({ texto, valor }) => ({
		pattern: new RegExp(`^${sujeto} la versión mínima a ${texto}$`),
		run: (world: World, ...valores: string[]) => {
			editar(world, conVersionMinima(valor(...valores)));
			sinRechazo(world);
		}
	}))
);

/** Un completado ya guardado con `fueMinima`, sin aviso y sin tocar el paso en que va la tarea. */
function completadaConLaMinima(world: World, tarea: Tarea, momento: string, paso?: string): void {
	const { id } = registrarCompletado(world, fechaHora(momento), tarea, true);
	if (paso === undefined) return;
	const pasoAlCompletar = numero(paso);
	expect(Number.isInteger(pasoAlCompletar) && pasoAlCompletar >= 1).toBe(true);
	world.completados = world.completados.map((completado) => (completado.id === id ? { ...completado, pasoAlCompletar } : completado));
}

/** «Hice la mínima» desde este dispositivo: lo que decide el core, con el aviso y el paso 1 como el checkbox. */
function tocoLaMinima(world: World, tarea: Tarea, momento: Date): void {
	world.checkboxTocado = true;
	// Sin una consulta antes, lo que se afirma después es del momento en que se tocó.
	if (world.momentosDelEstado.length === 0) world.momentosDelEstado = [momento];
	completoYo(world, momento, tarea, hacerLaMinima);
}

/** El otro dispositivo decide con lo que veía; su completado llega a lo guardado. */
function tocaLaMinimaElOtro(world: World, momento: Date): void {
	const visto = loQueVioElOtro(world);
	const tarea = laTarea(visto);
	const completado = hacerLaMinima(tarea, visto.completados, nuevoId(world, 'completado'), momento);
	if (!completado) return;
	world.completados = [...world.completados, completado];
	world.documentos = aplicarCambio(world.documentos, tarea.id, cambioAlCompletar(tarea));
}

const elUltimoCompletado = (world: World) => {
	const completados = completadosDeTarea(world.completados, laTarea(world).id);
	expect(completados.length).toBeGreaterThan(0);
	return completadoMasReciente(completados);
};

/** En cada momento consultado, la lista tiene una sola fila y esa es su línea de mínima. */
function laFilaMuestraLaMinima(world: World, linea: string | undefined): void {
	expect(world.consultasDePendientes.length).toBeGreaterThan(0);
	for (const filas of world.consultasDePendientes) expect(filas.map(({ minima }) => minima?.texto)).toEqual([linea]);
}

const ESTADOS_DEL_BOTON: Record<string, boolean> = { habilitado: true, deshabilitado: false };

export const versionMinimaSteps: StepDefinition[] = [
	...pasosDeEditar,
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y versión mínima ${P}$`),
		run: (world, titulo, versionMinima) => crearPuntualConMinima(world, { titulo, versionMinima })
	},
	{
		pattern: new RegExp(`^creo una tarea periódica relativa con título ${P} cada 2 dias y versión mínima ${P}$`),
		run: (world, titulo, versionMinima) => {
			crearEnWorld(world, { titulo, cada: 2, unidad: 'dias', versionMinima });
			sinRechazo(world);
		}
	},
	{
		pattern: new RegExp(`^creo una tarea periódica semanal con título ${P} los ${P} y versión mínima ${P}$`),
		run: (world, titulo, dias, versionMinima) => {
			const datos = { titulo, versionMinima, ...diasDe(formaDe('semanal los'), dias) };
			registrarCreacion(world, (id) => crearPeriodicaCalendario(datos, id, AHORA));
			sinRechazo(world);
		}
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y una versión mínima de solo espacios$`),
		run: (world, titulo) => crearPuntualConMinima(world, { titulo, versionMinima: SOLO_ESPACIOS })
	},
	{
		pattern: new RegExp(`^la versión mínima de la tarea es ${P}$`),
		run: (world, versionMinima) => guardadaConMinima(world, laTarea(world), versionMinima)
	},
	{
		pattern: new RegExp(`^la versión mínima de la tarea ${TITULO} es ${P}$`),
		run: (world, titulo, versionMinima) => guardadaConMinima(world, laTareaTitulada(world, titulo), versionMinima)
	},
	{
		// Quitar es vaciar el campo: la tarea queda sin versión mínima.
		pattern: /^quito la versión mínima$/,
		run: (world) => {
			editoYo(world, conVersionMinima(''));
			sinRechazo(world);
		}
	},
	{
		pattern: new RegExp(`^${OTRO} quita la versión mínima$`),
		run: (world) => {
			editaElOtro(world, conVersionMinima(''));
			sinRechazo(world);
		}
	},
	{
		pattern: new RegExp(`^la tarea tiene versión mínima ${P}$`),
		run: (world, versionMinima) => expect(laTarea(world).versionMinima).toBe(versionMinima)
	},
	{
		pattern: /^la tarea no tiene versión mínima$/,
		run: (world) => expect(elDocumento(world)).not.toHaveProperty('versionMinima')
	},
	{
		pattern: new RegExp(`^la tarea tiene una versión mínima de ${P} caracteres$`),
		run: (world, largo) => expect(laTarea(world).versionMinima).toHaveLength(numero(largo))
	},
	{
		pattern: new RegExp(`^la fila de la tarea muestra la mínima ${P}$`),
		run: (world, texto) => laFilaMuestraLaMinima(world, texto)
	},
	{
		pattern: /^la fila de la tarea no muestra mínima$/,
		run: (world) => laFilaMuestraLaMinima(world, undefined)
	},
	{
		pattern: /^el botón Hice la mínima de la tarea está (habilitado|deshabilitado)$/,
		run: (world, estado) => {
			expect(Object.hasOwn(ESTADOS_DEL_BOTON, estado)).toBe(true);
			expect(world.consultasDePendientes.length).toBeGreaterThan(0);
			for (const filas of world.consultasDePendientes) expect(filas.map(({ minima }) => minima?.habilitado)).toEqual([ESTADOS_DEL_BOTON[estado]]);
		}
	},
	{
		pattern: new RegExp(`^toco Hice la mínima el ${P}$`),
		run: (world, momento) => tocoLaMinima(world, laTarea(world), fechaHora(momento))
	},
	{
		pattern: new RegExp(`^toco Hice la mínima en la tarea ${TITULO} el ${P}$`),
		run: (world, titulo, momento) => tocoLaMinima(world, laTareaTitulada(world, titulo), fechaHora(momento))
	},
	{
		pattern: new RegExp(`^${OTRO} toca Hice la mínima el ${P}$`),
		run: (world, momento) => tocaLaMinimaElOtro(world, fechaHora(momento))
	},
	{
		pattern: new RegExp(`^la tarea fue completada el ${P} con la mínima$`),
		run: (world, momento) => completadaConLaMinima(world, laTarea(world), momento)
	},
	{
		pattern: new RegExp(`^la tarea ${TITULO} fue completada el ${P} con la mínima$`),
		run: (world, titulo, momento) => completadaConLaMinima(world, laTareaTitulada(world, titulo), momento)
	},
	{
		pattern: new RegExp(`^la tarea fue completada el ${P} en el paso ${P} con la mínima$`),
		run: (world, momento, paso) => completadaConLaMinima(world, laTarea(world), momento, paso)
	},
	{
		pattern: /^el último completado de la tarea fue la mínima$/,
		run: (world) => expect(elUltimoCompletado(world).fueMinima).toBe(true)
	},
	{
		pattern: /^el último completado de la tarea fue entero$/,
		run: (world) => expect(elUltimoCompletado(world)).not.toHaveProperty('fueMinima')
	},
	{
		pattern: new RegExp(`^el aviso del completado dice ${P}$`),
		run: (world, texto) => {
			const aviso = world.avisoConsultado?.aviso;
			expect(aviso).toBeDefined();
			expect(textoDelAviso(aviso!)).toBe(texto);
		}
	},
	{
		pattern: /^la tarea tiene dos completados, uno entero y uno de la mínima$/,
		run: (world) => {
			const completados = completadosDeTarea(world.completados, laTarea(world).id);
			expect(completados.map(({ fueMinima }) => fueMinima === true).sort()).toEqual([false, true]);
		}
	}
];
