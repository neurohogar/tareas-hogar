// Primer paso de la tarea (spec §4.1, §6.1, §6.2): se escribe en el panel y la fila lo muestra
// solo en pendiente y atrasada. Una sola línea, recortada; vacío es sin campo; nunca inválido.
import { expect } from 'vitest';
import { crearPuntual, type DatosPuntual } from '../../src/lib/core/crear-puntual';
import { crearPeriodicaCalendario } from '../../src/lib/core/crear-periodica-calendario';
import { datosDeTarea } from '../../src/lib/core/datos-de-tarea';
import type { Tarea } from '../../src/lib/core/tarea';
import { AHORA, crearEnWorld, registrarCreacion } from './crear';
import { editaElOtro, editoYo } from './edicion';
import { diasDe, formaDe } from './periodica-calendario';
import { P, TITULO, numero, unidad } from './valores';
import { OTRO, elDocumento, laTarea, laTareaTitulada, type StepDefinition, type World } from './world';

const ESTADOS = ['pendiente', 'en espera', 'atrasada'];
const SOLO_ESPACIOS = '   ';

/** Un primer paso escrito con espacios de más al inicio y al final. */
const conMargenes = (texto: string) => `  ${texto}  `;

/** Los datos de la tarea con el primer paso escrito; el resto como estaba. */
const conPrimerPaso = (primerPaso: string) => (tarea: Tarea) => ({ ...datosDeTarea(tarea), primerPaso });

/** Un guardado con primer paso es aceptado: nunca rechaza (§4.1). */
function sinRechazo(world: World): void {
	expect(world.errores).toBeUndefined();
}

function crearPuntualConPrimerPaso(world: World, datos: DatosPuntual): void {
	registrarCreacion(world, (id) => crearPuntual(datos, id, AHORA));
	sinRechazo(world);
}

/** Deja la tarea ya guardada con ese primer paso, sin pasar por editar (no es un cambio "de mi lado"). */
function guardadaConPrimerPaso(world: World, tarea: Tarea, primerPaso: string): void {
	world.documentos = world.documentos.map((documento) => (documento.id === tarea.id ? { ...documento, primerPaso } : documento));
}

/** Cada forma de cambio del primer paso: "<sujeto> el primer paso a ...". */
const CAMBIOS: { texto: string; valor: (...valores: string[]) => string }[] = [
	{ texto: P, valor: (primerPaso) => primerPaso },
	{ texto: `${P} con espacios al inicio y al final`, valor: (primerPaso) => conMargenes(primerPaso) },
	{ texto: 'uno de solo espacios', valor: () => SOLO_ESPACIOS },
	{ texto: `uno de ${P} caracteres`, valor: (largo) => 'x'.repeat(numero(largo)) }
];

const EDITORES = [
	{ sujeto: 'edito', editar: editoYo },
	{ sujeto: `${OTRO} edita`, editar: editaElOtro }
];

const pasosDeEditar: StepDefinition[] = EDITORES.flatMap(({ sujeto, editar }) =>
	CAMBIOS.map(({ texto, valor }) => ({
		pattern: new RegExp(`^${sujeto} el primer paso a ${texto}$`),
		run: (world: World, ...valores: string[]) => {
			editar(world, conPrimerPaso(valor(...valores)));
			sinRechazo(world);
		}
	}))
);

/** En cada momento consultado, la lista tiene una sola fila y muestra ese texto de primer paso. */
function laFilaMuestraElPrimerPaso(world: World, texto: string | undefined): void {
	expect(world.consultasDePendientes.length).toBeGreaterThan(0);
	for (const filas of world.consultasDePendientes) expect(filas.map(({ textoDePrimerPaso }) => textoDePrimerPaso)).toEqual([texto]);
}

export const primerPasoSteps: StepDefinition[] = [
	...pasosDeEditar,
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y primer paso ${P}$`),
		run: (world, titulo, primerPaso) => crearPuntualConPrimerPaso(world, { titulo, primerPaso })
	},
	{
		pattern: new RegExp(`^creo una tarea periódica relativa con título ${P} cada ${P} ${P} y primer paso ${P}$`),
		run: (world, titulo, cada, u, primerPaso) => {
			crearEnWorld(world, { titulo, cada: numero(cada), unidad: unidad(u), primerPaso });
			sinRechazo(world);
		}
	},
	{
		pattern: new RegExp(`^creo una tarea periódica (semanal|mensual) con título ${P} (los|los días) ${P} y primer paso ${P}$`),
		run: (world, forma, titulo, conector, dias, primerPaso) => {
			const datos = { titulo, primerPaso, ...diasDe(formaDe(`${forma} ${conector}`), dias) };
			registrarCreacion(world, (id) => crearPeriodicaCalendario(datos, id, AHORA));
			sinRechazo(world);
		}
	},
	{
		pattern: new RegExp(`^creo una tarea puntual con título ${P} y un primer paso de solo espacios$`),
		run: (world, titulo) => crearPuntualConPrimerPaso(world, { titulo, primerPaso: SOLO_ESPACIOS })
	},
	{
		pattern: new RegExp(`^el primer paso de la tarea es ${P}$`),
		run: (world, primerPaso) => guardadaConPrimerPaso(world, laTarea(world), primerPaso)
	},
	{
		pattern: new RegExp(`^el primer paso de la tarea ${TITULO} es ${P}$`),
		run: (world, titulo, primerPaso) => guardadaConPrimerPaso(world, laTareaTitulada(world, titulo), primerPaso)
	},
	{
		// Quitar es vaciar el campo: la tarea queda sin primer paso.
		pattern: /^quito el primer paso$/,
		run: (world) => {
			editoYo(world, conPrimerPaso(''));
			sinRechazo(world);
		}
	},
	{
		pattern: new RegExp(`^${OTRO} quita el primer paso$`),
		run: (world) => {
			editaElOtro(world, conPrimerPaso(''));
			sinRechazo(world);
		}
	},
	{
		pattern: new RegExp(`^la tarea tiene primer paso ${P}$`),
		run: (world, primerPaso) => expect(laTarea(world).primerPaso).toBe(primerPaso)
	},
	{
		pattern: /^la tarea no tiene primer paso$/,
		run: (world) => expect(elDocumento(world)).not.toHaveProperty('primerPaso')
	},
	{
		pattern: new RegExp(`^la tarea tiene un primer paso de ${P} caracteres$`),
		run: (world, largo) => expect(laTarea(world).primerPaso).toHaveLength(numero(largo))
	},
	{
		// El estado esperado llega como valor de la tabla; el del primer paso es el de siempre (§5).
		pattern: new RegExp(`^el estado es ${P}$`),
		run: (world, tipo) => {
			expect(ESTADOS).toContain(tipo);
			expect(world.estados.length).toBeGreaterThan(0);
			for (const estado of world.estados) expect(estado.tipo).toBe(tipo);
		}
	},
	{
		pattern: new RegExp(`^la fila de la tarea muestra el primer paso ${P}$`),
		run: (world, texto) => laFilaMuestraElPrimerPaso(world, texto)
	},
	{
		pattern: /^la fila de la tarea no muestra primer paso$/,
		run: (world) => laFilaMuestraElPrimerPaso(world, undefined)
	}
];
